from rest_framework import serializers

from .models import (
    Category,
    Industry,
    Manufacturer,
    PackageSize,
    Product,
    ProductDocument,
    ProductImage,
)


class SEOFieldsMixin(serializers.Serializer):
    seo = serializers.SerializerMethodField()

    def get_seo(self, obj):
        return {
            "title": obj.meta_title,
            "description": obj.meta_description,
            "keywords": obj.meta_keywords,
            "canonical": obj.canonical_url,
            "noindex": obj.noindex,
            "og_image": obj.og_image.url if getattr(obj, "og_image", None) else None,
        }


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "order"]


class ProductDocumentSerializer(serializers.ModelSerializer):
    doc_type_display = serializers.CharField(source="get_doc_type_display", read_only=True)

    class Meta:
        model = ProductDocument
        fields = ["id", "doc_type", "doc_type_display", "title", "file", "is_public"]


class ManufacturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manufacturer
        fields = ["id", "name", "slug", "country", "website", "logo"]


class CategorySerializer(SEOFieldsMixin, serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id", "name", "slug", "description", "icon", "image",
            "parent", "is_featured", "order", "product_count", "children", "seo",
        ]

    def get_children(self, obj):
        if self.context.get("flat"):
            return []
        return CategorySerializer(
            obj.children.published(), many=True, context={**self.context, "flat": True}
        ).data


class IndustrySerializer(SEOFieldsMixin, serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Industry
        fields = [
            "id", "name", "slug", "tagline", "description", "icon", "image",
            "accent_color", "applications", "is_featured", "order", "product_count", "seo",
        ]


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    manufacturer_name = serializers.CharField(source="manufacturer.name", read_only=True, default="")
    grade_display = serializers.CharField(source="get_grade_display", read_only=True)
    availability_display = serializers.CharField(
        source="get_availability_display", read_only=True
    )
    image = serializers.SerializerMethodField()
    industry_slugs = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "chemical_formula", "cas_number",
            "short_description", "grade", "grade_display", "purity",
            "category_name", "category_slug", "manufacturer_name",
            "availability", "availability_display", "unit", "lead_time",
            "price_on_request", "indicative_price", "currency",
            "is_featured", "is_bestseller", "image", "industry_slugs",
        ]

    def get_image(self, obj):
        img = obj.images.first()
        if not img:
            return None
        request = self.context.get("request")
        url = img.image.url
        return request.build_absolute_uri(url) if request else url

    def get_industry_slugs(self, obj):
        return [i.slug for i in obj.industries.all()]


class ProductDetailSerializer(SEOFieldsMixin, ProductListSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    documents = serializers.SerializerMethodField()
    industries = IndustrySerializer(many=True, read_only=True)
    manufacturer = ManufacturerSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    related = serializers.SerializerMethodField()
    bought_together = serializers.SerializerMethodField()
    package_sizes = serializers.SerializerMethodField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            "description", "applications", "benefits", "specifications",
            "packaging_options", "faqs", "storage_handling", "safety_information",
            "hazard_class", "hs_code", "synonyms", "min_order_quantity",
            "images", "documents", "industries", "manufacturer", "category",
            "related", "bought_together", "package_sizes", "seo", "updated_at",
        ]

    def get_documents(self, obj):
        return ProductDocumentSerializer(
            obj.documents.filter(is_public=True), many=True, context=self.context
        ).data

    def get_related(self, obj):
        qs = obj.related_products.published().with_relations()[:4]
        if not qs:
            qs = (
                Product.objects.published()
                .with_relations()
                .filter(category=obj.category)
                .exclude(pk=obj.pk)[:4]
            )
        return ProductListSerializer(qs, many=True, context=self.context).data

    def get_bought_together(self, obj):
        qs = obj.frequently_bought_together.published().with_relations()[:3]
        return ProductListSerializer(qs, many=True, context=self.context).data

    def get_package_sizes(self, obj):
        return [p.label for p in obj.package_sizes.all()]


class PackageSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageSize
        fields = ["id", "label"]
