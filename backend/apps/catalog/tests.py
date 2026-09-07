from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError
from django.test import SimpleTestCase, TestCase, override_settings
from django.urls import reverse

from apps.catalog.models import Category, Industry, Product


class CatalogApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(name="Acids")
        cls.industry = Industry.objects.create(name="Water Treatment")

        cls.product = Product.objects.create(
            name="Hydrochloric Acid 33%",
            sku="TEST-HCL-0001",
            category=cls.category,
            cas_number="7647-01-0",
            chemical_formula="HCl",
            short_description="Technical grade hydrochloric acid for pH control.",
            grade=Product.Grade.INDUSTRIAL,
            is_featured=True,
        )
        cls.product.industries.add(cls.industry)

        Product.objects.create(
            name="Unpublished Reagent",
            sku="TEST-HIDDEN-0002",
            category=cls.category,
            short_description="Should never appear in the API.",
            is_published=False,
        )

    def test_slug_is_generated(self):
        self.assertEqual(self.product.slug, "hydrochloric-acid-33")

    def test_list_excludes_unpublished(self):
        response = self.client.get(reverse("api:product-list"))
        self.assertEqual(response.status_code, 200)
        names = [row["name"] for row in response.json()["results"]]
        self.assertIn("Hydrochloric Acid 33%", names)
        self.assertNotIn("Unpublished Reagent", names)

    def test_search_by_cas_number(self):
        response = self.client.get(reverse("api:product-list"), {"q": "7647-01-0"})
        self.assertEqual(response.json()["count"], 1)

    def test_filter_by_industry(self):
        response = self.client.get(
            reverse("api:product-list"), {"industry": "water-treatment"}
        )
        self.assertEqual(response.json()["count"], 1)

    def test_facets_use_value_alias(self):
        """`slug` would collide with Product.slug — the alias must be `value`."""
        response = self.client.get(reverse("api:product-facets"))
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["total"], 1)
        self.assertEqual(payload["categories"][0]["value"], "acids")

    def test_detail_increments_view_count(self):
        url = reverse("api:product-detail", args=[self.product.slug])
        self.assertEqual(self.client.get(url).status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(self.product.view_count, 1)

    def test_taxonomies_return_plain_arrays(self):
        """The frontend maps these directly; pagination would break it."""
        for name in ("api:category-list", "api:industry-list"):
            with self.subTest(endpoint=name):
                self.assertIsInstance(self.client.get(reverse(name)).json(), list)


# Celery runs eagerly in tests, so a product save would otherwise submit a
# fake URL to the real Search Console property configured in .env.
@override_settings(GOOGLE_INDEXING_ENABLED=False)
class DuplicateProductTests(TestCase):
    """Product.name_key + AdminProductSerializer.validate_name.

    Before these, SluggedModel.save() resolved a name collision by appending
    -2/-3 to the slug, so the admin panel silently accepted the same product
    over and over — 45 duplicate listings accumulated that way.
    """

    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(name="Solvents")
        cls.product = Product.objects.create(
            name="Xylene",
            category=cls.category,
            short_description="Aromatic solvent.",
        )
        cls.admin = get_user_model().objects.create_user(
            username="dupe-admin", password="pw", is_staff=True, is_superuser=True
        )

    def setUp(self):
        self.client.force_login(self.admin)

    def _create(self, name):
        return self.client.post(
            reverse("api:admin:admin-product-list"),
            {
                "name": name,
                "category": self.category.id,
                "short_description": "Another listing.",
            },
            content_type="application/json",
        )

    def test_name_key_is_normalized(self):
        self.assertEqual(self.product.name_key, "xylene")
        product = Product.objects.create(
            name="Acetone, Technical Grade  ",
            category=self.category,
            short_description="x",
        )
        self.assertEqual(product.name_key, "acetone technical grade")

    def test_exact_duplicate_is_rejected(self):
        response = self._create("Xylene")
        self.assertEqual(response.status_code, 400)
        self.assertIn("already exists", str(response.json()["name"]))

    def test_punctuation_and_case_variants_are_rejected(self):
        for name in ("xylene", "XYLENE.", "  Xylene  "):
            with self.subTest(name=name):
                self.assertEqual(self._create(name).status_code, 400)

    def test_british_american_spelling_is_the_same_product(self):
        Product.objects.create(
            name="Sulphuric Acid 98%",
            category=self.category,
            short_description="x",
        )
        self.assertEqual(self._create("Sulfuric Acid 98%").status_code, 400)

    def test_concentration_still_distinguishes_products(self):
        """Digits carry meaning — 33% and 25% are genuinely different products."""
        self.assertEqual(self._create("Xylene 45% Technical Grade").status_code, 201)

    def test_editing_a_product_under_its_own_name_is_allowed(self):
        response = self.client.patch(
            reverse("api:admin:admin-product-detail", args=[self.product.id]),
            {"name": "Xylene", "short_description": "Updated copy."},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

    def test_database_refuses_a_duplicate_that_bypasses_the_serializer(self):
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                name="  xylene ",
                category=self.category,
                short_description="Straight to the ORM.",
            )


class DraftCostTests(SimpleTestCase):
    """The per-draft cost target (settings.OPENAI_DRAFT_COST_BUDGET_USD).

    A draft is meant to cost about $0.0015. Nothing enforces that at runtime —
    it is a product of the model, the output cap and whether the billed-by-the
    -call web search tool is on — so these pin the arithmetic that reports it
    and the two configurations it is meant to report on.
    """

    class _Usage:
        """The subset of an OpenAI Responses usage object we price from."""

        class _Details:
            def __init__(self, cached):
                self.cached_tokens = cached

        def __init__(self, input_tokens, output_tokens, cached=0):
            self.input_tokens = input_tokens
            self.output_tokens = output_tokens
            self.input_tokens_details = self._Details(cached)

    @override_settings(
        OPENAI_INPUT_USD_PER_MTOK=0.40,
        OPENAI_CACHED_INPUT_USD_PER_MTOK=0.10,
        OPENAI_OUTPUT_USD_PER_MTOK=1.60,
        OPENAI_WEB_SEARCH_USD_PER_CALL=0.025,
        OPENAI_DRAFT_COST_BUDGET_USD=0.0025,
    )
    def test_a_typical_draft_stays_inside_the_budget(self):
        """gpt-4.1-mini rates, a photo-sized input and a full-length draft."""
        from apps.catalog.ai import _estimate_cost_usd

        # ~1.2k cached prompt/schema prefix + ~1.4k of fresh text and image
        # tokens, and an output at the OPENAI_MAX_OUTPUT_TOKENS ceiling.
        cost = _estimate_cost_usd(
            self._Usage(input_tokens=2600, output_tokens=900, cached=1200),
            web_search=False,
        )
        self.assertLess(cost, 0.0025)

    @override_settings(
        OPENAI_INPUT_USD_PER_MTOK=0.40,
        OPENAI_CACHED_INPUT_USD_PER_MTOK=0.10,
        OPENAI_OUTPUT_USD_PER_MTOK=1.60,
        OPENAI_WEB_SEARCH_USD_PER_CALL=0.025,
    )
    def test_web_search_is_what_breaks_the_budget(self):
        """$25/1k calls dwarfs the tokens — the reason it is off by default."""
        from apps.catalog.ai import _estimate_cost_usd

        usage = self._Usage(input_tokens=2600, output_tokens=900, cached=1200)
        self.assertGreater(
            _estimate_cost_usd(usage, web_search=True),
            10 * _estimate_cost_usd(usage, web_search=False),
        )

    def test_cached_tokens_are_discounted_not_double_charged(self):
        """cached_tokens is a subset of input_tokens, so it must be netted off."""
        from apps.catalog.ai import _estimate_cost_usd

        with override_settings(
            OPENAI_INPUT_USD_PER_MTOK=1.0,
            OPENAI_CACHED_INPUT_USD_PER_MTOK=0.0,
            OPENAI_OUTPUT_USD_PER_MTOK=0.0,
        ):
            cost = _estimate_cost_usd(
                self._Usage(input_tokens=1_000_000, output_tokens=0, cached=750_000),
                web_search=False,
            )
        self.assertAlmostEqual(cost, 0.25)

    def test_industries_are_constrained_to_the_catalog_s_own_list(self):
        """The model picks from an enum, so a draft can only name real rows."""
        from apps.catalog.ai import _response_schema

        schema = _response_schema(["Water Treatment", "Mining"])
        industries = schema["properties"]["industries"]
        self.assertEqual(industries["items"]["enum"], ["Water Treatment", "Mining"])
        # strict mode rejects a property that isn't also required.
        self.assertIn("industries", schema["required"])

    def test_industries_are_left_out_when_there_are_none_to_choose_from(self):
        """No Industry rows ⇒ no field, rather than an empty enum the API rejects."""
        from apps.catalog.ai import _response_schema

        schema = _response_schema([])
        self.assertNotIn("industries", schema["properties"])
        self.assertNotIn("industries", schema["required"])

    def test_building_the_schema_leaves_the_base_untouched(self):
        """Each draft builds its own; a leaked mutation would stack enums."""
        from apps.catalog.ai import _BASE_SCHEMA, _response_schema

        _response_schema(["Mining"])
        self.assertNotIn("industries", _BASE_SCHEMA["properties"])
        self.assertNotIn("industries", _BASE_SCHEMA["required"])

    def test_without_search_the_prompt_forbids_hazard_data_outright(self):
        """No search tool ⇒ hazard fields must come back empty, not remembered."""
        from apps.catalog.ai import _system_prompt

        no_search = _system_prompt(web_search=False)
        self.assertIn("no way to source them", no_search)
        self.assertIn("Leave all three empty", no_search)
        self.assertNotIn("web_search tool", no_search)

        self.assertIn("web_search tool", _system_prompt(web_search=True))
