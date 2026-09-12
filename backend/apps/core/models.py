"""Shared abstract bases + editable site content (stats, services, FAQ, …)."""

import re

from django.core.files.storage import FileSystemStorage
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


def normalize_name(name: str) -> str:
    """Collapse a name to the key used to detect a duplicate listing.

    Case, punctuation and spacing carry no meaning in a chemical or taxonomy
    name, so "Water Treatment Chemicals" and "water treatment chemicals" are
    the same thing and must not both exist. British/American -sulph-/-sulf-
    spellings fold together for the same reason.

    Digits are deliberately kept: concentration and grade numbers DO
    distinguish products ("Hydrochloric Acid 33%" vs "... 25%").
    """
    key = (name or "").lower().replace("sulph", "sulf")
    key = re.sub(r"[^a-z0-9]+", " ", key)
    return " ".join(key.split())


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ContentTimeStampedModel(TimeStampedModel):
    """Adds a timestamp that only moves when the *content* actually changes.

    `updated_at` is `auto_now`, so it fires on every save — including a staff
    member toggling a flag, a re-import that rewrites identical values, or any
    future bookkeeping write. Publishing that as a sitemap `lastmod` tells
    crawlers the page changed when it did not, and a `lastmod` that is always
    "now" is a signal Google learns to ignore.

    Subclasses list the fields a reader would notice in `CONTENT_FIELDS`; the
    stamp advances only when one of those differs from what is already stored.
    Writes that bypass `save()` (`QuerySet.update()`, e.g. the `view_count`
    bump in the product viewset) correctly leave it alone.
    """

    content_updated_at = models.DateTimeField(
        null=True, blank=True, db_index=True, editable=False
    )

    #: Fields whose change means the published page changed. Overridden below.
    CONTENT_FIELDS: tuple[str, ...] = ()

    class Meta:
        abstract = True

    def _content_snapshot(self):
        return {field: getattr(self, field, None) for field in self.CONTENT_FIELDS}

    def save(self, *args, **kwargs):
        if self.content_updated_at is None:
            # New row, or an existing one migrated in before this field existed.
            self.content_updated_at = timezone.now()
        elif self.pk and self.CONTENT_FIELDS:
            stored = (
                type(self)
                ._base_manager.filter(pk=self.pk)
                .values(*self.CONTENT_FIELDS)
                .first()
            )
            if stored is not None and stored != self._content_snapshot():
                self.content_updated_at = timezone.now()
            # `update_fields` callers must be told about the extra column, or
            # the new stamp is computed and then silently dropped.
            update_fields = kwargs.get("update_fields")
            if update_fields is not None:
                kwargs["update_fields"] = {*update_fields, "content_updated_at"}
        super().save(*args, **kwargs)


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
            # `_base_manager`, not `objects`: a publishable model's default
            # manager may hide unpublished rows, and a slug taken by a hidden
            # row is still taken.
            while model._base_manager.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.slug = slug
        if kwargs.get("update_fields") is not None:
            kwargs["update_fields"] = {*kwargs["update_fields"], "slug"}
        super().save(*args, **kwargs)


class UniquelyNamedModel(models.Model):
    """A slugged model the database itself refuses to list twice.

    `SluggedModel.save()` resolves a slug collision by appending -2, -3, …,
    which silently *creates* the duplicate instead of rejecting it. That is
    where `/categories/water-treatment-chemicals-2` came from: someone re-added
    "water treatment chemicals" next to the existing "Water Treatment
    Chemicals" and got a second published, indexable, empty landing page.

    `Product` has carried this guard since catalog migration 0004. Category and
    Industry gained it in 0007, BlogCategory here — all three are just as
    URL-bearing.

    Mix in *after* `SluggedModel` so `name` is defined by the time `save()`
    reads it.
    """

    name_key = models.CharField(max_length=220, unique=True, editable=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.name_key = normalize_name(self.name)
        if (update_fields := kwargs.get("update_fields")) is not None:
            kwargs["update_fields"] = {*update_fields, "name_key"}
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
    # Explicit local storage: this library holds arbitrary file types, so it
    # must not ride Cloudinary's image-typed default storage (see settings.py).
    file = models.FileField(upload_to="library/%Y/%m/", storage=FileSystemStorage())
    alt_text = models.CharField(max_length=250, blank=True)
    tags = models.CharField(max_length=250, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
