"""Invalidate successful frontend caches after CMS saves/deletes/relations."""
import logging

from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.db.models.signals import m2m_changed, post_delete, post_save, pre_save

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def invalidate_frontend(self):
    import requests
    if not settings.INTERNAL_API_TOKEN:
        logger.warning("Frontend invalidation unavailable: renderer token missing")
        return
    try:
        response = requests.post("http://frontend:3000/api/revalidate", headers={"Authorization": "Bearer " + settings.INTERNAL_API_TOKEN}, timeout=10)
        response.raise_for_status()
    except Exception as exc:
        logger.warning("Frontend invalidation failed (%s)", type(exc).__name__)
        raise self.retry(exc=RuntimeError(type(exc).__name__))


def _remember_content(sender, instance, **kwargs):
    if instance.pk:
        old = sender.objects.filter(pk=instance.pk).values("category_id", "content_updated_at").first()
        instance._previous_catalogue_content = old


def _changed(sender, **kwargs):
    if settings.TESTING or kwargs.get("raw") or kwargs.get("action", "post_save") not in {"post_save", "post_add", "post_remove", "post_clear"}:
        return

    from django.utils import timezone
    from apps.catalog.models import Product, Category
    instance = kwargs.get("instance")
    if isinstance(instance, Product) and sender is Product:
        old = getattr(instance, "_previous_catalogue_content", None)
        if old is None or old["content_updated_at"] != instance.content_updated_at:
            ids = {instance.category_id} | ({old["category_id"]} if old else set())
            parents = Category.objects.filter(pk__in=ids).values_list("parent_id", flat=True)
            Category.objects.filter(pk__in=ids | set(parents)).update(content_updated_at=timezone.now())
    if sender._meta.model_name in {"productimage", "productdocument"} and instance:
        Product.objects.filter(pk=instance.product_id).update(content_updated_at=timezone.now())
    if kwargs.get("action") in {"post_add", "post_remove", "post_clear"} and isinstance(instance, Product):
        Product.objects.filter(pk=instance.pk).update(content_updated_at=timezone.now())
        ids = set(instance.secondary_categories.values_list("pk", flat=True)) | {instance.category_id}
        if sender == Product.secondary_categories.through:
            ids |= set(kwargs.get("pk_set") or [])
        Category.objects.filter(pk__in=ids).update(content_updated_at=timezone.now())

    def enqueue():
        try:
            invalidate_frontend.delay()
        except Exception as exc:
            # Successful content saves survive broker outages; TTL remains a fallback.
            logger.warning("Frontend invalidation not queued (%s)", type(exc).__name__)
    transaction.on_commit(enqueue)


def connect():
    from django.apps import apps
    from apps.catalog.models import Product
    pre_save.connect(_remember_content, sender=Product, dispatch_uid="remember_product_content")
    for model in apps.get_models():
        if model._meta.app_label not in {"catalog", "blog", "core"}:
            continue
        post_save.connect(_changed, sender=model, dispatch_uid=f"cms_save_{model._meta.label}")
        post_delete.connect(_changed, sender=model, dispatch_uid=f"cms_delete_{model._meta.label}")
        for field in model._meta.local_many_to_many:
            m2m_changed.connect(_changed, sender=field.remote_field.through, dispatch_uid=f"cms_m2m_{model._meta.label}_{field.name}")
