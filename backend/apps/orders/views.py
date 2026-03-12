"""
Orders app — Views.
Order lifecycle endpoints for customer, partner, and admin.
"""

import random
import string

from django.utils import timezone

from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.pricing.models import ScrapCategory
from apps.pricing.utils import get_customer_rate, resolve_partner_rate

from .models import InvalidTransitionError, Order, OrderRating, ScrapItem
from .serializers import (
    OrderCreateSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    OrderRatingCreateSerializer,
    ScrapItemCreateSerializer,
)


# ── Customer Endpoints ───────────────────────────────


class CustomerCreateOrderView(APIView):
    """POST /orders/create/ — Customer creates a new pickup request."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            customer = request.user.customer_profile
        except Exception:
            return Response(
                {"success": False, "data": None, "error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        order = Order.objects.create(
            customer=customer,
            city=customer.city,
            pickup_date=data["pickup_date"],
            pickup_slot=data["pickup_slot"],
            scrap_photos=data.get("scrap_photos", []),
            scrap_description=data.get("scrap_description", ""),
        )

        return Response(
            {
                "success": True,
                "data": OrderDetailSerializer(order).data,
                "error": None,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomerCurrentOrderView(APIView):
    """GET /orders/current/ — Customer's currently active order (for polling)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            customer = request.user.customer_profile
        except Exception:
            return Response(
                {"success": False, "data": None, "error": "Customer profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        active_statuses = [
            "NEW", "ASSIGNED", "ON_THE_WAY", "ARRIVED",
            "COLLECTING", "AWAITING_INVOICE", "PAYMENT_PENDING",
        ]
        order = Order.objects.filter(
            customer=customer, status__in=active_statuses
        ).select_related("customer", "partner", "city").prefetch_related("scrap_items").first()

        if not order:
            return Response({"success": True, "data": None, "error": None})

        return Response({
            "success": True,
            "data": OrderDetailSerializer(order).data,
            "error": None,
        })


class CustomerOrderHistoryView(generics.ListAPIView):
    """GET /orders/history/ — Customer's completed and cancelled orders."""

    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            customer=self.request.user.customer_profile,
            status__in=["COMPLETED", "CANCELLED"],
        ).select_related("customer", "partner", "city")


class CustomerOrderDetailView(APIView):
    """GET /orders/{order_id}/ — Customer order detail."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = Order.objects.select_related(
                "customer", "partner", "city"
            ).prefetch_related("scrap_items", "rating").get(
                order_id=order_id,
                customer=request.user.customer_profile,
            )
        except Order.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "success": True,
            "data": OrderDetailSerializer(order).data,
            "error": None,
        })


class CustomerCancelOrderView(APIView):
    """POST /orders/{order_id}/cancel/ — Customer cancels own order."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(
                order_id=order_id,
                customer=request.user.customer_profile,
            )
        except Order.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            order.transition_to(
                "CANCELLED",
                cancelled_by="CUSTOMER",
                cancellation_reason=request.data.get("reason", ""),
            )
        except InvalidTransitionError as e:
            return Response(
                {"success": False, "data": None, "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "success": True,
            "data": OrderDetailSerializer(order).data,
            "error": None,
        })


