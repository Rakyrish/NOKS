"""Background submission of product URLs to the Google Indexing API.

Runs eagerly when Redis is absent, same as apps.leads.tasks — see
settings.CELERY_TASK_ALWAYS_EAGER.
"""

from celery import shared_task
from django.conf import settings

from .google_indexing import submit_url


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def submit_product_url(self, slug: str, action: str = "URL_UPDATED"):
    if not settings.GOOGLE_INDEXING_ENABLED:
        return
    url = f"{settings.SITE_URL}/products/{slug}"
    submit_url(url, action=action)
