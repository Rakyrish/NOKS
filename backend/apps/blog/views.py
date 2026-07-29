from django.db.models import Count, F, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Author, BlogCategory, Post
from .serializers import (
    AuthorSerializer,
    BlogCategorySerializer,
    PostDetailSerializer,
    PostListSerializer,
)


class BlogCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BlogCategorySerializer
    lookup_field = "slug"
    pagination_class = None

    def get_queryset(self):
        return BlogCategory.objects.published().annotate(
            post_count=Count("posts", filter=Q(posts__status=Post.Status.PUBLISHED))
        )


class AuthorViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuthorSerializer
    queryset = Author.objects.all()
    lookup_field = "slug"
    pagination_class = None


class PostViewSet(viewsets.ReadOnlyModelViewSet):
    lookup_field = "slug"
    filterset_fields = {"category__slug": ["exact"], "is_featured": ["exact"]}
    search_fields = ["title", "excerpt", "body"]
    ordering_fields = ["published_at", "view_count", "title"]
    ordering = ["-published_at"]

    def get_queryset(self):
        qs = (
            Post.objects.published()
            .select_related("category", "author")
            .prefetch_related("tags")
        )
        if self.action == "retrieve":
            qs = qs.prefetch_related("faqs", "suggested_products__images", "related_posts")
        tag = self.request.query_params.get("tag")
        if tag:
            qs = qs.filter(tags__name__iexact=tag)
        return qs

    def get_serializer_class(self):
        return PostDetailSerializer if self.action == "retrieve" else PostListSerializer

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        Post.objects.filter(slug=kwargs.get("slug")).update(view_count=F("view_count") + 1)
        return response

    @action(detail=False)
    def featured(self, request):
        qs = self.get_queryset().filter(is_featured=True)[:3]
        return Response(self.get_serializer(qs, many=True).data)
