from django.contrib import admin

from .models import CustomerProfile, OTPRecord, PartnerProfile


@admin.register(OTPRecord)
class OTPRecordAdmin(admin.ModelAdmin):
    list_display = ("phone_number", "purpose", "attempts", "is_used", "expires_at", "created_at")
    list_filter = ("purpose", "is_used")
    search_fields = ("phone_number",)
    readonly_fields = ("otp_hash", "created_at")


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "city", "customer_type", "is_active", "created_at")
    list_filter = ("city", "customer_type", "is_active")
    search_fields = ("name", "phone", "email")
    readonly_fields = ("created_at", "updated_at")
    raw_id_fields = ("user",)


@admin.register(PartnerProfile)
class PartnerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "phone",
        "city",
        "approval_status",
        "is_online",
        "rating",
        "created_at",
    )
    list_filter = ("city", "approval_status", "is_online")
    search_fields = ("name", "phone")
    readonly_fields = ("created_at", "updated_at", "rating", "total_ratings")
    raw_id_fields = ("user",)
    list_editable = ("approval_status",)
