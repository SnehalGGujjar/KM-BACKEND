"""
Invoices app — Models.
Dual invoice system: Customer Invoice (what customer receives) and
Invoice total (what partner pays platform).
Commission = partner_total - customer_total.
"""

from django.conf import settings
from django.db import models


class Invoice(models.Model):
    """
    Invoice for a completed scrap collection order.
    Auto-generated when partner submits scrap items.
    Admin reviews, can edit amounts, then approves.
    On approval: commission is deducted from partner wallet.
    """

    STATUS_CHOICES = [
        ("PENDING_APPROVAL", "Pending Approval"),
        ("APPROVED", "Approved"),
    ]

    order = models.OneToOneField(
        "orders.Order", on_delete=models.CASCADE, related_name="invoice",
    )
    # Totals — auto-calculated from ScrapItems
    customer_total = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Sum of (weight_kg * customer_rate) for all items",
    )
    partner_total = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Sum of (weight_kg * partner_rate) for all items",
    )
    commission = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="partner_total - customer_total = platform commission",
    )
    # Approval
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="PENDING_APPROVAL",
    )
    admin_notes = models.TextField(blank=True, null=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="approved_invoices",
    )
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Invoice for {self.order.order_id} — ₹{self.commission} commission [{self.status}]"

    def recalculate(self) -> None:
        """Recalculate totals from order's scrap items."""
        from django.db.models import Sum

        items = self.order.scrap_items.all()
        agg = items.aggregate(
            customer_total=Sum("customer_amount"),
            partner_total=Sum("partner_amount"),
        )
        self.customer_total = agg["customer_total"] or 0
        self.partner_total = agg["partner_total"] or 0
        self.commission = self.partner_total - self.customer_total
        self.save(update_fields=["customer_total", "partner_total", "commission"])

    @classmethod
    def create_for_order(cls, order) -> "Invoice":
        """
        Auto-generate invoice from order's scrap items.
        Called after partner submits scrap weights.
        """
        from django.db.models import Sum

        items = order.scrap_items.all()
        agg = items.aggregate(
            customer_total=Sum("customer_amount"),
            partner_total=Sum("partner_amount"),
        )

        customer_total = agg["customer_total"] or 0
        partner_total = agg["partner_total"] or 0

        return cls.objects.create(
            order=order,
            customer_total=customer_total,
            partner_total=partner_total,
            commission=partner_total - customer_total,
        )
