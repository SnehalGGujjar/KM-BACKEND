from django.contrib import admin

from .models import Order, OrderRating, ScrapItem


class ScrapItemInline(admin.TabularInline):
    model = ScrapItem
    extra = 0
    readonly_fields = ("customer_amount", "partner_amount")


class OrderRatingInline(admin.StackedInline):
    model = OrderRating
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_id", "customer", "partner", "city",
        "status", "pickup_date", "pickup_slot", "created_at",
    )
    list_filter = ("city", "status", "pickup_date")
    search_fields = ("order_id", "customer__name", "customer__phone", "partner__name")
    readonly_fields = (
        "order_id", "created_at", "assigned_at", "on_the_way_at",
        "arrived_at", "otp_verified_at", "scrap_submitted_at",
        "invoice_approved_at", "payment_confirmed_at", "completed_at",
        "cancelled_at", "updated_at",
    )
    raw_id_fields = ("customer", "partner")
    inlines = [ScrapItemInline, OrderRatingInline]


@admin.register(ScrapItem)
class ScrapItemAdmin(admin.ModelAdmin):
    list_display = ("order", "category", "weight_kg", "customer_rate", "partner_rate", "customer_amount", "partner_amount")
    raw_id_fields = ("order",)


@admin.register(OrderRating)
class OrderRatingAdmin(admin.ModelAdmin):
    list_display = ("order", "customer", "rating", "created_at")
    readonly_fields = ("created_at",)
    raw_id_fields = ("order", "customer")
