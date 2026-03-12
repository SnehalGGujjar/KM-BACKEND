"""
Invoices app — Views.
Admin invoice review, edit, and approve workflow.
"""

from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import ScrapItem
from apps.wallet.models import PartnerWallet

from .models import Invoice
from .serializers import InvoiceSerializer


class AdminInvoiceListView(generics.ListAPIView):
    """GET /admin/invoices/ — List invoices with city and status filters."""

    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = Invoice.objects.select_related(
            "order", "order__customer", "order__partner", "order__city"
        ).prefetch_related("order__scrap_items", "order__scrap_items__category")

        city_id = self.request.query_params.get("city_id")
        inv_status = self.request.query_params.get("status")

        if city_id:
            qs = qs.filter(order__city_id=city_id)
        if inv_status:
            qs = qs.filter(status=inv_status)
        return qs


class AdminInvoiceDetailView(APIView):
    """GET /admin/invoices/{id}/ — Full invoice detail for split-panel view."""

    permission_classes = [permissions.IsAdminUser]

    def get(self, request, pk):
        try:
            invoice = Invoice.objects.select_related(
                "order", "order__customer", "order__partner", "order__city"
            ).prefetch_related(
                "order__scrap_items", "order__scrap_items__category"
            ).get(pk=pk)
        except Invoice.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Invoice not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "success": True,
            "data": InvoiceSerializer(invoice).data,
            "error": None,
        })


class AdminInvoiceEditView(APIView):
    """
    PUT /admin/invoices/{id}/edit/
    Admin edits scrap items (weights/rates) before approving.
    Automatically recalculates invoice totals.
    """

    permission_classes = [permissions.IsAdminUser]

    def put(self, request, pk):
        try:
            invoice = Invoice.objects.get(pk=pk, status="PENDING_APPROVAL")
        except Invoice.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Pending invoice not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        items_data = request.data.get("items", [])
        admin_notes = request.data.get("admin_notes", "")

        with transaction.atomic():
            for item_data in items_data:
                try:
                    item = ScrapItem.objects.get(
                        pk=item_data["id"], order=invoice.order
                    )
                except ScrapItem.DoesNotExist:
                    continue

                if "weight_kg" in item_data:
                    item.weight_kg = Decimal(str(item_data["weight_kg"]))
                if "customer_rate" in item_data:
                    item.customer_rate = Decimal(str(item_data["customer_rate"]))
                if "partner_rate" in item_data:
                    item.partner_rate = Decimal(str(item_data["partner_rate"]))
                item.save()  # auto-recalculates amounts

            # Recalculate invoice totals
            invoice.admin_notes = admin_notes
            invoice.recalculate()

        # Refresh from DB
        invoice.refresh_from_db()

        return Response({
            "success": True,
            "data": InvoiceSerializer(invoice).data,
            "error": None,
        })


class AdminInvoiceApproveView(APIView):
    """
    POST /admin/invoices/{id}/approve/
    Approve invoice → deduct commission from partner wallet →
    transition order to PAYMENT_PENDING.

    This is an atomic operation — if wallet deduction fails,
    the entire approval is rolled back.
    """

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            invoice = Invoice.objects.select_related(
                "order", "order__partner"
            ).get(pk=pk, status="PENDING_APPROVAL")
        except Invoice.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Pending invoice not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        order = invoice.order
        partner = order.partner

        if not partner:
            return Response(
                {"success": False, "data": None, "error": "No partner assigned to this order"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # 1. Approve invoice
            invoice.status = "APPROVED"
            invoice.approved_by = request.user
            invoice.approved_at = timezone.now()
            invoice.save(update_fields=["status", "approved_by", "approved_at"])

            # 2. Deduct commission from partner wallet
            wallet, _ = PartnerWallet.objects.get_or_create(partner=partner)
            wallet.deduct(
                amount=invoice.commission,
                reference_order=order,
                notes=f"Commission for order {order.order_id}",
            )

            # 3. Transition order
            order.invoice_approved_at = timezone.now()
            order.transition_to("PAYMENT_PENDING")

        from apps.notifications.tasks import (
            notify_partner_invoice_approved,
            notify_customer_invoice_ready,
        )
        notify_partner_invoice_approved(order, invoice)
        notify_customer_invoice_ready(order, invoice)

        return Response({
            "success": True,
            "data": InvoiceSerializer(invoice).data,
            "error": None,
        })
