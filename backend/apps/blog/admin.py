from django.contrib import admin
from django.utils.html import format_html

from apps.catalog.admin import SEO_FIELDSET

from .models import Author, BlogCategory, Post, PostFAQ


class PostFAQInline(admin.TabularInline):
    model = PostFAQ
    extra = 2
    fields = ("question", "answer", "order")


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    inlines = [PostFAQInline]
    list_display = ("title", "category", "author", "status_badge", "published_at",
                    "reading_minutes", "view_count")
    list_filter = ("status", "category", "is_featured", "author")
    search_fields = ("title", "excerpt", "body")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("category", "author")
    filter_horizontal = ("related_posts", "suggested_products", "related_industries")
    date_hierarchy = "published_at"
    readonly_fields = ("reading_minutes", "view_count")
    save_on_top = True
    actions = ["publish"]

    fieldsets = (
        ("Article", {
            "fields": (
                ("title", "slug"), "excerpt", "body",
                ("cover_image", "cover_alt"),
            )
        }),
        ("Classification", {"fields": (("category", "author"), "tags")}),
        ("Internal linking (SEO)", {
            "fields": ("related_posts", "suggested_products", "related_industries")
        }),
        ("Publishing", {
            "fields": (("status", "published_at", "is_featured"),
                       ("reading_minutes", "view_count"))
        }),
        SEO_FIELDSET,
    )

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        colors = {
            "published": ("#059669", "#ECFDF5"),
            "review": ("#B45309", "#FFFBEB"),
            "draft": ("#475569", "#F1F5F9"),
        }
        fg, bg = colors.get(obj.status, ("#475569", "#F1F5F9"))
        return format_html(
            '<span style="background:{};color:{};padding:3px 10px;border-radius:999px;'
            'font-size:11px;font-weight:600">{}</span>',
            bg, fg, obj.get_status_display(),
        )

    @admin.action(description="Publish selected articles")
    def publish(self, request, queryset):
        count = 0
        for post in queryset:
            post.status = Post.Status.PUBLISHED
            post.save()
            count += 1
        self.message_user(request, f"{count} articles published.")


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "icon", "order", "is_published")
    list_editable = ("order", "is_published")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    fieldsets = (
        (None, {"fields": (("name", "slug"), "description", ("icon", "color"),
                           ("order", "is_published"))}),
        SEO_FIELDSET,
    )


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ("name", "role")
    search_fields = ("name", "role")
    prepopulated_fields = {"slug": ("name",)}
