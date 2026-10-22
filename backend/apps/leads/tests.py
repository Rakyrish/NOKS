from django.core import mail
from django.test import TestCase
from django.urls import reverse

from apps.catalog.models import Category, Product
from apps.leads.models import QuoteRequest


class QuoteRequestTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.category = Category.objects.create(name="Alkalis")
        cls.product = Product.objects.create(
            name="Caustic Soda Flakes",
            sku="TEST-NAOH-0001",
            category=cls.category,
            short_description="Sodium hydroxide flakes.",
        )

    def test_quote_creates_reference_and_items(self):
        response = self.client.post(
            reverse("api:quote-list"),
            {
                "full_name": "Jane Buyer",
                "email": "jane@example.com",
                "company": "Acme Water",
                "items": [
                    {"product_slug": self.product.slug, "quantity": "500", "unit": "kg"}
                ],
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201, response.content)

        quote = QuoteRequest.objects.get()
        self.assertTrue(quote.reference.startswith("NOKS-Q-"))
        self.assertEqual(quote.total_items, 1)
        self.assertEqual(quote.items.first().product_name, "Caustic Soda Flakes")

        self.product.refresh_from_db()
        self.assertEqual(self.product.quote_count, 1)

    def test_quote_requires_at_least_one_item(self):
        response = self.client.post(
            reverse("api:quote-list"),
            {"full_name": "Jane", "email": "jane@example.com", "items": []},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_quote_sends_notification_emails(self):
        self.client.post(
            reverse("api:quote-list"),
            {
                "full_name": "Jane Buyer",
                "email": "jane@example.com",
                "items": [{"product_name": "Specialty solvent", "quantity": "5", "unit": "L"}],
            },
            content_type="application/json",
        )
        # Celery runs eagerly without a broker, so both mails are sent inline.
        self.assertEqual(len(mail.outbox), 2)

    def test_inquiry_can_be_submitted(self):
        response = self.client.post(
            reverse("api:inquiry-list"),
            {
                "full_name": "Sam Engineer",
                "email": "sam@example.com",
                "message": "Do you supply food grade citric acid?",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201, response.content)

    def test_newsletter_subscription_is_idempotent(self):
        for _ in range(2):
            response = self.client.post(
                reverse("api:newsletter-list"),
                {"email": "buyer@example.com"},
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 201)


class ReceiptIntegrityTests(QuoteRequestTests):
    def payload(self):
        return {"full_name": "Controlled Test", "email": "test@example.invalid", "delivery_location": "Test location", "items": [{"product_slug": self.product.slug, "quantity": "5", "unit": "kg", "packaging": "Test packaging"}]}

    def test_idempotent_retry_and_payload_conflict(self):
        import uuid
        key = str(uuid.uuid4())
        payload = self.payload()
        first = self.client.post(reverse("api:quote-list"), payload, content_type="application/json", HTTP_IDEMPOTENCY_KEY=key)
        again = self.client.post(reverse("api:quote-list"), payload, content_type="application/json", HTTP_IDEMPOTENCY_KEY=key)
        self.assertEqual(first.status_code, 201)
        self.assertEqual(again.status_code, 200)
        self.assertEqual(first.json()["reference"], again.json()["reference"])
        self.assertEqual(QuoteRequest.objects.count(), 1)
        self.assertEqual(len(mail.outbox), 2)
        payload["delivery_location"] = "Changed"
        conflict = self.client.post(reverse("api:quote-list"), payload, content_type="application/json", HTTP_IDEMPOTENCY_KEY=key)
        self.assertEqual(conflict.status_code, 409)

    def test_broker_failure_keeps_saved_receipt_and_outbox(self):
        from unittest.mock import patch
        from apps.leads.models import LeadNotification
        with patch("apps.leads.tasks.deliver_notification.delay", side_effect=ConnectionError):
            response = self.client.post(reverse("api:quote-list"), self.payload(), content_type="application/json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LeadNotification.objects.count(), 1)
        self.assertIsNotNone(LeadNotification.objects.get().next_attempt_at)
        self.assertIn("/products/", QuoteRequest.objects.get().items.get().product_url)

    def test_zero_negative_and_unpublished_items_rejected(self):
        for quantity in ["0", "-1"]:
            payload = self.payload(); payload["items"][0]["quantity"] = quantity
            response = self.client.post(reverse("api:quote-list"), payload, content_type="application/json")
            self.assertEqual(response.status_code, 400)
        self.product.is_published = False; self.product.save()
        response = self.client.post(reverse("api:quote-list"), self.payload(), content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(QuoteRequest.objects.count(), 0)

    def test_partial_email_failure_recovers_without_resending_sales(self):
        from unittest.mock import patch
        from apps.leads.models import LeadNotification
        from apps.leads.tasks import deliver_notification
        quote = QuoteRequest.objects.create(full_name="Controlled Test", email="test@example.invalid")
        notification = LeadNotification.objects.create(quote=quote)
        with patch("apps.leads.tasks.send_mail", side_effect=[1, ConnectionError]):
            deliver_notification(notification.pk)
        notification.refresh_from_db()
        self.assertIsNotNone(notification.sales_sent_at)
        self.assertIsNone(notification.acknowledgement_sent_at)
        self.assertEqual(notification.last_error, "ConnectionError")
        with patch("apps.leads.tasks.send_mail", return_value=1) as mocked:
            deliver_notification(notification.pk)
            self.assertEqual(mocked.call_count, 1)
        notification.refresh_from_db()
        self.assertIsNotNone(notification.acknowledgement_sent_at)
        self.assertIsNone(notification.next_attempt_at)

    def test_console_backend_is_not_delivery(self):
        from django.test import override_settings
        from apps.leads.models import LeadNotification
        from apps.leads.tasks import deliver_notification
        quote = QuoteRequest.objects.create(full_name="Controlled Test", email="test@example.invalid")
        notification = LeadNotification.objects.create(quote=quote)
        with override_settings(EMAIL_BACKEND="django.core.mail.backends.console.EmailBackend"):
            deliver_notification(notification.pk)
        notification.refresh_from_db()
        self.assertEqual(notification.last_error, "EmailNotConfigured")
        self.assertIsNone(notification.sales_sent_at)
