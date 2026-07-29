"""Transactional email for inbound leads. Runs eagerly when Redis is absent."""

import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_quote_request(self, quote_id):
    from .models import QuoteRequest

    try:
        quote = QuoteRequest.objects.prefetch_related("items").get(pk=quote_id)
    except QuoteRequest.DoesNotExist:
        logger.warning("Quote %s vanished before notification", quote_id)
        return

    lines = "\n".join(
        f"  • {i.product_name} — {i.quantity} {i.unit}"
        f"{f' ({i.packaging})' if i.packaging else ''}"
        for i in quote.items.all()
    )
    brand = settings.BRAND

    send_mail(
        subject=f"[{brand['name']}] New quotation request {quote.reference}",
        message=(
            f"{quote.full_name} ({quote.company or 'no company'}) requested a quote.\n\n"
            f"Email: {quote.email}\nPhone: {quote.phone or '—'}\n"
            f"Deliver to: {quote.delivery_location or '—'}\n"
            f"Required by: {quote.required_by or '—'}\n\n"
            f"Items:\n{lines}\n\nMessage:\n{quote.message or '—'}\n"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.SALES_NOTIFICATION_EMAIL],
        fail_silently=True,
    )

    send_mail(
        subject=f"We received your request — {quote.reference}",
        message=(
            f"Hi {quote.full_name},\n\n"
            f"Thank you for contacting {brand['name']} {brand['division']}. "
            f"Your reference is {quote.reference}. A technical sales specialist will "
            f"respond within one business day.\n\n"
            f"Items requested:\n{lines}\n\n"
            f"— {brand['name']} {brand['division']}\n{brand['phone']} · {brand['email']}"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[quote.email],
        fail_silently=True,
    )
    return quote.reference


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_inquiry(self, inquiry_id):
    from .models import Inquiry

    try:
        inquiry = Inquiry.objects.get(pk=inquiry_id)
    except Inquiry.DoesNotExist:
        return

    send_mail(
        subject=f"[{settings.BRAND['name']}] {inquiry.get_topic_display()} — {inquiry.full_name}",
        message=(
            f"From: {inquiry.full_name} <{inquiry.email}>\n"
            f"Company: {inquiry.company or '—'}\nPhone: {inquiry.phone or '—'}\n\n"
            f"{inquiry.message}"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.SALES_NOTIFICATION_EMAIL],
        fail_silently=True,
    )