class CustomerRateOrderView(APIView):
    """POST /orders/{order_id}/rate/ — Customer rates completed order."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(
                order_id=order_id,
                customer=request.user.customer_profile,
                status="COMPLETED",
            )
        except Order.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Completed order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if OrderRating.objects.filter(order=order).exists():
            return Response(
                {"success": False, "data": None, "error": "Order already rated"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OrderRatingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rating = OrderRating.objects.create(
            order=order,
            customer=order.customer,
            rating=serializer.validated_data["rating"],
            feedback=serializer.validated_data.get("feedback", ""),
        )

        return Response({
            "success": True,
            "data": {"rating": rating.rating, "feedback": rating.feedback},
            "error": None,
        })


# ── Partner Endpoints ────────────────────────────────


class PartnerAssignedOrdersView(APIView):
    """GET /partner/orders/ — Partner's assigned active orders."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            partner = request.user.partner_profile
        except Exception:
            return Response(
                {"success": False, "data": None, "error": "Partner profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        orders = Order.objects.filter(
            partner=partner,
            status__in=["ASSIGNED", "ON_THE_WAY", "ARRIVED", "COLLECTING", "AWAITING_INVOICE"],
        ).select_related("customer", "city")

        return Response({
            "success": True,
            "data": OrderListSerializer(orders, many=True).data,
            "error": None,
        })


class PartnerOrderDetailView(APIView):
    """GET /partner/orders/{order_id}/ — Partner order detail."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        try:
            order = Order.objects.select_related(
                "customer", "partner", "city"
            ).prefetch_related("scrap_items").get(
                order_id=order_id,
                partner=request.user.partner_profile,
            )
        except Order.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "success": True,
            "data": OrderDetailSerializer(order).data,
            "error": None,
        })


class PartnerUpdateStatusView(APIView):
    """POST /partner/orders/{order_id}/status/ — Partner updates order status."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(
                order_id=order_id,
                partner=request.user.partner_profile,
            )
        except Order.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("status", "").upper()
        if not new_status:
            return Response(
                {"success": False, "data": None, "error": "status is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order.transition_to(new_status)
        except InvalidTransitionError as e:
            return Response(
                {"success": False, "data": None, "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "success": True,
            "data": OrderDetailSerializer(order).data,
            "error": None,
        })


class PartnerVerifyArrivalOTPView(APIView):
    """POST /partner/orders/{order_id}/verify-otp/ — Partner verifies arrival OTP."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(
                order_id=order_id,
                partner=request.user.partner_profile,
                status="ARRIVED",
            )
        except Order.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Order not found or not in ARRIVED status"},
                status=status.HTTP_404_NOT_FOUND,
            )

        otp = request.data.get("otp", "")
        if otp != order.arrival_otp:
            return Response(
                {"success": False, "data": None, "error": "Invalid OTP"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.arrival_otp_verified = True
        order.transition_to("COLLECTING")

        return Response({
            "success": True,
            "data": OrderDetailSerializer(order).data,
            "error": None,
        })


class PartnerSubmitScrapView(APIView):
    """
    POST /partner/orders/{order_id}/submit-scrap/
    Partner submits scrap items with weights.
    Rates are auto-snapshotted from the current pricing tables.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(
                order_id=order_id,
                partner=request.user.partner_profile,
                status="COLLECTING",
            )
        except Order.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Order not found or not in COLLECTING status"},
                status=status.HTTP_404_NOT_FOUND,
            )

        items_data = request.data.get("items", [])
        if not items_data:
            return Response(
                {"success": False, "data": None, "error": "At least one scrap item is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        partner = order.partner
        created_items = []

        for item_data in items_data:
            ser = ScrapItemCreateSerializer(data=item_data)
            ser.is_valid(raise_exception=True)

            try:
                category = ScrapCategory.objects.get(pk=ser.validated_data["category_id"])
            except ScrapCategory.DoesNotExist:
                return Response(
                    {"success": False, "data": None, "error": f"Invalid category ID: {ser.validated_data['category_id']}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            customer_rate = get_customer_rate(order.city_id, category)
            partner_rate = resolve_partner_rate(partner, category)

            if customer_rate is None or partner_rate is None:
                return Response(
                    {"success": False, "data": None, "error": f"Rates not configured for {category.name} in {order.city.name}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            item = ScrapItem.objects.create(
                order=order,
                category=category,
                weight_kg=ser.validated_data["weight_kg"],
                customer_rate=customer_rate,
                partner_rate=partner_rate,
            )
            created_items.append(item)

        # Transition to AWAITING_INVOICE
        order.transition_to("AWAITING_INVOICE")

        # Auto-generate invoice from scrap items
        from apps.invoices.models import Invoice
        Invoice.create_for_order(order)

        return Response({
            "success": True,
            "data": OrderDetailSerializer(order).data,
            "error": None,
        })


class PartnerOrderHistoryView(generics.ListAPIView):
    """GET /partner/orders/history/ — Partner's completed orders."""

    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            partner=self.request.user.partner_profile,
            status="COMPLETED",
        ).select_related("customer", "city")


# ── Admin Endpoints ──────────────────────────────────


class AdminOrderListView(generics.ListAPIView):
    """GET /admin/orders/ — All orders with filters."""

    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = Order.objects.select_related("customer", "partner", "city").all()

        city_id = self.request.query_params.get("city_id")
        order_status = self.request.query_params.get("status")
        search = self.request.query_params.get("search")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if city_id:
            qs = qs.filter(city_id=city_id)
        if order_status:
            qs = qs.filter(status=order_status)
        if search:
            qs = qs.filter(
                Q(order_id__icontains=search) |
                Q(customer__name__icontains=search) |
                Q(customer__phone__icontains=search) |
                Q(partner__name__icontains=search)
            )
        if date_from:
            qs = qs.filter(pickup_date__gte=date_from)
        if date_to:
            qs = qs.filter(pickup_date__lte=date_to)

        return qs


class AdminOrderDetailView(APIView):
    """GET /admin/orders/{order_id}/ — Full order detail for admin."""

    permission_classes = [permissions.IsAdminUser]

    def get(self, request, order_id):
        try:
            order = Order.objects.select_related(
                "customer", "partner", "city"
            ).prefetch_related("scrap_items", "scrap_items__category", "rating").get(
                order_id=order_id,
            )
        except Order.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "success": True,
            "data": OrderDetailSerializer(order).data,
            "error": None,
        })


class AdminAssignPartnerView(APIView):
    """POST /admin/orders/{order_id}/assign/ — Admin assigns partner to order."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, order_id):
        from apps.accounts.models import PartnerProfile

        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        partner_id = request.data.get("partner_id")
        if not partner_id:
            return Response(
                {"success": False, "data": None, "error": "partner_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            partner = PartnerProfile.objects.get(
                pk=partner_id,
                city=order.city,
                approval_status="APPROVED",
            )
        except PartnerProfile.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Approved partner not found in this city"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generate arrival OTP
        arrival_otp = "".join(random.choices(string.digits, k=6))

        order.partner = partner
        order.arrival_otp = arrival_otp
        try:
            order.transition_to("ASSIGNED")
        except InvalidTransitionError as e:
            return Response(
                {"success": False, "data": None, "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "success": True,
            "data": OrderDetailSerializer(order).data,
            "error": None,
        })


class AdminReassignPartnerView(APIView):
    """POST /admin/orders/{order_id}/reassign/ — Reassign partner (move back to NEW, then assign)."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, order_id):
        from apps.accounts.models import PartnerProfile

        try:
            order = Order.objects.get(order_id=order_id, status="ASSIGNED")
        except Order.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Assigned order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        partner_id = request.data.get("partner_id")
        if not partner_id:
            return Response(
                {"success": False, "data": None, "error": "partner_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            partner = PartnerProfile.objects.get(
                pk=partner_id, city=order.city, approval_status="APPROVED",
            )
        except PartnerProfile.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Approved partner not found in this city"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Move to NEW first
        order.transition_to("NEW")
        # Assign new partner
        arrival_otp = "".join(random.choices(string.digits, k=6))
        order.partner = partner
        order.arrival_otp = arrival_otp
        order.transition_to("ASSIGNED")

        return Response({
            "success": True,
            "data": OrderDetailSerializer(order).data,
            "error": None,
        })


class AdminCancelOrderView(APIView):
    """POST /admin/orders/{order_id}/cancel/ — Admin cancels order."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            order.transition_to(
                "CANCELLED",
                cancelled_by="ADMIN",
                cancellation_reason=request.data.get("reason", ""),
            )
        except InvalidTransitionError as e:
            return Response(
                {"success": False, "data": None, "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "success": True,
            "data": OrderDetailSerializer(order).data,
            "error": None,
        })


class AdminCreateOrderView(APIView):
    """POST /admin/orders/create/ — Admin creates order on behalf of a customer."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        from apps.accounts.models import CustomerProfile

        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer_id = data.get("customer_id")
        if not customer_id:
            return Response(
                {"success": False, "data": None, "error": "customer_id is required for admin order creation"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            customer = CustomerProfile.objects.get(pk=customer_id)
        except CustomerProfile.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Customer not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        order = Order.objects.create(
            customer=customer,
            city=customer.city,
            pickup_date=data["pickup_date"],
            pickup_slot=data["pickup_slot"],
            scrap_photos=data.get("scrap_photos", []),
            scrap_description=data.get("scrap_description", ""),
        )

        return Response(
            {
                "success": True,
                "data": OrderDetailSerializer(order).data,
                "error": None,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminCompleteOrderView(APIView):
    """POST /admin/orders/{order_id}/complete/ — Admin marks order as completed."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(order_id=order_id, status="PAYMENT_PENDING")
        except Order.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Order not found or not in PAYMENT_PENDING status"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            order.transition_to(
                "COMPLETED",
                completed_at=timezone.now(),
            )
        except InvalidTransitionError as e:
            return Response(
                {"success": False, "data": None, "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "success": True,
            "data": OrderDetailSerializer(order).data,
            "error": None,
        })


class AdminDashboardStatsView(APIView):
    """GET /admin/dashboard/ — Dashboard KPI stats."""

    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from datetime import date, timedelta

        from django.db.models import Count, Sum

        from apps.accounts.models import PartnerProfile
        from apps.invoices.models import Invoice

        city_id = request.query_params.get("city_id")
        today = date.today()
        yesterday = today - timedelta(days=1)

        # Base queryset with optional city filter
        orders_qs = Order.objects.all()
        if city_id:
            orders_qs = orders_qs.filter(city_id=city_id)

        # Today's stats
        todays_orders = orders_qs.filter(created_at__date=today)
        new_count = todays_orders.filter(status="NEW").count()
        scheduled_count = todays_orders.filter(pickup_date=today).exclude(
            status__in=["COMPLETED", "CANCELLED"]
        ).count()
        ongoing_count = orders_qs.filter(
            status__in=["ASSIGNED", "ON_THE_WAY", "ARRIVED", "COLLECTING", "AWAITING_INVOICE", "PAYMENT_PENDING"]
        ).count()
        completed_count = todays_orders.filter(status="COMPLETED").count()
        cancelled_count = todays_orders.filter(status="CANCELLED").count()

        # Pending invoices
        invoice_qs = Invoice.objects.filter(status="PENDING_APPROVAL")
        if city_id:
            invoice_qs = invoice_qs.filter(order__city_id=city_id)
        pending_invoices = invoice_qs.count()

        # Active partners
        partners_qs = PartnerProfile.objects.filter(
            approval_status="APPROVED", is_online=True
        )
        if city_id:
            partners_qs = partners_qs.filter(city_id=city_id)
        active_partners = partners_qs.count()

        # Today's revenue
        completed_today = orders_qs.filter(completed_at__date=today)
        revenue_today = Invoice.objects.filter(
            order__in=completed_today, status="APPROVED"
        ).aggregate(total=Sum("commission"))["total"] or 0

        # Yesterday's counts for trend calculation
        yesterdays_orders = orders_qs.filter(created_at__date=yesterday)
        yesterday_new = yesterdays_orders.filter(status="NEW").count() or 1
        yesterday_completed = yesterdays_orders.filter(status="COMPLETED").count() or 1
        yesterday_cancelled = yesterdays_orders.filter(status="CANCELLED").count() or 1

        return Response({
            "success": True,
            "data": {
                "new_orders_today": new_count,
                "scheduled_today": scheduled_count,
                "ongoing_now": ongoing_count,
                "completed_today": completed_count,
                "cancelled_today": cancelled_count,
                "pending_invoices": pending_invoices,
                "active_partners": active_partners,
                "todays_revenue": float(revenue_today),
                "new_orders_trend": round(((new_count - yesterday_new) / yesterday_new) * 100),
                "completed_trend": round(((completed_count - yesterday_completed) / yesterday_completed) * 100),
                "cancelled_trend": round(((cancelled_count - yesterday_cancelled) / yesterday_cancelled) * 100),
            },
            "error": None,
        })
