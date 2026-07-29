from django.contrib import admin
from django.utils.html import format_html

from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ("role", "content", "created_at")
    can_delete = False
    fields = ("created_at", "role", "content")

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    inlines = [MessageInline]
    list_display = (
        "short_session", "visitor_name", "visitor_email",
        "turns", "lead_badge", "referrer_path", "created_at",
    )
    list_filter = ("is_qualified_lead", "created_at")
    search_fields = ("visitor_name", "visitor_email", "visitor_phone", "messages__content")
    readonly_fields = ("session_id", "created_at", "updated_at")
    date_hierarchy = "created_at"

    @admin.display(description="Session")
    def short_session(self, obj):
        return obj.session_id.hex[:8]

    @admin.display(description="Turns")
    def turns(self, obj):
        return obj.messages.count()

    @admin.display(description="Lead", ordering="is_qualified_lead")
    def lead_badge(self, obj):
        if obj.is_qualified_lead:
            return format_html(
                '<span style="background:#ECFDF5;color:#059669;padding:3px 10px;'
                'border-radius:999px;font-size:11px;font-weight:600">Qualified</span>'
            )
        return format_html('<span style="color:#94A3B8">—</span>')
