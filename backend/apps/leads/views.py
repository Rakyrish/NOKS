import logging

from rest_framework import mixins, viewsets
from rest_framework.response import Response

from .models import Inquiry, NewsletterSubscriber, QuoteRequest
from .serializers import InquirySerializer, NewsletterSerializer, QuoteRequestSerializer

logger = logging.getLogger(__name__)


class LeadCreateMixin:
    """Atomic receipt + durable outbox, with optional retry-safe client UUID."""
    def create(self, request, *args, **kwargs):
        import hashlib
        import json
        import uuid
        from django.db import IntegrityError, transaction
        from django.utils import timezone
        from .models import LeadNotification
        from .tasks import deliver_notification

        raw_key = request.headers.get("Idempotency-Key")
        try:
            key = uuid.UUID(raw_key) if raw_key else None
        except ValueError:
            return Response({"detail": "Invalid submission key."}, status=400)
        digest = hashlib.sha256(json.dumps(request.data, sort_keys=True, separators=(",", ":")).encode()).hexdigest()

        def replay():
            lead = self.queryset.model.objects.filter(idempotency_key=key).first() if key else None
            if lead is None:
                return None
            if lead.submission_digest != digest:
                return Response({"detail": "This submission key was already used for a different request."}, status=409)
            return Response(self.get_serializer(lead).data, status=200)

        existing = replay()
        if existing is not None:
            return existing
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                lead = serializer.save(idempotency_key=key, submission_digest=digest)
                outbox = LeadNotification.objects.create(**{self.notification_field: lead}, next_attempt_at=timezone.now())
        except IntegrityError:
            existing = replay()
            if existing is not None:
                return existing
            raise
        # Broker failures must not turn an already-saved receipt into a 500.
        try:
            deliver_notification.delay(outbox.pk)
        except Exception as exc:
            logger.warning("Lead notification %s queued for recovery (%s)", outbox.pk, type(exc).__name__)
        return Response(serializer.data, status=201)


class QuoteRequestViewSet(LeadCreateMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = QuoteRequest.objects.all()
    serializer_class = QuoteRequestSerializer
    notification_field = "quote"


class InquiryViewSet(LeadCreateMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = Inquiry.objects.all()
    serializer_class = InquirySerializer
    notification_field = "inquiry"


class NewsletterViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = NewsletterSubscriber.objects.all()
    serializer_class = NewsletterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Subscribed."}, status=201)
