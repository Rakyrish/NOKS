from django.contrib import admin
from django.utils.html import format_html

from .models import (
    FAQ,
    Certification,
    ClientLogo,
    MediaAsset,
    Milestone,
    ProcessStep,
    Service,
    Stat,
    TeamMember,
    Testimonial,
    ValueProp,
)


class OrderedAdmin(admin.ModelAdmin):
    list_editable = ("order", "is_published")
    list_filter = ("is_published",)


@admin.register(Stat)
class StatAdmin(OrderedAdmin):
    list_display = ("label", "value", "suffix", "icon", "order", "is_published")


@admin.register(Service)
class ServiceAdmin(OrderedAdmin):
    list_display = ("name", "summary", "icon", "order", "is_published")
    search_fields = ("name", "summary")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(ValueProp)
class ValuePropAdmin(OrderedAdmin):
    list_display = ("title", "description", "icon", "order", "is_published")


@admin.register(ProcessStep)
class ProcessStepAdmin(OrderedAdmin):
    list_display = ("title", "duration", "icon", "order", "is_published")


@admin.register(Milestone)
class MilestoneAdmin(OrderedAdmin):
    list_display = ("year", "title", "order", "is_published")


@admin.register(Testimonial)
class TestimonialAdmin(OrderedAdmin):
    list_display = ("author", "company", "rating", "source", "order", "is_published")
    list_filter = ("is_published", "source", "rating")
    search_fields = ("author", "company", "quote")


@admin.register(ClientLogo)
class ClientLogoAdmin(OrderedAdmin):
    list_display = ("name", "preview", "website", "order", "is_published")

    @admin.display(description="Logo")
    def preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" style="height:26px" />', obj.logo.url)
        return "—"


@admin.register(Certification)
class CertificationAdmin(OrderedAdmin):
    list_display = ("name", "issuer", "order", "is_published")


@admin.register(TeamMember)
class TeamMemberAdmin(OrderedAdmin):
    list_display = ("name", "role", "order", "is_published")
    search_fields = ("name", "role")


@admin.register(FAQ)
class FAQAdmin(OrderedAdmin):
    list_display = ("question", "page", "category", "order", "is_published")
    list_filter = ("is_published", "page", "category")
    search_fields = ("question", "answer")


@admin.register(MediaAsset)
class MediaAssetAdmin(admin.ModelAdmin):
    list_display = ("preview", "title", "tags", "created_at")
    list_display_links = ("preview", "title")
    search_fields = ("title", "alt_text", "tags")
    list_per_page = 40

    @admin.display(description="")
    def preview(self, obj):
        name = obj.file.name.lower()
        if name.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg")):
            return format_html(
                '<img src="{}" style="height:44px;width:44px;border-radius:8px;'
                'object-fit:cover" />',
                obj.file.url,
            )
        return format_html('<span style="font-size:22px">📄</span>')
