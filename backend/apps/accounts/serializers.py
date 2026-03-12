from rest_framework import serializers

from apps.cities.serializers import CitySerializer

from .models import CustomerProfile, PartnerProfile


class CustomerProfileSerializer(serializers.ModelSerializer):
    city = CitySerializer(read_only=True)
    city_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = CustomerProfile
        fields = [
            "id",
            "phone",
            "name",
            "address",
            "city",
            "city_id",
            "latitude",
            "longitude",
            "email",
            "customer_type",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "phone", "created_at", "updated_at"]


class CustomerProfileCreateSerializer(serializers.Serializer):
    """Used during customer registration after first OTP verification."""

    name = serializers.CharField(max_length=200)
    address = serializers.CharField()
    city_id = serializers.IntegerField()
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False)
    email = serializers.EmailField(required=False)


class CustomerProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ["name", "address", "email", "latitude", "longitude"]


class PartnerProfileSerializer(serializers.ModelSerializer):
    city = CitySerializer(read_only=True)
    city_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = PartnerProfile
        fields = [
            "id",
            "phone",
            "name",
            "city",
            "city_id",
            "aadhaar_doc_url",
            "vehicle_doc_url",
            "license_doc_url",
            "godown_address",
            "godown_latitude",
            "godown_longitude",
            "approval_status",
            "rejection_reason",
            "is_online",
            "rating",
            "total_ratings",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "phone",
            "approval_status",
            "rejection_reason",
            "is_online",
            "rating",
            "total_ratings",
            "created_at",
            "updated_at",
        ]


class PartnerRegistrationSerializer(serializers.Serializer):
    """Used during partner registration after first OTP verification."""

    name = serializers.CharField(max_length=200)
    city_id = serializers.IntegerField()
    aadhaar_doc_url = serializers.CharField(max_length=500)
    vehicle_doc_url = serializers.CharField(max_length=500)
    license_doc_url = serializers.CharField(max_length=500)
    godown_address = serializers.CharField(required=False, allow_blank=True)
    godown_latitude = serializers.DecimalField(
        max_digits=10, decimal_places=7, required=False
    )
    godown_longitude = serializers.DecimalField(
        max_digits=10, decimal_places=7, required=False
    )


class AdminCustomerCreateSerializer(serializers.Serializer):
    """Admin: manually create a customer without the app."""

    name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=15)
    address = serializers.CharField()
    city_id = serializers.IntegerField()
    customer_type = serializers.ChoiceField(choices=["B2C", "B2B"], default="B2C")


class AdminCustomerUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ["name", "address", "email", "customer_type", "city", "latitude", "longitude"]


class AdminPartnerDetailSerializer(serializers.ModelSerializer):
    """Extended partner info for admin detail page."""

    city = CitySerializer(read_only=True)
    wallet_balance = serializers.SerializerMethodField()

    class Meta:
        model = PartnerProfile
        fields = [
            "id",
            "phone",
            "name",
            "city",
            "aadhaar_doc_url",
            "vehicle_doc_url",
            "license_doc_url",
            "godown_address",
            "godown_latitude",
            "godown_longitude",
            "approval_status",
            "rejection_reason",
            "is_online",
            "rating",
            "total_ratings",
            "wallet_balance",
            "created_at",
            "updated_at",
        ]

    def get_wallet_balance(self, obj: PartnerProfile):
        """Get the partner's wallet balance if wallet exists."""
        try:
            return str(obj.wallet.balance)
        except Exception:
            return "0.00"
