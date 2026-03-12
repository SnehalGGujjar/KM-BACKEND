"""
Accounts app — Views.
Auth views (OTP send/verify, registration) will be fully implemented in Phase 3.
This file contains admin-facing customer and partner endpoints.
"""

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CustomerProfile, PartnerProfile
from .serializers import (
    AdminCustomerCreateSerializer,
    AdminCustomerUpdateSerializer,
    AdminPartnerDetailSerializer,
    CustomerProfileSerializer,
    CustomerProfileUpdateSerializer,
    PartnerProfileSerializer,
)


# ── Customer Endpoints ───────────────────────────────


class CustomerProfileView(generics.RetrieveUpdateAPIView):
    """Customer: get/update own profile."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return CustomerProfileUpdateSerializer
        return CustomerProfileSerializer

    def get_object(self):
        return self.request.user.customer_profile


# ── Partner Endpoints ────────────────────────────────


class PartnerProfileView(generics.RetrieveAPIView):
    """Partner: get own profile + approval_status + wallet balance."""

    serializer_class = PartnerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.partner_profile


class PartnerToggleOnlineView(APIView):
    """Partner: toggle is_online. Only APPROVED partners can go online."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            partner = request.user.partner_profile
        except PartnerProfile.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Partner profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if partner.approval_status != "APPROVED":
            return Response(
                {"success": False, "data": None, "error": "Only approved partners can go online"},
                status=status.HTTP_403_FORBIDDEN,
            )

        partner.is_online = not partner.is_online
        partner.save(update_fields=["is_online", "updated_at"])

        return Response({
            "success": True,
            "data": {"is_online": partner.is_online},
            "error": None,
        })


# ── Admin Customer Endpoints ─────────────────────────


class AdminCustomerListView(generics.ListAPIView):
    """Admin: list all customers with city filter."""

    serializer_class = CustomerProfileSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = CustomerProfile.objects.select_related("city").all()
        city_id = self.request.query_params.get("city_id")
        customer_type = self.request.query_params.get("type")
        if city_id:
            qs = qs.filter(city_id=city_id)
        if customer_type:
            qs = qs.filter(customer_type=customer_type)
        return qs


class AdminCustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: get/update/soft-delete customer."""

    permission_classes = [permissions.IsAdminUser]
    queryset = CustomerProfile.objects.select_related("city").all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return AdminCustomerUpdateSerializer
        return CustomerProfileSerializer

    def perform_destroy(self, instance):
        """Soft delete — set is_active=False."""
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])


class AdminCustomerCreateView(APIView):
    """Admin: manually create a customer without the app."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        serializer = AdminCustomerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Check if phone already exists
        if CustomerProfile.objects.filter(phone=data["phone"]).exists():
            return Response(
                {"success": False, "data": None, "error": "Phone number already registered"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.contrib.auth.models import User

        # Create user + profile
        user = User.objects.create_user(
            username=data["phone"],
            password=None,  # No password — OTP-based auth
        )
        profile = CustomerProfile.objects.create(
            user=user,
            phone=data["phone"],
            name=data["name"],
            address=data["address"],
            city_id=data["city_id"],
            customer_type=data.get("customer_type", "B2C"),
        )

        return Response(
            {
                "success": True,
                "data": CustomerProfileSerializer(profile).data,
                "error": None,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminCustomerMessageView(APIView):
    """Admin: send in-app notification to a specific customer."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            customer = CustomerProfile.objects.get(pk=pk)
        except CustomerProfile.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Customer not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        title = request.data.get("title")
        body = request.data.get("body")
        if not title or not body:
            return Response(
                {"success": False, "data": None, "error": "Title and body are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create notification — will be fully wired in Phase 6
        # For now, return success placeholder
        return Response({
            "success": True,
            "data": {"message": f"Notification sent to {customer.name}"},
            "error": None,
        })


# ── Admin Partner Endpoints ──────────────────────────


class AdminPartnerListView(generics.ListAPIView):
    """Admin: list all partners with city and status filter."""

    serializer_class = PartnerProfileSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = PartnerProfile.objects.select_related("city").all()
        city_id = self.request.query_params.get("city_id")
        approval_status = self.request.query_params.get("status")
        if city_id:
            qs = qs.filter(city_id=city_id)
        if approval_status:
            qs = qs.filter(approval_status=approval_status)
        return qs


class AdminPartnerDetailView(generics.RetrieveAPIView):
    """Admin: full partner detail."""

    serializer_class = AdminPartnerDetailSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = PartnerProfile.objects.select_related("city").all()


class AdminPartnerApproveView(APIView):
    """Admin: approve partner registration."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            partner = PartnerProfile.objects.get(pk=pk)
        except PartnerProfile.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Partner not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if partner.approval_status != "PENDING":
            return Response(
                {"success": False, "data": None, "error": "Partner is not in PENDING status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        partner.approval_status = "APPROVED"
        partner.rejection_reason = None
        partner.save(update_fields=["approval_status", "rejection_reason", "updated_at"])

        # Create wallet for partner if it doesn't exist (will be wired in Phase 5)
        return Response({
            "success": True,
            "data": PartnerProfileSerializer(partner).data,
            "error": None,
        })


class AdminPartnerRejectView(APIView):
    """Admin: reject partner registration."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            partner = PartnerProfile.objects.get(pk=pk)
        except PartnerProfile.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Partner not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        reason = request.data.get("reason", "")
        partner.approval_status = "REJECTED"
        partner.rejection_reason = reason
        partner.is_online = False
        partner.save(update_fields=["approval_status", "rejection_reason", "is_online", "updated_at"])

        return Response({
            "success": True,
            "data": PartnerProfileSerializer(partner).data,
            "error": None,
        })


class AdminPartnerDisableView(APIView):
    """Admin: disable active partner."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            partner = PartnerProfile.objects.get(pk=pk)
        except PartnerProfile.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Partner not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        partner.approval_status = "DISABLED"
        partner.is_online = False
        partner.save(update_fields=["approval_status", "is_online", "updated_at"])

        return Response({
            "success": True,
            "data": PartnerProfileSerializer(partner).data,
            "error": None,
        })


class AdminPartnerEnableView(APIView):
    """Admin: re-enable a disabled partner."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            partner = PartnerProfile.objects.get(pk=pk)
        except PartnerProfile.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Partner not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if partner.approval_status != "DISABLED":
            return Response(
                {"success": False, "data": None, "error": "Partner is not in DISABLED status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        partner.approval_status = "APPROVED"
        partner.save(update_fields=["approval_status", "updated_at"])

        return Response({
            "success": True,
            "data": PartnerProfileSerializer(partner).data,
            "error": None,
        })
