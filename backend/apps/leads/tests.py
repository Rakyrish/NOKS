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
        self.assertEqual(quote.reference, "NOKS-Q-000001")
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
