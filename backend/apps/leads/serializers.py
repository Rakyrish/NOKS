from django.conf import settings
from django.db import transaction
from django.db.models import F
from decimal import Decimal
from rest_framework import serializers

from apps.catalog.models import Product

from .models import Inquiry, NewsletterSubscriber, QuoteItem, QuoteRequest


class QuoteItemSerializer(serializers.ModelSerializer):
    product_slug = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Product.objects.published(),
        source="product",
        required=False,
        allow_null=True,
    )

    class Meta:
        model = QuoteItem
        fields = ["product_slug", "product_name", "product_grade", "product_url", "quantity", "unit", "packaging", "notes"]
        read_only_fields = ["product_grade", "product_url"]

    def validate_quantity(self, value):
        if value <= Decimal("0"):
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

    def validate(self, attrs):
        if not attrs.get("product") and not attrs.get("product_name"):
            raise serializers.ValidationError(
                "Each line needs either a catalog product or a product name."
            )
        return attrs


class QuoteRequestSerializer(serializers.ModelSerializer):
    items = QuoteItemSerializer(many=True)

    class Meta:
        model = QuoteRequest
        fields = [
            "reference", "full_name", "email", "phone", "company", "country",
            "industry", "message", "delivery_location", "required_by",
            "source", "items", "created_at",
        ]
        read_only_fields = ["reference", "created_at"]

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Add at least one product to your request.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items")
        quote = QuoteRequest.objects.create(**validated_data)
        for item in items:
            product = item.get("product")
            if product:
                # Preserve the exact catalogue variant at submission time.
                item["product_name"] = product.name
                item["product_grade"] = product.get_grade_display()
                item["product_url"] = f"{settings.SITE_URL}/products/{product.slug}"
            QuoteItem.objects.create(quote=quote, **item)
        product_ids = [i["product"].id for i in items if i.get("product")]
        if product_ids:
            Product.objects.filter(id__in=product_ids).update(
                quote_count=F("quote_count") + 1
            )
        return quote


class InquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = [
            "id", "full_name", "email", "phone", "company",
            "topic", "subject", "message", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class NewsletterSerializer(serializers.ModelSerializer):
    # Declared explicitly so DRF does not attach the model's UniqueValidator:
    # re-subscribing an existing address should succeed, not 400.
    email = serializers.EmailField()

    class Meta:
        model = NewsletterSubscriber
        fields = ["email", "source"]

    def create(self, validated_data):
        subscriber, _ = NewsletterSubscriber.objects.get_or_create(
            email=validated_data["email"],
            defaults={"source": validated_data.get("source", "")},
        )
        return subscriber
