from django.contrib import admin

from .models import Invoice


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("order", "customer_total", "partner_total", "commission", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("order__order_id",)
    readonly_fields = ("created_at", "approved_at")
    raw_id_fields = ("order",)
