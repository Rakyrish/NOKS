"""Chemical product catalog: categories, industries, manufacturers, products."""

import re

from django.core.files.storage import FileSystemStorage
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify

from apps.core.models import OrderedModel, SEOModel, SluggedModel, TimeStampedModel


def normalize_product_name(name: str) -> str:
    """Collapse a product name to the key used to detect duplicate listings.

    Case, punctuation and spacing carry no meaning in a chemical name, so
    "Acetone, Technical Grade" and "Acetone Technical Grade" are the same
    product and must not both exist — that punctuation-only difference is
    exactly what let a pile of duplicates through before Product.name_key
    was made unique. British/American -sulph-/-sulf- spellings are folded
    together for the same reason ("Sulphuric Acid 98%" == "Sulfuric Acid 98%").

    Digits are deliberately kept: concentration and grade numbers DO
    distinguish products ("Hydrochloric Acid 33%" vs "... 25%").
    """
    key = name.lower().replace("sulph", "sulf")
    key = re.sub(r"[^a-z0-9]+", " ", key)
    return " ".join(key.split())


class Category(TimeStampedModel, SluggedModel, SEOModel, OrderedModel):
    """Self-nesting product taxonomy (Industrial Chemicals → Acids → …)."""

    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE, related_name="children"
    )
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=40, blank=True, help_text="Lucide icon name")
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    is_featured = models.BooleanField(default=False, db_index=True)

    class Meta(OrderedModel.Meta):
        verbose_name_plural = "Categories"

    @property
    def full_path(self):
        return f"{self.parent.name} / {self.name}" if self.parent else self.name


class Industry(TimeStampedModel, SluggedModel, SEOModel, OrderedModel):
    """Water Treatment, Food Processing, Mining, …"""

    tagline = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=40, blank=True)
    image = models.ImageField(upload_to="industries/", blank=True, null=True)
    accent_color = models.CharField(
        max_length=9, blank=True, help_text="Optional hex accent, defaults to brand colour."
    )
    applications = models.JSONField(default=list, blank=True)
    is_featured = models.BooleanField(default=True, db_index=True)

    class Meta(OrderedModel.Meta):
        verbose_name_plural = "Industries"


class Manufacturer(TimeStampedModel, SluggedModel, OrderedModel):
    country = models.CharField(max_length=80, blank=True)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="manufacturers/", blank=True, null=True)


class ProductQuerySet(models.QuerySet):
    def published(self):
        return self.filter(is_published=True)

    def with_relations(self):
        return self.select_related("category", "manufacturer").prefetch_related(
            "industries", "images"
        )


