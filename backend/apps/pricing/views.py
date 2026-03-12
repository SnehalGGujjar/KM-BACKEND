"""
Pricing app — Views.
Customer rates, partner rates, admin pricing management, rate change requests.
"""

from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    CustomerRate,
    PartnerCustomRate,
    PartnerDefaultRate,
    PartnerRateRequest,
    ScrapCategory,
)
from .serializers import (
    CustomerRateSerializer,
    PartnerCustomRateSerializer,
    PartnerDefaultRateSerializer,
    PartnerRateRequestCreateSerializer,
    PartnerRateRequestSerializer,
    ScrapRateSerializer,
)
from .utils import resolve_partner_rate


# ── Customer Endpoints ───────────────────────────────


class CustomerRatesView(APIView):
    """GET /pricing/rates/ — Get all customer rates for the customer's city."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            city = request.user.customer_profile.city
        except Exception:
            return Response(
                {"success": False, "data": None, "error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        rates = CustomerRate.objects.filter(
            city=city, category__is_active=True
        ).select_related("category")

        data = [
            {
                "category_id": r.category.id,
                "category_name": r.category.name,
                "price_per_kg": str(r.price_per_kg),
            }
            for r in rates
        ]

        return Response({"success": True, "data": data, "error": None})


# ── Partner Endpoints ────────────────────────────────


class PartnerRatesView(APIView):
    """GET /partner/pricing/rates/ — Partner's effective rates (custom or default)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            partner = request.user.partner_profile
        except Exception:
            return Response(
                {"success": False, "data": None, "error": "Partner profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        categories = ScrapCategory.objects.filter(is_active=True)
        data = []
        for cat in categories:
            rate = resolve_partner_rate(partner, cat)
            if rate is not None:
                data.append({
                    "category_id": cat.id,
                    "category_name": cat.name,
                    "price_per_kg": str(rate),
                })

        return Response({"success": True, "data": data, "error": None})


class PartnerRateRequestCreateView(APIView):
    """POST /partner/pricing/request-change/ — Request a rate change."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            partner = request.user.partner_profile
        except Exception:
            return Response(
                {"success": False, "data": None, "error": "Partner profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PartnerRateRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            category = ScrapCategory.objects.get(pk=data["category_id"], is_active=True)
        except ScrapCategory.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Invalid category"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_rate = resolve_partner_rate(partner, category)

        rate_request = PartnerRateRequest.objects.create(
            partner=partner,
            category=category,
            requested_rate=data["requested_rate"],
            current_rate=current_rate or 0,
            reason=data.get("reason", ""),
        )

        return Response(
            {
                "success": True,
                "data": PartnerRateRequestSerializer(rate_request).data,
                "error": None,
            },
            status=status.HTTP_201_CREATED,
        )


class PartnerMyRateRequestsView(generics.ListAPIView):
    """GET /partner/pricing/my-requests/ — Partner's rate change request history."""

    serializer_class = PartnerRateRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PartnerRateRequest.objects.filter(
            partner=self.request.user.partner_profile
        ).select_related("category", "partner", "partner__city")


# ── Admin Endpoints ──────────────────────────────────


class AdminPricingView(APIView):
    """GET /admin/pricing/ — All rates filtered by city."""

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        city_id = request.query_params.get("city_id")

        customer_qs = CustomerRate.objects.select_related("category", "city")
        partner_default_qs = PartnerDefaultRate.objects.select_related("category", "city")
        partner_custom_qs = PartnerCustomRate.objects.select_related("category", "partner", "partner__city")

        if city_id:
            customer_qs = customer_qs.filter(city_id=city_id)
            partner_default_qs = partner_default_qs.filter(city_id=city_id)
            partner_custom_qs = partner_custom_qs.filter(partner__city_id=city_id)

        return Response({
            "success": True,
            "data": {
                "customer_rates": CustomerRateSerializer(customer_qs, many=True).data,
                "partner_default_rates": PartnerDefaultRateSerializer(partner_default_qs, many=True).data,
                "partner_custom_rates": PartnerCustomRateSerializer(partner_custom_qs, many=True).data,
            },
            "error": None,
        })


class AdminUpdateCustomerRateView(APIView):
    """PUT /admin/pricing/customer/{city_id}/{category_id}/ — Update customer rate."""

    permission_classes = [permissions.IsAdminUser]

    def put(self, request, city_id, category_id):
        price_per_kg = request.data.get("price_per_kg")
        if not price_per_kg:
            return Response(
                {"success": False, "data": None, "error": "price_per_kg is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rate, _ = CustomerRate.objects.update_or_create(
            city_id=city_id,
            category_id=category_id,
            defaults={"price_per_kg": price_per_kg, "updated_by": request.user},
        )

        return Response({
            "success": True,
            "data": CustomerRateSerializer(rate).data,
            "error": None,
        })


class AdminUpdatePartnerDefaultRateView(APIView):
    """PUT /admin/pricing/partner-default/{city_id}/{category_id}/ — Update default partner rate."""

    permission_classes = [permissions.IsAdminUser]

    def put(self, request, city_id, category_id):
        price_per_kg = request.data.get("price_per_kg")
        if not price_per_kg:
            return Response(
                {"success": False, "data": None, "error": "price_per_kg is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rate, _ = PartnerDefaultRate.objects.update_or_create(
            city_id=city_id,
            category_id=category_id,
            defaults={"price_per_kg": price_per_kg, "updated_by": request.user},
        )

        return Response({
            "success": True,
            "data": PartnerDefaultRateSerializer(rate).data,
            "error": None,
        })


class AdminUpdatePartnerCustomRateView(APIView):
    """PUT /admin/pricing/partner-custom/{partner_id}/{category_id}/ — Set custom partner rate."""

    permission_classes = [permissions.IsAdminUser]

    def put(self, request, partner_id, category_id):
        price_per_kg = request.data.get("price_per_kg")
        if not price_per_kg:
            return Response(
                {"success": False, "data": None, "error": "price_per_kg is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rate, _ = PartnerCustomRate.objects.update_or_create(
            partner_id=partner_id,
            category_id=category_id,
            defaults={"price_per_kg": price_per_kg, "updated_by": request.user},
        )

        return Response({
            "success": True,
            "data": PartnerCustomRateSerializer(rate).data,
            "error": None,
        })


class AdminRateRequestListView(generics.ListAPIView):
    """GET /admin/pricing/rate-requests/ — Pending rate change requests."""

    serializer_class = PartnerRateRequestSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = PartnerRateRequest.objects.select_related(
            "partner", "partner__city", "category"
        )
        city_id = self.request.query_params.get("city_id")
        req_status = self.request.query_params.get("status")
        if city_id:
            qs = qs.filter(partner__city_id=city_id)
        if req_status:
            qs = qs.filter(status=req_status)
        return qs


class AdminRateRequestApproveView(APIView):
    """POST /admin/pricing/rate-requests/{id}/approve/ — Approve rate change request."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            rate_request = PartnerRateRequest.objects.get(pk=pk, status="PENDING")
        except PartnerRateRequest.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Pending rate request not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Auto-create/update PartnerCustomRate
        PartnerCustomRate.objects.update_or_create(
            partner=rate_request.partner,
            category=rate_request.category,
            defaults={
                "price_per_kg": rate_request.requested_rate,
                "updated_by": request.user,
            },
        )

        rate_request.status = "APPROVED"
        rate_request.reviewed_by = request.user
        rate_request.reviewed_at = timezone.now()
        rate_request.save(update_fields=["status", "reviewed_by", "reviewed_at"])

        return Response({
            "success": True,
            "data": PartnerRateRequestSerializer(rate_request).data,
            "error": None,
        })


class AdminRateRequestRejectView(APIView):
    """POST /admin/pricing/rate-requests/{id}/reject/ — Reject rate change request."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            rate_request = PartnerRateRequest.objects.get(pk=pk, status="PENDING")
        except PartnerRateRequest.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Pending rate request not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        rate_request.status = "REJECTED"
        rate_request.reviewed_by = request.user
        rate_request.review_notes = request.data.get("review_notes", "")
        rate_request.reviewed_at = timezone.now()
        rate_request.save(update_fields=["status", "reviewed_by", "review_notes", "reviewed_at"])

        return Response({
            "success": True,
            "data": PartnerRateRequestSerializer(rate_request).data,
            "error": None,
        })
