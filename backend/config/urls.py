from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from apps.assistant import views as assistant_views
from apps.blog import views as blog_views
from apps.catalog import views as catalog_views
from apps.core import views as core_views
from apps.leads import views as leads_views

router = DefaultRouter()

# Catalog
router.register("products", catalog_views.ProductViewSet, basename="product")
router.register("categories", catalog_views.CategoryViewSet, basename="category")
router.register("industries", catalog_views.IndustryViewSet, basename="industry")
router.register("manufacturers", catalog_views.ManufacturerViewSet, basename="manufacturer")
router.register("package-sizes", catalog_views.PackageSizeViewSet, basename="package-size")

# Knowledge centre
router.register("posts", blog_views.PostViewSet, basename="post")
router.register("blog-categories", blog_views.BlogCategoryViewSet, basename="blog-category")
router.register("authors", blog_views.AuthorViewSet, basename="author")

# Site content
router.register("stats", core_views.StatViewSet, basename="stat")
router.register("services", core_views.ServiceViewSet, basename="service")
router.register("value-props", core_views.ValuePropViewSet, basename="value-prop")
router.register("process", core_views.ProcessStepViewSet, basename="process")
router.register("milestones", core_views.MilestoneViewSet, basename="milestone")
router.register("testimonials", core_views.TestimonialViewSet, basename="testimonial")
router.register("clients", core_views.ClientLogoViewSet, basename="client")
router.register("certifications", core_views.CertificationViewSet, basename="certification")
router.register("team", core_views.TeamMemberViewSet, basename="team")
router.register("faqs", core_views.FAQViewSet, basename="faq")

# Leads
router.register("quotes", leads_views.QuoteRequestViewSet, basename="quote")
router.register("inquiries", leads_views.InquiryViewSet, basename="inquiry")
router.register("newsletter", leads_views.NewsletterViewSet, basename="newsletter")

api_v1 = [
    path("", include(router.urls)),
    path("homepage/", core_views.homepage, name="homepage"),
    path("site-config/", core_views.site_config, name="site-config"),
    path("health/", core_views.health, name="health"),
    path("assistant/chat/", assistant_views.chat, name="assistant-chat"),
    path("assistant/lead/", assistant_views.capture_lead, name="assistant-lead"),
    path("assistant/config/", assistant_views.assistant_config, name="assistant-config"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    # url_name must carry the "api" namespace the router is mounted under.
    path("docs/", SpectacularSwaggerView.as_view(url_name="api:schema"), name="docs"),
]

urlpatterns = [
    path(settings.ADMIN_URL, admin.site.urls),
    path("api/v1/", include((api_v1, "api"))),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
