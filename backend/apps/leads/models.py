"""Quotation requests, inquiries and newsletter capture."""

import uuid

from django.db import models

from apps.core.models import TimeStampedModel


class SubmissionModel(TimeStampedModel):
    idempotency_key = models.UUIDField(null=True, blank=True, unique=True, editable=False)
    submission_digest = models.CharField(max_length=64, blank=True, editable=False, db_default="")

    class Meta:
        abstract = True


class QuoteRequest(SubmissionModel):
    class Status(models.TextChoices):
        NEW = "new", "New"
        REVIEWING = "reviewing", "Reviewing"
        QUOTED = "quoted", "Quoted"
        WON = "won", "Won"
        LOST = "lost", "Lost"

    class Source(models.TextChoices):
        WEBSITE = "website", "Website form"
        PRODUCT = "product", "Product page"
        AI = "ai", "AI assistant"
        WHATSAPP = "whatsapp", "WhatsApp"

    reference = models.CharField(max_length=24, unique=True, editable=False, db_index=True)

    full_name = models.CharField(max_length=140)
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)
    company = models.CharField(max_length=180, blank=True)
    country = models.CharField(max_length=80, blank=True)
    industry = models.ForeignKey(
        "catalog.Industry", null=True, blank=True, on_delete=models.SET_NULL
    )

    message = models.TextField(blank=True)
    delivery_location = models.CharField(max_length=200, blank=True)
    required_by = models.DateField(null=True, blank=True)

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NEW, db_index=True
    )
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.WEBSITE)
    internal_notes = models.TextField(blank=True)
    handled_by = models.ForeignKey(
        "auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="quotes"
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Quotation request"

    def __str__(self):
        return f"{self.reference} — {self.full_name}"

    def save(self, *args, **kwargs):
        if not self.reference:
            # Random references avoid collisions between simultaneous submissions.
            self.reference = f"NOKS-Q-{uuid.uuid4().hex[:16].upper()}"
        super().save(*args, **kwargs)

    @property
    def total_items(self):
        return self.items.count()


class QuoteItem(TimeStampedModel):
    quote = models.ForeignKey(QuoteRequest, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "catalog.Product", null=True, blank=True, on_delete=models.SET_NULL
    )
    product_name = models.CharField(
        max_length=250, blank=True, help_text="Free-text when the product isn't in the catalog."
    )
    product_grade = models.CharField(max_length=80, blank=True, db_default="")
    product_url = models.URLField(max_length=500, blank=True, db_default="")
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    unit = models.CharField(max_length=30, default="kg")
    packaging = models.CharField(max_length=80, blank=True)
    notes = models.CharField(max_length=300, blank=True)

    def __str__(self):
        return self.product_name or (self.product.name if self.product else "Item")

    def save(self, *args, **kwargs):
        if self.product and not self.product_name:
            self.product_name = self.product.name
        super().save(*args, **kwargs)


class Inquiry(SubmissionModel):
    class Topic(models.TextChoices):
        GENERAL = "general", "General enquiry"
        TECHNICAL = "technical", "Technical support"
        PARTNERSHIP = "partnership", "Partnership"
        SOURCING = "sourcing", "Chemical sourcing"
        CAREERS = "careers", "Careers"

    full_name = models.CharField(max_length=140)
    email = models.EmailField()
    phone = models.CharField(max_length=40, blank=True)
    company = models.CharField(max_length=180, blank=True)
    topic = models.CharField(max_length=20, choices=Topic.choices, default=Topic.GENERAL)
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    is_handled = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Customer inquiry"
        verbose_name_plural = "Customer inquiries"

    def __str__(self):
        return f"{self.full_name} — {self.get_topic_display()}"


class NewsletterSubscriber(TimeStampedModel):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    source = models.CharField(max_length=60, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.email


class LeadNotification(TimeStampedModel):
    """Durable delivery state; lead records remain the authoritative receipt."""
    quote = models.OneToOneField(QuoteRequest, null=True, blank=True, on_delete=models.CASCADE)
    inquiry = models.OneToOneField(Inquiry, null=True, blank=True, on_delete=models.CASCADE)
    sales_sent_at = models.DateTimeField(null=True, blank=True)
    acknowledgement_sent_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveIntegerField(default=0)
    next_attempt_at = models.DateTimeField(null=True, blank=True, db_index=True)
    last_error = models.CharField(max_length=80, blank=True)

    class Meta:
        constraints = [models.CheckConstraint(
            condition=(models.Q(quote__isnull=False, inquiry__isnull=True)
                       | models.Q(quote__isnull=True, inquiry__isnull=False)),
            name="notification_has_one_lead")]