class Product(TimeStampedModel, SluggedModel, SEOModel):
    class Availability(models.TextChoices):
        IN_STOCK = "in_stock", "In stock"
        LOW_STOCK = "low_stock", "Low stock"
        MADE_TO_ORDER = "made_to_order", "Made to order"
        OUT_OF_STOCK = "out_of_stock", "Out of stock"

    class Grade(models.TextChoices):
        INDUSTRIAL = "industrial", "Industrial grade"
        TECHNICAL = "technical", "Technical grade"
        LABORATORY = "laboratory", "Laboratory / analytical grade"
        FOOD = "food", "Food grade"
        PHARMA = "pharma", "Pharmaceutical grade"

    # ── Identity ────────────────────────────────────────────────
    sku = models.CharField(max_length=64, unique=True, db_index=True)
    # Normalized form of `name`, kept unique so the database itself refuses a
    # second listing of the same product. SluggedModel.save() would otherwise
    # quietly resolve the collision by appending -2/-3 to the slug and create
    # the duplicate anyway. Maintained in save(); never edited directly.
    name_key = models.CharField(max_length=220, unique=True, editable=False)
    chemical_formula = models.CharField(max_length=120, blank=True)
    cas_number = models.CharField(
        max_length=40, blank=True, db_index=True, verbose_name="CAS number"
    )
    hs_code = models.CharField(max_length=30, blank=True, verbose_name="HS code")
    synonyms = models.CharField(
        max_length=400, blank=True, help_text="Comma separated alternative names."
    )
    grade = models.CharField(max_length=20, choices=Grade.choices, default=Grade.INDUSTRIAL)
    purity = models.CharField(max_length=60, blank=True, help_text="e.g. ≥ 98%")

    # ── Relations ───────────────────────────────────────────────
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products"
    )
    industries = models.ManyToManyField(Industry, blank=True, related_name="products")
    manufacturer = models.ForeignKey(
        Manufacturer, null=True, blank=True, on_delete=models.SET_NULL, related_name="products"
    )
    related_products = models.ManyToManyField("self", blank=True, symmetrical=False)
    frequently_bought_together = models.ManyToManyField(
        "self", blank=True, symmetrical=False, related_name="bought_with"
    )

    # ── Content ─────────────────────────────────────────────────
    short_description = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    applications = models.JSONField(default=list, blank=True)
    benefits = models.JSONField(default=list, blank=True)
    specifications = models.JSONField(
        default=dict, blank=True, help_text='{"Appearance": "White crystalline powder"}'
    )
    packaging_options = models.JSONField(
        default=list, blank=True, help_text='["25 kg bag", "1000 kg IBC"]'
    )
    storage_handling = models.TextField(blank=True)
    safety_information = models.TextField(blank=True)
    hazard_class = models.CharField(max_length=80, blank=True)

    # ── Commerce ────────────────────────────────────────────────
    availability = models.CharField(
        max_length=20, choices=Availability.choices, default=Availability.IN_STOCK, db_index=True
    )
    unit = models.CharField(max_length=30, default="kg")
    min_order_quantity = models.PositiveIntegerField(
        default=1, validators=[MinValueValidator(1)]
    )
    price_on_request = models.BooleanField(default=True)
    indicative_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    currency = models.CharField(max_length=8, default="KES")
    lead_time = models.CharField(max_length=80, blank=True, help_text="e.g. 2–5 working days")

    # ── Flags & metrics ─────────────────────────────────────────
    is_published = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    is_bestseller = models.BooleanField(default=False, db_index=True)
    view_count = models.PositiveIntegerField(default=0, editable=False)
    quote_count = models.PositiveIntegerField(default=0, editable=False)

    # Set when any field on this product was ever populated from an AI-drafted
    # suggestion (apps.catalog.ai), so admins can see which listings still want
    # a human fact-check. Never set by the AI call itself — only by the create/
    # update view once a staff member has actually saved the draft.
    ai_generated = models.BooleanField(default=False, editable=False)

    objects = ProductQuerySet.as_manager()

    class Meta:
        ordering = ["-is_featured", "name"]
        indexes = [
            models.Index(fields=["is_published", "is_featured"]),
            models.Index(fields=["category", "is_published"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    def save(self, *args, **kwargs):
        if not self.sku:
            base = slugify(self.name).upper().replace("-", "")[:10] or "PROD"
            self.sku = f"NOKS-{base}-{Product.objects.count() + 1:04d}"
        self.name_key = normalize_product_name(self.name)
        super().save(*args, **kwargs)

    @property
    def primary_image(self):
        return self.images.first()


class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/%Y/%m/")
    alt_text = models.CharField(max_length=250, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.alt_text or f"Image for {self.product_id}"


class ProductDocument(TimeStampedModel):
    class DocType(models.TextChoices):
        TDS = "tds", "Technical datasheet"
        SDS = "sds", "Safety datasheet (MSDS)"
        COA = "coa", "Certificate of analysis"
        SPEC = "spec", "Specification sheet"
        BROCHURE = "brochure", "Brochure"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="documents")
    doc_type = models.CharField(max_length=20, choices=DocType.choices, default=DocType.TDS)
    title = models.CharField(max_length=200)
    # Explicit local storage: TDS/SDS/COA/spec/brochure files must not ride
    # Cloudinary's image-typed default storage (see STORAGES in settings.py).
    file = models.FileField(upload_to="documents/%Y/%m/", storage=FileSystemStorage())
    is_public = models.BooleanField(
        default=True, help_text="Public documents download without a quote request."
    )

    class Meta:
        ordering = ["doc_type", "title"]

    def __str__(self):
        return f"{self.get_doc_type_display()} — {self.title}"


class PackageSize(TimeStampedModel):
    """Filterable package sizes shared across products."""

    label = models.CharField(max_length=60, unique=True)
    products = models.ManyToManyField(Product, blank=True, related_name="package_sizes")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "label"]

    def __str__(self):
        return self.label
