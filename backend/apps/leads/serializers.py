from django.db.models import F
from rest_framework import serializers

from apps.catalog.models import Product

from .models import Inquiry, NewsletterSubscriber, QuoteItem, QuoteRequest


class QuoteItemSerializer(serializers.ModelSerializer):
    product_slug = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Product.objects.all(),
        source="product",
        required=False,
        allow_null=True,
    )

    class Meta:
        model = QuoteItem
        fields = ["product_slug", "product_name", "quantity", "unit", "packaging", "notes"]

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

    def create(self, validated_data):
        items = validated_data.pop("items")
        quote = QuoteRequest.objects.create(**validated_data)
        for item in items:
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
