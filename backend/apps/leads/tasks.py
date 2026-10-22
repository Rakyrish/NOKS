"""Persistent notification recovery with no customer data in diagnostic logs."""
import logging
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


def _messages(notification):
    brand = settings.BRAND
    lead = notification.quote or notification.inquiry
    if notification.quote_id:
        quote = notification.quote
        lines = "\n".join(f"{i.product_name} — {i.quantity} {i.unit}; packaging: {i.packaging or 'to confirm'}; grade: {i.product_grade}; URL: {i.product_url}; notes: {i.notes}" for i in quote.items.all())
        subject = f"[{brand['name']}] Quotation request {quote.reference}"
        details = f"Reference: {quote.reference}\nDelivery: {quote.delivery_location}\nRequired by: {quote.required_by or 'not specified'}\nItems:\n{lines}"
    else:
        subject = f"[{brand['name']}] {lead.get_topic_display()}"
        details = f"Subject: {lead.subject}"
    sales = f"From: {lead.full_name}\nEmail: {lead.email}\nPhone: {lead.phone}\nCompany: {lead.company}\n{details}\nMessage:\n{lead.message}"
    ack = f"Hello {lead.full_name},\n\nYour request has been saved for the {brand['name']} sales team.\n{details}\n\nContact: {brand['phone']} · {brand['email']}"
    return lead, subject, sales, ack


@shared_task
def deliver_notification(notification_id):
    from .models import LeadNotification
    with transaction.atomic():
        notification = LeadNotification.objects.select_for_update(of=("self",)).select_related("quote", "inquiry").get(pk=notification_id)
        if notification.sales_sent_at and notification.acknowledgement_sent_at:
            return
        notification.attempts += 1
        try:
            if settings.EMAIL_BACKEND.endswith(("console.EmailBackend", "dummy.EmailBackend", "filebased.EmailBackend")):
                raise RuntimeError("EmailNotConfigured")
            lead, subject, sales, acknowledgement = _messages(notification)
            for field, recipient, mail_subject, body in (
                ("sales_sent_at", settings.SALES_NOTIFICATION_EMAIL, subject, sales),
                ("acknowledgement_sent_at", lead.email, "Request received by " + settings.BRAND["name"], acknowledgement),
            ):
                if getattr(notification, field):
                    continue
                sent = send_mail(mail_subject, body, settings.DEFAULT_FROM_EMAIL, [recipient], fail_silently=False)
                if sent != 1:
                    raise RuntimeError("EmailNotAccepted")
                setattr(notification, field, timezone.now())
            notification.last_error = ""
            notification.next_attempt_at = None
        except Exception as exc:
            # Error types only: SMTP exceptions can contain addresses or credentials.
            notification.last_error = "EmailNotConfigured" if str(exc) == "EmailNotConfigured" else type(exc).__name__
            notification.next_attempt_at = timezone.now() + timedelta(seconds=min(21600, 60 * 2 ** min(notification.attempts, 8)))
            logger.warning("Notification %s attempt %s failed (%s)", notification.pk, notification.attempts, notification.last_error)
        notification.save()


@shared_task
def recover_notifications():
    from .models import LeadNotification
    due = LeadNotification.objects.filter(next_attempt_at__lte=timezone.now()).order_by("next_attempt_at").values_list("pk", flat=True)[:50]
    for notification_id in due:
        deliver_notification.delay(notification_id)


# Compatibility for any already-queued tasks from the previous release.
@shared_task
def notify_quote_request(quote_id):
    from .models import LeadNotification
    notification, _ = LeadNotification.objects.get_or_create(quote_id=quote_id, defaults={"next_attempt_at": timezone.now()})
    deliver_notification(notification.pk)


@shared_task
def notify_inquiry(inquiry_id):
    from .models import LeadNotification
    notification, _ = LeadNotification.objects.get_or_create(inquiry_id=inquiry_id, defaults={"next_attempt_at": timezone.now()})
    deliver_notification(notification.pk)
