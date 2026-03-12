from rest_framework import serializers

from apps.accounts.serializers import PartnerProfileSerializer
from apps.cities.serializers import CitySerializer

from .models import (
    CustomerRate,
    PartnerCustomRate,
    PartnerDefaultRate,
    PartnerRateRequest,
    ScrapCategory,
)


class ScrapCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ScrapCategory
        fields = ["id", "name", "slug", "icon_url", "is_active"]


class CustomerRateSerializer(serializers.ModelSerializer):
    category = ScrapCategorySerializer(read_only=True)
    city = CitySerializer(read_only=True)

    class Meta:
        model = CustomerRate
        fields = ["id", "category", "city", "price_per_kg", "updated_at"]


class PartnerDefaultRateSerializer(serializers.ModelSerializer):
    category = ScrapCategorySerializer(read_only=True)
    city = CitySerializer(read_only=True)

    class Meta:
        model = PartnerDefaultRate
        fields = ["id", "category", "city", "price_per_kg", "updated_at"]


class PartnerCustomRateSerializer(serializers.ModelSerializer):
    category = ScrapCategorySerializer(read_only=True)

    class Meta:
        model = PartnerCustomRate
        fields = ["id", "partner", "category", "price_per_kg", "updated_at"]


class PartnerRateRequestSerializer(serializers.ModelSerializer):
    partner = PartnerProfileSerializer(read_only=True)
    category = ScrapCategorySerializer(read_only=True)

    class Meta:
        model = PartnerRateRequest
        fields = [
            "id", "partner", "category", "requested_rate", "current_rate",
            "reason", "status", "review_notes", "created_at", "reviewed_at",
        ]


class PartnerRateRequestCreateSerializer(serializers.Serializer):
    category_id = serializers.IntegerField()
    requested_rate = serializers.DecimalField(max_digits=10, decimal_places=2)
    reason = serializers.CharField(required=False, allow_blank=True)


class ScrapRateSerializer(serializers.Serializer):
    """Simple rate display for customer/partner apps."""
    category_id = serializers.IntegerField()
    category_name = serializers.CharField()
    price_per_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
