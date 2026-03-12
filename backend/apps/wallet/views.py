"""
Wallet app — Views.
Partner wallet view + admin wallet management.
"""

from decimal import Decimal, InvalidOperation

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PartnerWallet, WalletTransaction
from .serializers import PartnerWalletSerializer, WalletTransactionSerializer


# ── Partner Endpoints ────────────────────────────────


class PartnerWalletView(APIView):
    """GET /partner/wallet/ — Partner's wallet balance."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            wallet = request.user.partner_profile.wallet
        except Exception:
            return Response(
                {"success": False, "data": None, "error": "Wallet not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "success": True,
            "data": PartnerWalletSerializer(wallet).data,
            "error": None,
        })


class PartnerWalletTransactionsView(generics.ListAPIView):
    """GET /partner/wallet/transactions/ — Partner's transaction history."""

    serializer_class = WalletTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            wallet = self.request.user.partner_profile.wallet
        except Exception:
            return WalletTransaction.objects.none()

        return wallet.transactions.all()


# ── Admin Endpoints ──────────────────────────────────


class AdminWalletListView(generics.ListAPIView):
    """GET /admin/wallets/ — All partner wallets with city filter."""

    serializer_class = PartnerWalletSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = PartnerWallet.objects.select_related("partner", "partner__city")
        city_id = self.request.query_params.get("city_id")
        if city_id:
            qs = qs.filter(partner__city_id=city_id)
        return qs


class AdminWalletDetailView(APIView):
    """GET /admin/wallets/{partner_id}/ — Wallet detail + transactions."""

    permission_classes = [permissions.IsAdminUser]

    def get(self, request, partner_id):
        try:
            wallet = PartnerWallet.objects.get(partner_id=partner_id)
        except PartnerWallet.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Wallet not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        transactions = wallet.transactions.all()[:50]

        return Response({
            "success": True,
            "data": {
                "wallet": PartnerWalletSerializer(wallet).data,
                "transactions": WalletTransactionSerializer(transactions, many=True).data,
            },
            "error": None,
        })


class AdminWalletTopUpView(APIView):
    """POST /admin/wallets/{partner_id}/top-up/ — Admin top-up partner wallet."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, partner_id):
        try:
            wallet = PartnerWallet.objects.get(partner_id=partner_id)
        except PartnerWallet.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Wallet not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            amount = Decimal(str(request.data.get("amount", "0")))
        except (InvalidOperation, ValueError):
            return Response(
                {"success": False, "data": None, "error": "Invalid amount"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount <= 0:
            return Response(
                {"success": False, "data": None, "error": "Amount must be positive"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notes = request.data.get("notes", "")
        txn = wallet.top_up(amount, notes=notes)

        return Response({
            "success": True,
            "data": {
                "wallet": PartnerWalletSerializer(wallet).data,
                "transaction": WalletTransactionSerializer(txn).data,
            },
            "error": None,
        })


class AdminWalletAdjustView(APIView):
    """POST /admin/wallets/{partner_id}/adjust/ — Admin adjustment."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, partner_id):
        try:
            wallet = PartnerWallet.objects.get(partner_id=partner_id)
        except PartnerWallet.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Wallet not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            amount = Decimal(str(request.data.get("amount", "0")))
        except (InvalidOperation, ValueError):
            return Response(
                {"success": False, "data": None, "error": "Invalid amount"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount == 0:
            return Response(
                {"success": False, "data": None, "error": "Amount cannot be zero"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notes = request.data.get("notes", "")
        txn = wallet.adjust(amount, notes=notes)

        return Response({
            "success": True,
            "data": {
                "wallet": PartnerWalletSerializer(wallet).data,
                "transaction": WalletTransactionSerializer(txn).data,
            },
            "error": None,
        })
