"""
Wallet app — Models.
Partner wallet for commission deductions and admin top-ups.
"""

from decimal import Decimal

from django.db import models, transaction


class InsufficientBalanceError(Exception):
    """Raised when wallet balance is insufficient for a deduction."""

    pass


class PartnerWallet(models.Model):
    """
    Wallet for each approved partner.
    Created when partner is approved by admin.
    Balance can go negative (admin must monitor).
    """

    partner = models.OneToOneField(
        "accounts.PartnerProfile", on_delete=models.CASCADE, related_name="wallet",
    )
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Wallet: {self.partner.name} — ₹{self.balance}"

    @transaction.atomic
    def deduct(self, amount: Decimal, reference_order=None, notes: str = "") -> "WalletTransaction":
        """
        Deduct commission from wallet. Creates a transaction record.
        Note: balance CAN go negative per spec.
        """
        balance_before = self.balance
        self.balance -= amount
        self.save(update_fields=["balance", "updated_at"])

        if self.balance < Decimal("200.00"):
            from apps.notifications.tasks import notify_partner_wallet_low
            notify_partner_wallet_low(self.partner, self.balance)

        return WalletTransaction.objects.create(
            wallet=self,
            type="COMMISSION_DEDUCTION",
            amount=amount,
            balance_before=balance_before,
            balance_after=self.balance,
            reference_order=reference_order,
            notes=notes or f"Commission deduction for order {reference_order.order_id if reference_order else 'N/A'}",
        )

    @transaction.atomic
    def top_up(self, amount: Decimal, notes: str = "") -> "WalletTransaction":
        """Admin top-up."""
        balance_before = self.balance
        self.balance += amount
        self.save(update_fields=["balance", "updated_at"])

        return WalletTransaction.objects.create(
            wallet=self,
            type="TOP_UP",
            amount=amount,
            balance_before=balance_before,
            balance_after=self.balance,
            notes=notes or "Admin top-up",
        )

    @transaction.atomic
    def adjust(self, amount: Decimal, notes: str = "") -> "WalletTransaction":
        """Admin adjustment (can be positive or negative)."""
        balance_before = self.balance
        self.balance += amount
        self.save(update_fields=["balance", "updated_at"])

        return WalletTransaction.objects.create(
            wallet=self,
            type="ADMIN_ADJUSTMENT",
            amount=abs(amount),
            balance_before=balance_before,
            balance_after=self.balance,
            notes=notes or "Admin adjustment",
        )


class WalletTransaction(models.Model):
    """
    Immutable record of every wallet balance change.
    All deductions, top-ups, and adjustments are logged here.
    """

    TYPE_CHOICES = [
        ("COMMISSION_DEDUCTION", "Commission Deduction"),
        ("TOP_UP", "Admin Top-Up"),
        ("ADMIN_ADJUSTMENT", "Admin Adjustment"),
    ]

    wallet = models.ForeignKey(
        PartnerWallet, on_delete=models.CASCADE, related_name="transactions",
    )
    type = models.CharField(max_length=25, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_before = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    reference_order = models.ForeignKey(
        "orders.Order", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="wallet_transactions",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.type}: ₹{self.amount} (Wallet: {self.wallet.partner.name})"
