from rest_framework import serializers

from apps.orders.serializers import ScrapItemSerializer

from .models import Invoice


class InvoiceSerializer(serializers.ModelSerializer):
    order_id = serializers.CharField(source="order.order_id", read_only=True)
    customer_name = serializers.CharField(source="order.customer.name", read_only=True)
    partner_name = serializers.CharField(source="order.partner.name", read_only=True, default=None)
    scrap_items = ScrapItemSerializer(source="order.scrap_items", many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id", "order_id", "customer_name", "partner_name",
            "customer_total", "partner_total", "commission",
            "scrap_items", "status", "admin_notes",
            "created_at", "approved_at",
        ]


class InvoiceEditSerializer(serializers.Serializer):
    """Admin: edit individual scrap item rates/weights before approving."""
    items = serializers.ListField(required=False)
    admin_notes = serializers.CharField(required=False, allow_blank=True)
