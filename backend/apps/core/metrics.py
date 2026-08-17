"""Operations metrics shared by the branded Django admin index and the
control panel's /api/v1/admin/dashboard/ endpoint, so the two never drift."""

from datetime import timedelta

from django.db.models import Q
from django.utils import timezone


def dashboard_metrics() -> dict:
    from apps.assistant.models import Conversation
    from apps.blog.models import Post
    from apps.catalog.models import Product
    from apps.leads.models import Inquiry, QuoteRequest

    since = timezone.now() - timedelta(days=30)
    products = Product.objects.all()
    quotes = QuoteRequest.objects.all()

    return {
        "products_total": products.count(),
        "products_published": products.filter(is_published=True).count(),
        "products_unpublished": products.filter(is_published=False).count(),
        "products_featured": products.filter(is_featured=True).count(),
        "products_missing_seo": products.filter(
            Q(meta_description="") | Q(meta_description__isnull=True)
        ).count(),
        "quotes_total": quotes.count(),
        "quotes_new": quotes.filter(status=QuoteRequest.Status.NEW).count(),
        "quotes_won": quotes.filter(status=QuoteRequest.Status.WON).count(),
        "quotes_30d": quotes.filter(created_at__gte=since).count(),
        "recent_quotes": list(quotes.order_by("-created_at")[:6]),
        "top_products": list(
            products.filter(is_published=True).order_by("-quote_count", "-view_count")[:6]
        ),
        "inquiries_total": Inquiry.objects.count(),
        "inquiries_open": Inquiry.objects.filter(is_handled=False).count(),
        "posts_published": Post.objects.filter(status=Post.Status.PUBLISHED).count(),
        "posts_draft": Post.objects.filter(status=Post.Status.DRAFT).count(),
        "conversations": Conversation.objects.count(),
        "qualified_leads": Conversation.objects.filter(is_qualified_lead=True).count(),
    }
