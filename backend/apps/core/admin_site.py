"""Branded admin site with an operations dashboard on the index page."""

from django.conf import settings
from django.contrib.admin import AdminSite
from django.contrib.admin.apps import AdminConfig

from .metrics import dashboard_metrics


class NoksAdminSite(AdminSite):
    site_header = settings.ADMIN_SITE_HEADER
    site_title = settings.ADMIN_SITE_TITLE
    index_title = settings.ADMIN_INDEX_TITLE
    site_url = settings.SITE_URL

    def index(self, request, extra_context=None):
        return super().index(request, {**(extra_context or {}), "noks": dashboard_metrics()})


class NoksAdminConfig(AdminConfig):
    default_site = "apps.core.admin_site.NoksAdminSite"
