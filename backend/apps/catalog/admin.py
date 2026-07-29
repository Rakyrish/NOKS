from django.contrib import admin
from django.db.models import Count
from django.utils.html import format_html
from import_export import resources
from import_export.admin import ImportExportModelAdmin

from .models import (
    Category,
    Industry,
    Manufacturer,
    PackageSize,
    Product,
    ProductDocument,
    ProductImage,
)

SEO_FIELDSET = (
    "Search engine optimisation",
    {
        "classes": ("collapse",),
        "fields": (
            "meta_title",
            "meta_description",
            "meta_keywords",
            "og_image",
            "canonical_url",
            "noindex",
        ),
    },
)


class ProductResource(resources.ModelResource):
    """Bulk CSV/Excel import-export of the catalog."""

    class Meta:
        model = Product
        import_id_fields = ("sku",)
        skip_unchanged = True
        report_skipped = True
        fields = (
            "id", "sku", "name", "slug", "chemical_formula", "cas_number", "hs_code",
            "synonyms", "grade", "purity", "category", "manufacturer",
            "short_description", "description", "availability", "unit",
            "min_order_quantity", "price_on_request", "indicative_price", "currency",
            "lead_time", "hazard_class", "is_published", "is_featured", "is_bestseller",
        )


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image", "preview", "alt_text", "order")
    readonly_fields = ("preview",)

    @admin.display(description="Preview")
    def preview(self, obj):
        if obj.pk and obj.image:
            return format_html(
                '<img src="{}" style="height:60px;border-radius:8px;object-fit:cover" />',
                obj.image.url,
            )
        return "—"


class ProductDocumentInline(admin.TabularInline):
    model = ProductDocument
    extra = 1
    fields = ("doc_type", "title", "file", "is_public")


