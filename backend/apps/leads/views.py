import logging

from rest_framework import mixins, viewsets
from rest_framework.response import Response

from .models import Inquiry, NewsletterSubscriber, QuoteRequest
from .serializers import InquirySerializer, NewsletterSerializer, QuoteRequestSerializer
from .tasks import notify_inquiry, notify_quote_request

logger = logging.getLogger(__name__)


class QuoteRequestViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = QuoteRequest.objects.all()
    serializer_class = QuoteRequestSerializer

    def perform_create(self, serializer):
        quote = serializer.save()
        notify_quote_request.delay(quote.id)


class InquiryViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = Inquiry.objects.all()
    serializer_class = InquirySerializer

    def perform_create(self, serializer):
        inquiry = serializer.save()
        notify_inquiry.delay(inquiry.id)


class NewsletterViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = NewsletterSubscriber.objects.all()
    serializer_class = NewsletterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Subscribed."}, status=201)
