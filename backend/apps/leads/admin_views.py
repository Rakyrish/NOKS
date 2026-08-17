from rest_framework import mixins, viewsets
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.permissions import IsAdminUser

from .admin_serializers import AdminInquirySerializer, AdminQuoteRequestSerializer
from .models import Inquiry, QuoteRequest


class AdminQuoteRequestViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Staff manage the pipeline (status/notes/handler) — never create/delete here;
    quotes only ever originate from the public quote form."""

    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAdminUser]
    serializer_class = AdminQuoteRequestSerializer
    queryset = QuoteRequest.objects.select_related("industry", "handled_by").prefetch_related(
        "items"
    )
    filterset_fields = ["status"]

    def perform_update(self, serializer):
        serializer.save(handled_by=serializer.instance.handled_by or self.request.user)


class AdminInquiryViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAdminUser]
    serializer_class = AdminInquirySerializer
    queryset = Inquiry.objects.all()
    filterset_fields = ["is_handled", "topic"]
