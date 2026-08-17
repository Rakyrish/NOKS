from rest_framework import serializers

from .models import Inquiry, QuoteRequest


class AdminQuoteItemSerializer(serializers.Serializer):
    product_name = serializers.CharField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    unit = serializers.CharField()
    packaging = serializers.CharField(allow_blank=True)
    notes = serializers.CharField(allow_blank=True)


class AdminQuoteRequestSerializer(serializers.ModelSerializer):
    items = AdminQuoteItemSerializer(many=True, read_only=True)
    industry_name = serializers.CharField(source="industry.name", read_only=True, default="")
    handled_by_username = serializers.CharField(
        source="handled_by.username", read_only=True, default=""
    )

    class Meta:
        model = QuoteRequest
        fields = [
            "id", "reference", "full_name", "email", "phone", "company", "country",
            "industry", "industry_name", "message", "delivery_location", "required_by",
            "status", "source", "internal_notes", "handled_by", "handled_by_username",
            "items", "created_at", "updated_at",
        ]
        read_only_fields = [
            "reference", "full_name", "email", "phone", "company", "country",
            "industry", "source", "created_at", "updated_at",
        ]


class AdminInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = [
            "id", "full_name", "email", "phone", "company", "topic", "subject",
            "message", "is_handled", "created_at",
        ]
        read_only_fields = [
            "full_name", "email", "phone", "company", "topic", "subject", "message",
            "created_at",
        ]
