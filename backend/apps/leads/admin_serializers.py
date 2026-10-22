from rest_framework import serializers

from .models import Inquiry, QuoteRequest


class AdminQuoteItemSerializer(serializers.Serializer):
    product_name = serializers.CharField()
    product_grade = serializers.CharField(allow_blank=True)
    product_url = serializers.CharField(allow_blank=True)
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    unit = serializers.CharField()
    packaging = serializers.CharField(allow_blank=True)
    notes = serializers.CharField(allow_blank=True)


class DeliveryStatusMixin(serializers.Serializer):
    delivery_status = serializers.SerializerMethodField()

    def get_delivery_status(self, obj):
        from .models import LeadNotification
        field = "quote_id" if isinstance(obj, QuoteRequest) else "inquiry_id"
        notification = LeadNotification.objects.filter(**{field: obj.pk}).first()
        if not notification:
            return {"state": "historical_untracked"}
        return {"state": "delivered" if notification.sales_sent_at and notification.acknowledgement_sent_at else "pending",
                "sales_sent": bool(notification.sales_sent_at), "acknowledgement_sent": bool(notification.acknowledgement_sent_at),
                "attempts": notification.attempts, "error": notification.last_error}


class AdminQuoteRequestSerializer(DeliveryStatusMixin, serializers.ModelSerializer):
    items = AdminQuoteItemSerializer(many=True, read_only=True)
    industry_name = serializers.CharField(source="industry.name", read_only=True, default="")
    handled_by_username = serializers.CharField(
        source="handled_by.username", read_only=True, default=""
    )

    class Meta:
        model = QuoteRequest
        fields = [
            "delivery_status", "id", "reference", "full_name", "email", "phone", "company", "country",
            "industry", "industry_name", "message", "delivery_location", "required_by",
            "status", "source", "internal_notes", "handled_by", "handled_by_username",
            "items", "created_at", "updated_at",
        ]
        read_only_fields = [
            "reference", "full_name", "email", "phone", "company", "country",
            "industry", "source", "created_at", "updated_at",
        ]


class AdminInquirySerializer(DeliveryStatusMixin, serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = [
            "delivery_status", "id", "full_name", "email", "phone", "company", "topic", "subject",
            "message", "is_handled", "created_at",
        ]
        read_only_fields = [
            "full_name", "email", "phone", "company", "topic", "subject", "message",
            "created_at",
        ]
