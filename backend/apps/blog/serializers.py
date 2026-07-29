from rest_framework import serializers

from apps.catalog.serializers import ProductListSerializer, SEOFieldsMixin

from .models import Author, BlogCategory, Post, PostFAQ


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ["id", "name", "slug", "role", "bio", "photo", "linkedin"]


class BlogCategorySerializer(SEOFieldsMixin, serializers.ModelSerializer):
    post_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = BlogCategory
        fields = ["id", "name", "slug", "description", "icon", "color", "post_count", "seo"]


class PostFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostFAQ
        fields = ["id", "question", "answer", "order"]


class PostListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    author_name = serializers.CharField(source="author.name", read_only=True, default="")
    tag_list = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "title", "slug", "excerpt", "cover_image", "cover_alt",
            "category_name", "category_slug", "author_name", "tag_list",
            "published_at", "reading_minutes", "is_featured",
        ]

    def get_tag_list(self, obj):
        return [t.name for t in obj.tags.all()]


class PostDetailSerializer(SEOFieldsMixin, PostListSerializer):
    author = AuthorSerializer(read_only=True)
    category = BlogCategorySerializer(read_only=True)
    faqs = PostFAQSerializer(many=True, read_only=True)
    suggested_products = ProductListSerializer(many=True, read_only=True)
    related = serializers.SerializerMethodField()

    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + [
            "body", "author", "category", "faqs",
            "suggested_products", "related", "seo", "updated_at",
        ]

    def get_related(self, obj):
        qs = obj.related_posts.published()[:3]
        if not qs:
            qs = Post.objects.published().filter(category=obj.category).exclude(pk=obj.pk)[:3]
        return PostListSerializer(qs, many=True, context=self.context).data
