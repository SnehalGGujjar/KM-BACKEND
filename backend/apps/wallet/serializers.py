from rest_framework import serializers

from .models import PartnerWallet, WalletTransaction


class WalletTransactionSerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(
        source="reference_order.order_id", read_only=True, default=None
    )

    class Meta:
        model = WalletTransaction
        fields = [
            "id", "type", "amount", "balance_before", "balance_after",
            "order_id", "notes", "created_at",
        ]


class PartnerWalletSerializer(serializers.ModelSerializer):
    partner_name = serializers.CharField(source="partner.name", read_only=True)

    class Meta:
        model = PartnerWallet
        fields = ["id", "partner_name", "balance", "updated_at"]
