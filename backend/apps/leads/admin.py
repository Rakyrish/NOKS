from django.contrib import admin
from django.utils.html import format_html
from import_export.admin import ExportMixin

from .models import Inquiry, NewsletterSubscriber, QuoteItem, QuoteRequest


class QuoteItemInline(admin.TabularInline):
    model = QuoteItem
    extra = 0
    autocomplete_fields = ("product",)
    fields = ("product", "product_name", "quantity", "unit", "packaging", "notes")


@admin.register(QuoteRequest)
class QuoteRequestAdmin(ExportMixin, admin.ModelAdmin):
    inlines = [QuoteItemInline]
    list_display = (
        "reference", "full_name", "company", "email",
        "total_items", "status_badge", "source", "created_at",
    )
    list_filter = ("status", "source", "industry", "created_at")
    search_fields = ("reference", "full_name", "email", "company", "phone")
    readonly_fields = ("reference", "created_at", "updated_at")
    date_hierarchy = "created_at"
    autocomplete_fields = ("handled_by",)
    list_per_page = 30
    actions = ["mark_reviewing", "mark_quoted", "mark_won", "mark_lost"]

    fieldsets = (
        ("Request", {"fields": (("reference", "created_at"), ("status", "source"))}),
        ("Customer", {
            "fields": (
                ("full_name", "company"), ("email", "phone"),
                ("country", "industry"),
            )
        }),
        ("Requirement", {"fields": ("message", "delivery_location", "required_by")}),
        ("Internal", {"fields": ("handled_by", "internal_notes")}),
    )

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        colors = {
            "new": ("#0C48E6", "#EEF3FF"),
            "reviewing": ("#B45309", "#FFFBEB"),
            "quoted": ("#7C3AED", "#F5F3FF"),
            "won": ("#059669", "#ECFDF5"),
            "lost": ("#B91C1C", "#FEF2F2"),
        }
        fg, bg = colors.get(obj.status, ("#475569", "#F1F5F9"))
        return format_html(
            '<span style="background:{};color:{};padding:3px 10px;border-radius:999px;'
            'font-size:11px;font-weight:600">{}</span>',
            bg, fg, obj.get_status_display(),
        )

    def _set_status(self, request, queryset, status, label):
        self.message_user(request, f"{queryset.update(status=status)} marked {label}.")

    @admin.action(description="Mark as reviewing")
    def mark_reviewing(self, request, qs):
        self._set_status(request, qs, QuoteRequest.Status.REVIEWING, "reviewing")

    @admin.action(description="Mark as quoted")
    def mark_quoted(self, request, qs):
        self._set_status(request, qs, QuoteRequest.Status.QUOTED, "quoted")

    @admin.action(description="Mark as won")
    def mark_won(self, request, qs):
        self._set_status(request, qs, QuoteRequest.Status.WON, "won")

    @admin.action(description="Mark as lost")
    def mark_lost(self, request, qs):
        self._set_status(request, qs, QuoteRequest.Status.LOST, "lost")


@admin.register(Inquiry)
class InquiryAdmin(ExportMixin, admin.ModelAdmin):
    list_display = ("full_name", "company", "topic", "email", "is_handled", "created_at")
    list_filter = ("topic", "is_handled", "created_at")
    list_editable = ("is_handled",)
    search_fields = ("full_name", "email", "company", "message")
    date_hierarchy = "created_at"


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(ExportMixin, admin.ModelAdmin):
    list_display = ("email", "is_active", "source", "created_at")
    list_filter = ("is_active", "source")
    search_fields = ("email",)
