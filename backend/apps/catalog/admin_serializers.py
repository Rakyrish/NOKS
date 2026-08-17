"""Write-capable serializers for the admin control panel.

Kept deliberately separate from apps.catalog.serializers (the public,
read-only API contract the frontend's `lib/api.ts` depends on) so tightening
or reshaping admin fields can never accidentally change what the public site
receives.
"""

from rest_framework import serializers

from .models import Category, Industry, Manufacturer, Product, ProductDocument, ProductImage
from .serializers import ProductDocumentSerializer, ProductImageSerializer


class AdminCategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source="products.count", read_only=True)

    class Meta:
        model = Category
        fields = [
            "id", "name", "slug", "description", "icon", "image", "parent",
            "is_featured", "is_published", "order", "product_count",
            "meta_title", "meta_description", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class AdminIndustrySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source="products.count", read_only=True)

    class Meta:
        model = Industry
        fields = [
            "id", "name", "slug", "tagline", "description", "icon", "image",
            "accent_color", "applications", "is_featured", "is_published", "order",
            "product_count", "meta_title", "meta_description", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class AdminManufacturerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manufacturer
        fields = [
            "id", "name", "slug", "country", "website", "description", "logo",
            "is_published", "order", "created_at", "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class AdminProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    industries_names = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)
    documents = ProductDocumentSerializer(many=True, read_only=True)
    industries = serializers.PrimaryKeyRelatedField(
        queryset=Industry.objects.all(), many=True, required=False
    )
    manufacturer = serializers.PrimaryKeyRelatedField(
        queryset=Manufacturer.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku",
            "chemical_formula", "cas_number", "hs_code", "synonyms", "grade", "purity",
            "category", "category_name", "industries", "industries_names", "manufacturer",
            "short_description", "description", "applications", "benefits",
            "specifications", "packaging_options", "storage_handling",
            "safety_information", "hazard_class",
            "availability", "unit", "min_order_quantity", "price_on_request",
            "indicative_price", "currency", "lead_time",
            "is_published", "is_featured", "is_bestseller", "ai_generated",
            "view_count", "quote_count",
            "meta_title", "meta_description", "meta_keywords", "noindex",
            "images", "documents", "created_at", "updated_at",
        ]
        read_only_fields = [
            "sku", "ai_generated", "view_count", "quote_count", "created_at", "updated_at",
        ]

    def get_industries_names(self, obj):
        return [i.name for i in obj.industries.all()]

    def validate_short_description(self, value):
        if not value.strip():
            raise serializers.ValidationError("Short description is required.")
        return value


class ProductImageUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "order"]


class ProductDocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductDocument
        fields = ["id", "doc_type", "title", "file", "is_public"]


class ProductDraftRequestSerializer(serializers.Serializer):
    # Optional on its own: a photo alone is enough to draft from (vision
    # identifies the product and proposes a name) — see validate() below,
    # which just requires at least one of name / image_url.
    name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    cas_number = serializers.CharField(max_length=40, required=False, allow_blank=True)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    # Same URL the admin pastes as the product's photo — reused as AI vision
    # input so a label the admin can't be bothered to retype gets read off the
    # packaging instead of guessed at. See apps.catalog.ai.generate_product_draft.
    image_url = serializers.URLField(required=False, allow_blank=True, max_length=500)

    def validate(self, attrs):
        if not attrs.get("name", "").strip() and not attrs.get("image_url", "").strip():
            raise serializers.ValidationError("Provide a product name, a product photo URL, or both.")
        return attrs


class ProductImageFromUrlSerializer(serializers.Serializer):
    url = serializers.URLField(max_length=500)
    alt_text = serializers.CharField(max_length=250, required=False, allow_blank=True)
