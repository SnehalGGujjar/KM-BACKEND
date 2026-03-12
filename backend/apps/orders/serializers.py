from rest_framework import serializers

from apps.accounts.serializers import CustomerProfileSerializer, PartnerProfileSerializer
from apps.cities.serializers import CitySerializer
from apps.pricing.serializers import ScrapCategorySerializer

from .models import Order, OrderRating, ScrapItem


class ScrapItemSerializer(serializers.ModelSerializer):
    category = ScrapCategorySerializer(read_only=True)

    class Meta:
        model = ScrapItem
        fields = [
            "id", "category", "weight_kg",
            "customer_rate", "partner_rate",
            "customer_amount", "partner_amount",
        ]


class ScrapItemCreateSerializer(serializers.Serializer):
    """Used by partner when submitting collected scrap weights."""
    category_id = serializers.IntegerField()
    weight_kg = serializers.DecimalField(max_digits=10, decimal_places=2)


class OrderRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderRating
        fields = ["id", "rating", "feedback", "created_at"]


class OrderListSerializer(serializers.ModelSerializer):
    """Compact serializer for order lists."""
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    partner_name = serializers.CharField(source="partner.name", read_only=True, default=None)
    city_name = serializers.CharField(source="city.name", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_id", "customer_name", "partner_name", "city_name",
            "status", "pickup_date", "pickup_slot", "created_at",
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    """Full serializer for order detail."""
    customer = CustomerProfileSerializer(read_only=True)
    partner = PartnerProfileSerializer(read_only=True)
    city = CitySerializer(read_only=True)
    scrap_items = ScrapItemSerializer(many=True, read_only=True)
    rating = OrderRatingSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_id", "customer", "partner", "city",
            "status", "pickup_date", "pickup_slot", "pickup_slot_start",
            "scrap_photos", "scrap_description",
            "arrival_otp_verified",
            "rejection_reason", "cancelled_by", "cancellation_reason",
            "scrap_items", "rating",
            # TAT timestamps
            "created_at", "assigned_at", "on_the_way_at", "arrived_at",
            "otp_verified_at", "scrap_submitted_at", "invoice_approved_at",
            "payment_confirmed_at", "completed_at", "cancelled_at", "updated_at",
        ]


class OrderCreateSerializer(serializers.Serializer):
    """Used by customer or admin to create an order."""
    pickup_date = serializers.DateField()
    pickup_slot = serializers.CharField(max_length=20)
    scrap_photos = serializers.ListField(
        child=serializers.CharField(max_length=500),
        required=False,
        default=list,
    )
    scrap_description = serializers.CharField(required=False, allow_blank=True)
    # Admin-only fields
    customer_id = serializers.IntegerField(required=False)  # Admin assigns customer
    city_id = serializers.IntegerField(required=False)  # Admin specifies city


class OrderRatingCreateSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    feedback = serializers.CharField(required=False, allow_blank=True)
