"""Shared abstract bases + editable site content (stats, services, FAQ, …)."""

from django.db import models
from django.utils.text import slugify


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class PublishableQuerySet(models.QuerySet):
    def published(self):
        return self.filter(is_published=True)


class SEOModel(models.Model):
    """Per-object SEO overrides surfaced by the Next.js metadata layer."""

    meta_title = models.CharField(max_length=180, blank=True)
    meta_description = models.TextField(max_length=320, blank=True)
    meta_keywords = models.CharField(max_length=300, blank=True)
    og_image = models.ImageField(upload_to="seo/", blank=True, null=True)
    canonical_url = models.URLField(blank=True)
    noindex = models.BooleanField(
        default=False, help_text="Exclude this page from search engines."
    )

    class Meta:
        abstract = True


class SluggedModel(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)

    class Meta:
        abstract = True

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)[:200] or "item"
            slug, counter = base, 2
            model = self.__class__
            while model.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class OrderedModel(models.Model):
    order = models.PositiveIntegerField(default=0, db_index=True)
    is_published = models.BooleanField(default=True, db_index=True)

    objects = PublishableQuerySet.as_manager()

    class Meta:
        abstract = True
        ordering = ["order", "id"]


# ─────────────────────────────── SITE CONTENT ─────────────────────


class Stat(TimeStampedModel, OrderedModel):
    """Animated counters on the homepage."""

    label = models.CharField(max_length=80)
    value = models.PositiveIntegerField()
    suffix = models.CharField(max_length=10, blank=True, help_text="e.g. + or %")
    icon = models.CharField(max_length=40, blank=True, help_text="Lucide icon name")

    def __str__(self):
        return f"{self.label}: {self.value}{self.suffix}"


class Service(TimeStampedModel, SluggedModel, OrderedModel):
    summary = models.CharField(max_length=240)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=40, blank=True, help_text="Lucide icon name")
    image = models.ImageField(upload_to="services/", blank=True, null=True)
    highlights = models.JSONField(
        default=list, blank=True, help_text='["Point one", "Point two"]'
    )


class ValueProp(TimeStampedModel, OrderedModel):
    """The "Why NOKS" cards."""

    title = models.CharField(max_length=120)
    description = models.CharField(max_length=280)
    icon = models.CharField(max_length=40, blank=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "Why-NOKS card"
        verbose_name_plural = "Why-NOKS cards"

    def __str__(self):
        return self.title


class ProcessStep(TimeStampedModel, OrderedModel):
    title = models.CharField(max_length=120)
    description = models.CharField(max_length=300)
    icon = models.CharField(max_length=40, blank=True)
    duration = models.CharField(max_length=60, blank=True, help_text="e.g. Within 24 hrs")

    def __str__(self):
        return self.title


class Milestone(TimeStampedModel, OrderedModel):
    """About-page timeline."""

    year = models.CharField(max_length=12)
    title = models.CharField(max_length=140)
    description = models.CharField(max_length=300)

    class Meta(OrderedModel.Meta):
        ordering = ["order", "year"]

    def __str__(self):
        return f"{self.year} — {self.title}"


class Testimonial(TimeStampedModel, OrderedModel):
    author = models.CharField(max_length=120)
    role = models.CharField(max_length=140, blank=True)
    company = models.CharField(max_length=140, blank=True)
    quote = models.TextField()
    rating = models.PositiveSmallIntegerField(default=5)
    avatar = models.ImageField(upload_to="testimonials/", blank=True, null=True)
    logo = models.ImageField(upload_to="clients/", blank=True, null=True)
    source = models.CharField(
        max_length=30,
        choices=[("google", "Google Review"), ("direct", "Direct"), ("linkedin", "LinkedIn")],
        default="direct",
    )

    def __str__(self):
        return f"{self.author} — {self.company}"


class ClientLogo(TimeStampedModel, OrderedModel):
    name = models.CharField(max_length=140)
    logo = models.ImageField(upload_to="clients/", blank=True, null=True)
    website = models.URLField(blank=True)

    def __str__(self):
        return self.name


class FAQ(TimeStampedModel, OrderedModel):
    question = models.CharField(max_length=280)
    answer = models.TextField()
    category = models.CharField(max_length=80, blank=True, db_index=True)
    page = models.CharField(
        max_length=40,
        default="home",
        db_index=True,
        help_text="Which page this FAQ belongs to (home, products, contact…).",
    )

    class Meta(OrderedModel.Meta):
        verbose_name = "FAQ"
        verbose_name_plural = "FAQs"

    def __str__(self):
        return self.question


class Certification(TimeStampedModel, OrderedModel):
    name = models.CharField(max_length=140)
    issuer = models.CharField(max_length=140, blank=True)
    description = models.CharField(max_length=280, blank=True)
    badge = models.ImageField(upload_to="certifications/", blank=True, null=True)

    def __str__(self):
        return self.name


class TeamMember(TimeStampedModel, OrderedModel):
    name = models.CharField(max_length=140)
    role = models.CharField(max_length=140)
    bio = models.TextField(blank=True)
    photo = models.ImageField(upload_to="team/", blank=True, null=True)
    linkedin = models.URLField(blank=True)

    def __str__(self):
        return self.name


class MediaAsset(TimeStampedModel):
    """Central media library used by the admin."""

    title = models.CharField(max_length=200)
    file = models.FileField(upload_to="library/%Y/%m/")
    alt_text = models.CharField(max_length=250, blank=True)
    tags = models.CharField(max_length=250, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
