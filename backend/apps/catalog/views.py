from django.db.models import Count, F, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import ProductFilter
from .models import Category, Industry, Manufacturer, PackageSize, Product
from .serializers import (
    CategorySerializer,
    IndustrySerializer,
    ManufacturerSerializer,
    PackageSizeSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)

_PUBLISHED_PRODUCTS = Q(products__is_published=True)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CategorySerializer
    lookup_field = "slug"
    # Small, fully-enumerated taxonomies: the site consumes them as plain arrays.
    pagination_class = None

    def get_queryset(self):
        qs = (
            Category.objects.published()
            .annotate(product_count=Count("products", filter=_PUBLISHED_PRODUCTS, distinct=True))
            .prefetch_related("children")
        )
        if self.action == "list" and self.request.query_params.get("tree") != "false":
            qs = qs.filter(parent__isnull=True)
        return qs


class IndustryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = IndustrySerializer
    lookup_field = "slug"
    queryset = Industry.objects.none()
    pagination_class = None

    def get_queryset(self):
        return Industry.objects.published().annotate(
            product_count=Count("products", filter=_PUBLISHED_PRODUCTS, distinct=True)
        )


class ManufacturerViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ManufacturerSerializer
    lookup_field = "slug"
    pagination_class = None

    def get_queryset(self):
        return Manufacturer.objects.published()


class PackageSizeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PackageSizeSerializer
    queryset = PackageSize.objects.all()
    pagination_class = None


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    lookup_field = "slug"
    filterset_class = ProductFilter
    search_fields = ["name", "sku", "cas_number", "synonyms", "short_description"]
    ordering_fields = ["name", "created_at", "indicative_price", "view_count", "quote_count"]
    ordering = ["-is_featured", "name"]

    def get_queryset(self):
        return Product.objects.published().with_relations()

    def get_serializer_class(self):
        return ProductDetailSerializer if self.action == "retrieve" else ProductListSerializer

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        # Popularity signal, kept off the ORM instance to avoid a race.
        Product.objects.filter(slug=kwargs.get("slug")).update(view_count=F("view_count") + 1)
        return response

    @action(detail=False)
    def featured(self, request):
        qs = self.get_queryset().filter(is_featured=True)[:8]
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False)
    def facets(self, request):
        """Filter-rail counts, computed against the currently filtered set."""
        qs = self.filter_queryset(self.get_queryset())
        return Response(
            {
                "grades": list(
                    qs.values("grade").annotate(count=Count("id")).order_by("-count")
                ),
                "availability": list(
                    qs.values("availability").annotate(count=Count("id")).order_by("-count")
                ),
                # NB: alias as `value`, not `slug` — `slug` collides with the model field.
                "categories": list(
                    qs.values(value=F("category__slug"), label=F("category__name"))
                    .annotate(count=Count("id"))
                    .order_by("-count")
                ),
                "industries": list(
                    qs.filter(industries__isnull=False)
                    .values(value=F("industries__slug"), label=F("industries__name"))
                    .annotate(count=Count("id", distinct=True))
                    .order_by("-count")
                ),
                "manufacturers": list(
                    qs.filter(manufacturer__isnull=False)
                    .values(value=F("manufacturer__slug"), label=F("manufacturer__name"))
                    .annotate(count=Count("id"))
                    .order_by("-count")
                ),
                "package_sizes": list(
                    qs.filter(package_sizes__isnull=False)
                    .values(label=F("package_sizes__label"))
                    .annotate(count=Count("id", distinct=True))
                    .order_by("-count")
                ),
                "total": qs.count(),
            }
        )

    @action(detail=False)
    def search_suggest(self, request):
        """Type-ahead for the catalog search box and the AI assistant."""
        term = request.query_params.get("q", "").strip()
        if len(term) < 2:
            return Response([])
        qs = self.get_queryset().filter(
            Q(name__icontains=term) | Q(sku__icontains=term) | Q(cas_number__icontains=term)
        )[:8]
        return Response(
            [
                {
                    "name": p.name,
                    "slug": p.slug,
                    "sku": p.sku,
                    "cas_number": p.cas_number,
                    "category": p.category.name,
                }
                for p in qs
            ]
        )

    @action(detail=False, url_path="compare")
    def compare(self, request):
        """Side-by-side comparison for up to 4 products (?slugs=a,b,c)."""
        slugs = [s for s in request.query_params.get("slugs", "").split(",") if s][:4]
        qs = self.get_queryset().filter(slug__in=slugs)
        return Response(
            ProductDetailSerializer(qs, many=True, context={"request": request}).data
        )