@admin.register(Product)
class ProductAdmin(ImportExportModelAdmin):
    resource_class = ProductResource
    inlines = [ProductImageInline, ProductDocumentInline]
    list_display = (
        "thumbnail", "name", "sku", "category", "grade",
        "availability_badge", "is_published", "is_featured", "quote_count",
    )
    list_display_links = ("thumbnail", "name")
    list_filter = (
        "is_published", "is_featured", "is_bestseller",
        "availability", "grade", "category", "industries", "manufacturer",
    )
    search_fields = ("name", "sku", "cas_number", "synonyms", "chemical_formula")
    list_editable = ("is_published", "is_featured")
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("category", "manufacturer")
    filter_horizontal = ("industries", "related_products", "frequently_bought_together")
    readonly_fields = ("view_count", "quote_count", "created_at", "updated_at")
    list_per_page = 30
    save_on_top = True
    actions = ["publish", "unpublish", "feature", "unfeature"]

    fieldsets = (
        ("Identity", {
            "fields": (
                ("name", "slug"), ("sku", "cas_number"),
                ("chemical_formula", "hs_code"), ("grade", "purity"), "synonyms",
            )
        }),
        ("Classification", {"fields": ("category", "industries", "manufacturer")}),
        ("Content", {
            "fields": (
                "short_description", "description", "applications",
                "benefits", "specifications",
            )
        }),
        ("Packaging, storage & safety", {
            "fields": (
                "packaging_options", "storage_handling",
                "safety_information", "hazard_class",
            )
        }),
        ("Commercial", {
            "fields": (
                ("availability", "lead_time"), ("unit", "min_order_quantity"),
                ("price_on_request", "indicative_price", "currency"),
            )
        }),
        ("Cross-selling", {
            "classes": ("collapse",),
            "fields": ("related_products", "frequently_bought_together"),
        }),
        ("Visibility", {"fields": (("is_published", "is_featured", "is_bestseller"),)}),
        SEO_FIELDSET,
        ("Metrics", {
            "classes": ("collapse",),
            "fields": (("view_count", "quote_count"), ("created_at", "updated_at")),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("category", "manufacturer")

    @admin.display(description="")
    def thumbnail(self, obj):
        image = obj.images.first()
        if image:
            return format_html(
                '<img src="{}" style="height:38px;width:38px;border-radius:8px;'
                'object-fit:cover;background:#F5F7FB" />',
                image.image.url,
            )
        return format_html(
            '<div style="height:38px;width:38px;border-radius:8px;background:#EEF3FF;'
            'display:flex;align-items:center;justify-content:center;color:#0C48E6;'
            'font-weight:700;font-size:11px">{}</div>',
            obj.name[:2].upper(),
        )

    @admin.display(description="Availability", ordering="availability")
    def availability_badge(self, obj):
        colors = {
            "in_stock": ("#059669", "#ECFDF5"),
            "low_stock": ("#B45309", "#FFFBEB"),
            "made_to_order": ("#0C48E6", "#EEF3FF"),
            "out_of_stock": ("#B91C1C", "#FEF2F2"),
        }
        fg, bg = colors.get(obj.availability, ("#475569", "#F1F5F9"))
        return format_html(
            '<span style="background:{};color:{};padding:3px 10px;border-radius:999px;'
            'font-size:11px;font-weight:600;white-space:nowrap">{}</span>',
            bg, fg, obj.get_availability_display(),
        )

    @admin.action(description="Publish selected products")
    def publish(self, request, queryset):
        self.message_user(request, f"{queryset.update(is_published=True)} products published.")

    @admin.action(description="Unpublish selected products")
    def unpublish(self, request, queryset):
        self.message_user(request, f"{queryset.update(is_published=False)} products hidden.")

    @admin.action(description="Mark as featured")
    def feature(self, request, queryset):
        self.message_user(request, f"{queryset.update(is_featured=True)} products featured.")

    @admin.action(description="Remove from featured")
    def unfeature(self, request, queryset):
        self.message_user(request, f"{queryset.update(is_featured=False)} products unfeatured.")


@admin.register(Category)
class CategoryAdmin(ImportExportModelAdmin):
    list_display = ("name", "parent", "product_total", "is_featured", "is_published", "order")
    list_editable = ("is_featured", "is_published", "order")
    list_filter = ("is_published", "is_featured", "parent")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("parent",)
    fieldsets = (
        (None, {"fields": (("name", "slug"), "parent", "description", ("icon", "image"))}),
        ("Visibility", {"fields": (("is_featured", "is_published", "order"),)}),
        SEO_FIELDSET,
    )

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_total=Count("products"))

    @admin.display(description="Products", ordering="_total")
    def product_total(self, obj):
        return obj._total


@admin.register(Industry)
class IndustryAdmin(ImportExportModelAdmin):
    list_display = ("name", "tagline", "product_total", "is_featured", "is_published", "order")
    list_editable = ("is_featured", "is_published", "order")
    list_filter = ("is_published", "is_featured")
    search_fields = ("name", "tagline", "description")
    prepopulated_fields = {"slug": ("name",)}
    fieldsets = (
        (None, {
            "fields": (
                ("name", "slug"), "tagline", "description",
                ("icon", "image", "accent_color"), "applications",
            )
        }),
        ("Visibility", {"fields": (("is_featured", "is_published", "order"),)}),
        SEO_FIELDSET,
    )

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(_total=Count("products"))

    @admin.display(description="Products", ordering="_total")
    def product_total(self, obj):
        return obj._total


@admin.register(Manufacturer)
class ManufacturerAdmin(ImportExportModelAdmin):
    list_display = ("name", "country", "website", "is_published", "order")
    list_editable = ("is_published", "order")
    search_fields = ("name", "country")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(PackageSize)
class PackageSizeAdmin(admin.ModelAdmin):
    list_display = ("label", "order")
    list_editable = ("order",)
    search_fields = ("label",)
    filter_horizontal = ("products",)


@admin.register(ProductDocument)
class ProductDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "product", "doc_type", "is_public", "created_at")
    list_filter = ("doc_type", "is_public")
    search_fields = ("title", "product__name")
    autocomplete_fields = ("product",)
