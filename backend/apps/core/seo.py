"""The URL inventory the XML sitemap is built from.

The sitemap route used to assemble itself by walking the public catalogue API —
up to 20 paginated product calls plus the category tree, industries and posts,
on every request — and it had no way to see the three facts that decide whether
a URL belongs in a sitemap at all:

  * is it `noindex`?
  * does it canonicalise somewhere else?
  * (for a category) does it actually have anything to show?

Those live on `SEOModel` and behind a descendant-aware count, neither of which
the public serializers expose. Rather than fattening every catalogue response
with SEO fields nobody browsing needs, this endpoint answers exactly the
sitemap's question, once, in a few hundred bytes per URL.

Nothing here decides policy — it reports facts. The rules about what a sitemap
may contain live with the sitemap, in `frontend/src/app/sitemap.ts`, and are
documented in `docs/url-indexing-policy.md`.
"""

from django.db.models import Count, IntegerField, OuterRef, Q, Subquery, Value
from django.db.models.functions import Coalesce
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.blog.models import Post
from apps.catalog.models import Category, Industry, Product


def _entry(obj, *, lastmod_field="content_updated_at"):
    """The common shape: where the URL is, when it changed, may we list it."""
    lastmod = getattr(obj, lastmod_field, None) or obj.updated_at
    return {
        "slug": obj.slug,
        "lastmod": lastmod.isoformat() if lastmod else None,
        "noindex": obj.noindex,
        # A row that canonicalises elsewhere is a duplicate by the owner's own
        # declaration; the sitemap must list the target, not this URL.
        "canonical": obj.canonical_url or "",
    }


def category_product_counts():
    """Published products per category, counting descendants.

    `/categories/<slug>` and `/products?category=<slug>` both resolve a
    category to its own products *plus* its children's (see
    `ProductFilter.filter_category`), but the `product_count` annotation on the
    public serializer only ever counted direct children. That is why
    `water-treatment-chemicals` reported 0 products while its four subcategories
    held five between them — and why a genuinely useful landing page looked
    empty to anything reading the count.
    """
    counted = (
        Product.objects.filter(is_published=True)
        .filter(Q(category=OuterRef("pk")) | Q(category__parent=OuterRef("pk")))
        .order_by()
        # Collapse to a single row: group every match under one constant key so
        # the subquery returns one count rather than one row per group.
        .values(group=Value(1))
        .annotate(total=Count("pk", distinct=True))
        .values("total")
    )
    return Coalesce(Subquery(counted, output_field=IntegerField()), Value(0))


@api_view(["GET"])
@permission_classes([AllowAny])
def sitemap_inventory(request):
    """Every publicly routable entity, with the facts a sitemap needs."""
    categories = Category.objects.published().annotate(
        product_count=category_product_counts()
    )
    industries = Industry.objects.published().annotate(
        product_count=Count("products", filter=Q(products__is_published=True), distinct=True)
    )

    return Response(
        {
            "products": [_entry(p) for p in Product.objects.published().only(
                "slug", "content_updated_at", "updated_at", "noindex", "canonical_url"
            )],
            "categories": [
                {**_entry(c), "product_count": c.product_count} for c in categories
            ],
            "industries": [
                {**_entry(i), "product_count": i.product_count} for i in industries
            ],
            "posts": [
                {**_entry(p), "published_at": p.published_at.isoformat() if p.published_at else None}
                for p in Post.objects.published()
            ],
        }
    )
