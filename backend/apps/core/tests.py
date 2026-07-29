from django.conf import settings
from django.test import TestCase
from django.urls import reverse


class BrandConfigTests(TestCase):
    """The root .env is the single source of truth for both stacks."""

    def test_hex_colours_survive_env_parsing(self):
        # django-environ strips everything after '#'; python-dotenv must be used.
        for key in ("primary", "primary_dark", "navy", "emerald"):
            with self.subTest(colour=key):
                value = settings.BRAND[key]
                self.assertTrue(
                    value.startswith("#") and len(value) == 7,
                    f"BRAND[{key!r}] is {value!r}, expected a 6-digit hex colour",
                )

    def test_site_config_endpoint_exposes_brand(self):
        response = self.client.get(reverse("api:site-config"))
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["brand"]["name"], settings.BRAND["name"])
        self.assertIn("ai_enabled", payload)


class HomepageEndpointTests(TestCase):
    def test_homepage_returns_every_section_key(self):
        response = self.client.get(reverse("api:homepage"))
        self.assertEqual(response.status_code, 200)
        for key in (
            "stats", "industries", "categories", "featured_products",
            "value_props", "services", "process", "testimonials",
            "clients", "certifications", "faqs", "latest_posts",
        ):
            self.assertIn(key, response.json())

    def test_health_endpoint(self):
        response = self.client.get(reverse("api:health"))
        self.assertEqual(response.json()["status"], "ok")


class AssistantTests(TestCase):
    def test_chat_requires_a_message(self):
        response = self.client.post(
            reverse("api:assistant-chat"), {}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)

    def test_chat_degrades_gracefully_without_api_key(self):
        """No ANTHROPIC_API_KEY must not 500 — it should still answer."""
        with self.settings(ANTHROPIC_API_KEY=""):
            response = self.client.post(
                reverse("api:assistant-chat"),
                {"message": "Do you stock caustic soda?"},
                content_type="application/json",
            )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertFalse(payload["configured"])
        self.assertTrue(payload["reply"])
        self.assertIn("session_id", payload)
