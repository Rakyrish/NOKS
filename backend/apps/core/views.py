from django.conf import settings
from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.blog.models import Post
from apps.blog.serializers import PostListSerializer
from apps.catalog.models import Category, Industry, Product
from apps.catalog.serializers import (
    CategorySerializer,
    IndustrySerializer,
    ProductListSerializer,
)

from .models import (
    FAQ,
    Certification,
    ClientLogo,
    Milestone,
    ProcessStep,
    Service,
    Stat,
    TeamMember,
    Testimonial,
    ValueProp,
)
from .serializers import (
    CertificationSerializer,
    ClientLogoSerializer,
    FAQSerializer,
    MilestoneSerializer,
    ProcessStepSerializer,
    ServiceSerializer,
    StatSerializer,
    TeamMemberSerializer,
    TestimonialSerializer,
    ValuePropSerializer,
)


class _PublishedViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only, unpaginated content collections for the marketing site."""

    pagination_class = None
    model = None

    def get_queryset(self):
        return self.model.objects.published()


class StatViewSet(_PublishedViewSet):
    model, serializer_class = Stat, StatSerializer


class ServiceViewSet(_PublishedViewSet):
    model, serializer_class = Service, ServiceSerializer
    lookup_field = "slug"


class ValuePropViewSet(_PublishedViewSet):
    model, serializer_class = ValueProp, ValuePropSerializer


class ProcessStepViewSet(_PublishedViewSet):
    model, serializer_class = ProcessStep, ProcessStepSerializer


class MilestoneViewSet(_PublishedViewSet):
    model, serializer_class = Milestone, MilestoneSerializer


class TestimonialViewSet(_PublishedViewSet):
    model, serializer_class = Testimonial, TestimonialSerializer


class ClientLogoViewSet(_PublishedViewSet):
    model, serializer_class = ClientLogo, ClientLogoSerializer


class CertificationViewSet(_PublishedViewSet):
    model, serializer_class = Certification, CertificationSerializer


class TeamMemberViewSet(_PublishedViewSet):
    model, serializer_class = TeamMember, TeamMemberSerializer


class FAQViewSet(_PublishedViewSet):
    model, serializer_class = FAQ, FAQSerializer
    filterset_fields = ["page", "category"]


@api_view(["GET"])
def homepage(request):
    """One round-trip for the entire homepage — keeps LCP fast."""
    ctx = {"request": request}
    published_products = Q(products__is_published=True)

    industries = Industry.objects.published().annotate(
        product_count=Count("products", filter=published_products, distinct=True)
    )
    categories = (
        Category.objects.published()
        .filter(parent__isnull=True)
        .annotate(product_count=Count("products", filter=published_products, distinct=True))
    )
    featured = Product.objects.published().with_relations().filter(is_featured=True)[:8]
    posts = Post.objects.published().select_related("category", "author")[:3]

    return Response(
        {
            "stats": StatSerializer(Stat.objects.published(), many=True).data,
            "industries": IndustrySerializer(industries, many=True, context=ctx).data,
            "categories": CategorySerializer(categories, many=True, context=ctx).data,
            "featured_products": ProductListSerializer(featured, many=True, context=ctx).data,
            "value_props": ValuePropSerializer(ValueProp.objects.published(), many=True).data,
            "services": ServiceSerializer(
                Service.objects.published(), many=True, context=ctx
            ).data,
            "process": ProcessStepSerializer(ProcessStep.objects.published(), many=True).data,
            "testimonials": TestimonialSerializer(
                Testimonial.objects.published(), many=True, context=ctx
            ).data,
            "clients": ClientLogoSerializer(
                ClientLogo.objects.published(), many=True, context=ctx
            ).data,
            "certifications": CertificationSerializer(
                Certification.objects.published(), many=True, context=ctx
            ).data,
            "faqs": FAQSerializer(FAQ.objects.published().filter(page="home"), many=True).data,
            "latest_posts": PostListSerializer(posts, many=True, context=ctx).data,
        }
    )


@api_view(["GET"])
def site_config(request):
    """Brand + contact tokens, mirrored from the root .env."""
    return Response({"brand": settings.BRAND, "ai_enabled": settings.AI_ENABLED})


@api_view(["GET"])
def health(request):
    return Response({"status": "ok", "environment": settings.ENVIRONMENT})
