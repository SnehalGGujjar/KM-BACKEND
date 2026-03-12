from django.contrib import admin

from .models import (
    CustomerRate,
    PartnerCustomRate,
    PartnerDefaultRate,
    PartnerRateRequest,
    ScrapCategory,
)


@admin.register(ScrapCategory)
class ScrapCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active")
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("is_active",)


@admin.register(CustomerRate)
class CustomerRateAdmin(admin.ModelAdmin):
    list_display = ("category", "city", "price_per_kg", "updated_by", "updated_at")
    list_filter = ("city", "category")


@admin.register(PartnerDefaultRate)
class PartnerDefaultRateAdmin(admin.ModelAdmin):
    list_display = ("category", "city", "price_per_kg", "updated_by", "updated_at")
    list_filter = ("city", "category")


@admin.register(PartnerCustomRate)
class PartnerCustomRateAdmin(admin.ModelAdmin):
    list_display = ("partner", "category", "price_per_kg", "updated_by", "updated_at")
    list_filter = ("category",)
    raw_id_fields = ("partner",)


@admin.register(PartnerRateRequest)
class PartnerRateRequestAdmin(admin.ModelAdmin):
    list_display = ("partner", "category", "current_rate", "requested_rate", "status", "created_at")
    list_filter = ("status", "category")
    raw_id_fields = ("partner",)
