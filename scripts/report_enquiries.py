"""Run through manage.py shell; aggregate enquiry counts without personal data."""
from datetime import timedelta
from django.db.models import Count
from django.utils import timezone
from apps.leads.models import Inquiry, LeadNotification, QuoteRequest

start = timezone.now() - timedelta(days=28)
quotes = QuoteRequest.objects.filter(created_at__gte=start)
inquiries = Inquiry.objects.filter(created_at__gte=start)
print("Last 28 days:", "quotes", quotes.count(), "inquiries", inquiries.count())
print("Quote statuses:", list(quotes.values("status").annotate(count=Count("id")).order_by("status")))
print("Quote sources:", list(quotes.values("source").annotate(count=Count("id")).order_by("source")))
print("Catalogue product requests:", list(quotes.filter(items__product__isnull=False).values("items__product__slug").annotate(count=Count("id", distinct=True)).order_by("-count")))
print("Pending sales email notifications:", LeadNotification.objects.filter(sales_sent_at__isnull=True).count())
print("Pending acknowledgement notifications:", LeadNotification.objects.filter(acknowledgement_sent_at__isnull=True).count())
