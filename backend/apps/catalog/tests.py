from django.test import TestCase
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
