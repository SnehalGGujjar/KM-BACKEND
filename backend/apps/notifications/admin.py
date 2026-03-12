from django.contrib import admin

from .models import Notification, NotificationTemplate


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "title_template", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "title", "recipient_type", "recipient_id",
        "type", "is_read", "created_at",
    )
    list_filter = ("type", "recipient_type", "is_read")
    search_fields = ("title", "body")
    readonly_fields = ("created_at",)
