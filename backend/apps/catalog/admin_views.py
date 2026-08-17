"""Authenticated CRUD + AI-drafting surface for the admin control panel.

Every viewset here requires TokenAuthentication (or SessionAuthentication,
for the DRF browsable API in DEBUG) and IsAdminUser. This is intentionally a
separate router namespace (/api/v1/admin/...) from the public, read-only
catalog endpoints in apps.catalog.views — the public ProductViewSet etc. stay
untouched and untouchable from here.
"""

from django.core.files.base import ContentFile
from django.db.models import F, ProtectedError, Q
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from .admin_serializers import (
    AdminCategorySerializer,
    AdminIndustrySerializer,
    AdminManufacturerSerializer,
    AdminProductSerializer,
    ProductDocumentUploadSerializer,
    ProductDraftRequestSerializer,
    ProductImageFromUrlSerializer,
    ProductImageUploadSerializer,
)
from .ai import ProductDraftError, generate_product_draft
from .models import Category, Industry, Manufacturer, Product, ProductDocument, ProductImage
from .url_fetch import UnsafeUrlError, fetch_image_bytes


class AdminBaseViewSet(viewsets.ModelViewSet):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAdminUser]


class AdminCategoryViewSet(AdminBaseViewSet):
    queryset = Category.objects.all().order_by("order", "name")
    serializer_class = AdminCategorySerializer
    pagination_class = None

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "This category still has products assigned to it. Move or delete those products first."},
                status=status.HTTP_409_CONFLICT,
            )


class AdminIndustryViewSet(AdminBaseViewSet):
    queryset = Industry.objects.all().order_by("order", "name")
    serializer_class = AdminIndustrySerializer
    pagination_class = None


class AdminManufacturerViewSet(AdminBaseViewSet):
    queryset = Manufacturer.objects.all().order_by("order", "name")
    serializer_class = AdminManufacturerSerializer
    pagination_class = None


class AdminProductViewSet(AdminBaseViewSet):
    """Full CRUD over every product, published or not."""

    serializer_class = AdminProductSerializer

    def get_queryset(self):
        qs = (
            Product.objects.all()
            .select_related("category", "manufacturer")
            .prefetch_related("industries", "images", "documents")
            .order_by("-created_at")
        )
        params = self.request.query_params
        q = params.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(name__icontains=q)
                | Q(sku__icontains=q)
                | Q(cas_number__icontains=q)
                | Q(chemical_formula__icontains=q)
            )
        status_param = params.get("status")
        if status_param == "published":
            qs = qs.filter(is_published=True)
        elif status_param == "draft":
            qs = qs.filter(is_published=False)
        category = params.get("category")
        if category:
            qs = qs.filter(category_id=category)
        return qs

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        """AI-drafted copy for a new/existing product — review only, never saved."""
        serializer = ProductDraftRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        category_name = ""
        if data.get("category_id"):
            category = Category.objects.filter(pk=data["category_id"]).first()
            category_name = category.name if category else ""

        try:
            draft = generate_product_draft(
                name=data.get("name", ""),
                cas_number=data.get("cas_number", ""),
                category_name=category_name,
                notes=data.get("notes", ""),
                image_url=data.get("image_url", ""),
            )
        except ProductDraftError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response(draft)

    def perform_create(self, serializer):
        # `generate` never writes to the DB — this is the one place ai_generated
        # gets set, and only when the admin actually saves a product they built
        # from a draft (the frontend sends this flag alongside the reviewed data).
        ai_generated = bool(self.request.data.get("_from_ai_draft"))
        product = serializer.save(ai_generated=ai_generated)

        # Optional first image, pasted as a URL on the "new product" form —
        # same fetch-and-store path as the dedicated images/from-url endpoint,
        # just so a product doesn't have to be saved once with no photo and
        # then edited again to add one.
        image_url = (self.request.data.get("image_url") or "").strip()
        if image_url:
            try:
                save_image_from_url(product, image_url, alt_text=product.name, order=0)
            except UnsafeUrlError:
                # The product itself is still valid and saved — a bad image URL
                # shouldn't block product creation. The admin can retry the
                # image from the edit page, where a failure is reported inline.
                pass


def save_image_from_url(product, url, *, alt_text="", order=None):
    """Fetch `url` server-side and store it as a real ProductImage — same
    storage backend (local disk or Cloudinary) as an uploaded file, so a
    URL-sourced image behaves identically everywhere downstream: no hot-
    linking an external site, no CORS surprises, works with next/image."""
    data, ext = fetch_image_bytes(url)
    if order is None:
        order = product.images.count()
    image = ProductImage(product=product, alt_text=alt_text, order=order)
    filename = f"{product.slug or 'product'}-{order}.{ext}"
    image.image.save(filename, ContentFile(data), save=True)
    return image


class AdminProductImageViewSet(viewsets.ModelViewSet):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAdminUser]
    serializer_class = ProductImageUploadSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    throttle_classes = [UserRateThrottle]

    def get_queryset(self):
        return ProductImage.objects.filter(product_id=self.kwargs["product_pk"])

    def perform_create(self, serializer):
        product = get_object_or_404(Product, pk=self.kwargs["product_pk"])
        serializer.save(product=product)

    @action(detail=False, methods=["post"], url_path="from-url")
    def from_url(self, request, product_pk=None):
        serializer = ProductImageFromUrlSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = get_object_or_404(Product, pk=product_pk)
        try:
            image = save_image_from_url(
                product,
                serializer.validated_data["url"],
                alt_text=serializer.validated_data.get("alt_text", ""),
            )
        except UnsafeUrlError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            ProductImageUploadSerializer(image, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="make-primary")
    def make_primary(self, request, product_pk=None, pk=None):
        image = get_object_or_404(ProductImage, pk=pk, product_id=product_pk)
        # ProductImage ordering is what ProductListSerializer.get_image() reads
        # (`.images.first()`), so "primary" means "order 0, ahead of the rest".
        ProductImage.objects.filter(product_id=product_pk).exclude(pk=pk).update(
            order=F("order") + 1
        )
        image.order = 0
        image.save(update_fields=["order"])
        return Response(ProductImageUploadSerializer(image).data)


class AdminProductDocumentViewSet(viewsets.ModelViewSet):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    permission_classes = [IsAdminUser]
    serializer_class = ProductDocumentUploadSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    throttle_classes = [UserRateThrottle]

    def get_queryset(self):
        return ProductDocument.objects.filter(product_id=self.kwargs["product_pk"])

    def perform_create(self, serializer):
        product = get_object_or_404(Product, pk=self.kwargs["product_pk"])
        serializer.save(product=product)
