"""Knowledge Centre — SEO-first editorial content."""

from django.db import models
from django.utils import timezone
from taggit.managers import TaggableManager

from apps.core.models import OrderedModel, SEOModel, SluggedModel, TimeStampedModel


class BlogCategory(TimeStampedModel, SluggedModel, SEOModel, OrderedModel):
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=40, blank=True)
    color = models.CharField(max_length=9, blank=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Knowledge category"
        verbose_name_plural = "Knowledge categories"


class Author(TimeStampedModel, SluggedModel):
    role = models.CharField(max_length=140, blank=True)
    bio = models.TextField(blank=True)
    photo = models.ImageField(upload_to="authors/", blank=True, null=True)
    linkedin = models.URLField(blank=True)


class PostQuerySet(models.QuerySet):
    def published(self):
        return self.filter(status=Post.Status.PUBLISHED, published_at__lte=timezone.now())


class Post(TimeStampedModel, SluggedModel, SEOModel):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        REVIEW = "review", "In review"
        PUBLISHED = "published", "Published"

    title = models.CharField(max_length=250)
    excerpt = models.TextField(max_length=400)
    body = models.TextField(help_text="Markdown supported.")
    cover_image = models.ImageField(upload_to="blog/%Y/%m/", blank=True, null=True)
    cover_alt = models.CharField(max_length=250, blank=True)

    category = models.ForeignKey(
        BlogCategory, on_delete=models.PROTECT, related_name="posts"
    )
    author = models.ForeignKey(
        Author, null=True, blank=True, on_delete=models.SET_NULL, related_name="posts"
    )
    tags = TaggableManager(blank=True)

    # Internal linking + commercial intent, both required by the SEO brief.
    related_posts = models.ManyToManyField("self", blank=True, symmetrical=False)
    suggested_products = models.ManyToManyField(
        "catalog.Product", blank=True, related_name="articles"
    )
    related_industries = models.ManyToManyField(
        "catalog.Industry", blank=True, related_name="articles"
    )

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    reading_minutes = models.PositiveSmallIntegerField(default=0, editable=False)
    is_featured = models.BooleanField(default=False, db_index=True)
    view_count = models.PositiveIntegerField(default=0, editable=False)

    objects = PostQuerySet.as_manager()

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # `name` powers the shared slug logic; keep it mirrored to the title.
        self.name = self.title
        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()
        words = len(self.body.split())
        self.reading_minutes = max(1, round(words / 200))
        super().save(*args, **kwargs)


class PostFAQ(TimeStampedModel):
    """Rendered as an accordion and emitted as FAQPage JSON-LD."""

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="faqs")
    question = models.CharField(max_length=280)
    answer = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Article FAQ"
        verbose_name_plural = "Article FAQs"

    def __str__(self):
        return self.question
