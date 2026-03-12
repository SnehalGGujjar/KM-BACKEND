from django.contrib import admin

from .models import PartnerWallet, WalletTransaction


@admin.register(PartnerWallet)
class PartnerWalletAdmin(admin.ModelAdmin):
    list_display = ("partner", "balance", "updated_at")
    search_fields = ("partner__name", "partner__phone")
    readonly_fields = ("updated_at",)
    raw_id_fields = ("partner",)


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ("wallet", "type", "amount", "balance_before", "balance_after", "created_at")
    list_filter = ("type",)
    search_fields = ("wallet__partner__name", "wallet__partner__phone")
    readonly_fields = ("created_at",)
    raw_id_fields = ("wallet", "reference_order")
