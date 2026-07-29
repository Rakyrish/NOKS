from django.conf import settings


def brand(request):
    """Expose env-driven brand tokens to every template (incl. the admin)."""
    return {"BRAND": settings.BRAND, "ENVIRONMENT": settings.ENVIRONMENT}
