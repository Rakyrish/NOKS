from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.core"
    verbose_name = "Site content"

    def ready(self):
        from .cache_invalidation import connect
        connect()
