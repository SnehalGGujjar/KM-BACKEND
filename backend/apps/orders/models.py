"""
Orders app — Models.
Core order lifecycle with strict state machine enforcement.
"""

import random
import string
from datetime import datetime

from django.db import models
from django.utils import timezone


class InvalidTransitionError(Exception):
    """Raised when an illegal order status transition is attempted."""

    def __init__(self, current_status: str, target_status: str):
        self.current_status = current_status
        self.target_status = target_status
        super().__init__(
            f"Invalid transition: {current_status} → {target_status}"
        )


# Valid state transitions
VALID_TRANSITIONS = {
    "NEW": ["ASSIGNED", "CANCELLED"],
    "ASSIGNED": ["ON_THE_WAY", "NEW", "CANCELLED"],  # NEW = partner rejection
    "ON_THE_WAY": ["ARRIVED", "CANCELLED"],
    "ARRIVED": ["COLLECTING", "CANCELLED"],
    "COLLECTING": ["AWAITING_INVOICE"],
    "AWAITING_INVOICE": ["PAYMENT_PENDING"],
    "PAYMENT_PENDING": ["COMPLETED"],
    "COMPLETED": [],
    "CANCELLED": [],
}


def _generate_order_id(city_slug: str) -> str:
    """
    Generate a city-prefixed order ID with collision retry.
    Format: KM-{CITY_PREFIX}-{YEAR}-{RANDOM5}
    Example: KM-BEL-2024-48291
    """
    prefix = city_slug[:3].upper()
    year = datetime.now().year
    for _ in range(10):  # 10 retry attempts to avoid collision
        random_part = "".join(random.choices(string.digits, k=5))
        order_id = f"KM-{prefix}-{year}-{random_part}"
        if not Order.objects.filter(order_id=order_id).exists():
            return order_id
    # Fallback: use longer random to virtually eliminate collision
    random_part = "".join(random.choices(string.digits, k=8))
    return f"KM-{prefix}-{year}-{random_part}"


class Order(models.Model):
    """
    Core order model representing a scrap pickup request.
    Enforces strict state machine transitions via transition_to().
    """

    STATUS_CHOICES = [
        ("NEW", "New"),
        ("ASSIGNED", "Assigned"),
        ("ON_THE_WAY", "On The Way"),
        ("ARRIVED", "Arrived"),
        ("COLLECTING", "Collecting"),
        ("AWAITING_INVOICE", "Awaiting Invoice"),
        ("PAYMENT_PENDING", "Payment Pending"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    CANCELLED_BY_CHOICES = [
        ("CUSTOMER", "Customer"),
        ("ADMIN", "Admin"),
    ]

    order_id = models.CharField(
        max_length=30, unique=True, db_index=True,
        help_text="City-prefixed ID, e.g. KM-BEL-2024-48291",
    )
    customer = models.ForeignKey(
        "accounts.CustomerProfile", on_delete=models.CASCADE, related_name="orders",
    )
    partner = models.ForeignKey(
        "accounts.PartnerProfile", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="orders",
    )
    city = models.ForeignKey(
        "cities.City", on_delete=models.PROTECT, related_name="orders",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="NEW")
    pickup_date = models.DateField()
    pickup_slot = models.CharField(max_length=20, help_text="e.g. '10:00-11:00'")
    pickup_slot_start = models.DateTimeField(
        null=True, blank=True,
        help_text="Parsed datetime of slot start — for TAT#2",
    )
    scrap_photos = models.JSONField(default=list, blank=True, help_text="List of Cloudinary URLs")
    scrap_description = models.TextField(blank=True, null=True)
    # Arrival OTP
    arrival_otp = models.CharField(
        max_length=6, blank=True,
        help_text="6-digit code set when partner assigned",
    )
    arrival_otp_verified = models.BooleanField(default=False)
    # Cancellation
    rejection_reason = models.TextField(blank=True, null=True)
    cancelled_by = models.CharField(
        max_length=10, choices=CANCELLED_BY_CHOICES, blank=True, null=True,
    )
    cancellation_reason = models.TextField(blank=True, null=True)
    # ── TAT Timestamps ───────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)  # TAT1 start, TAT7 start
    assigned_at = models.DateTimeField(null=True, blank=True)  # TAT1 end
    on_the_way_at = models.DateTimeField(null=True, blank=True)  # TAT2 end
    arrived_at = models.DateTimeField(null=True, blank=True)  # TAT3 start
    otp_verified_at = models.DateTimeField(null=True, blank=True)  # TAT3 end, TAT4 start
    scrap_submitted_at = models.DateTimeField(null=True, blank=True)  # TAT4 end, TAT5 start
    invoice_approved_at = models.DateTimeField(null=True, blank=True)  # TAT5 end, TAT6 start
    payment_confirmed_at = models.DateTimeField(null=True, blank=True)  # TAT6 end
    completed_at = models.DateTimeField(null=True, blank=True)  # TAT7 end
    cancelled_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["city", "status"]),
            models.Index(fields=["partner", "status"]),
            models.Index(fields=["customer", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.order_id} [{self.status}]"

    def save(self, *args, **kwargs):
        """Auto-generate order_id on first save."""
        if not self.order_id:
            self.order_id = _generate_order_id(self.city.slug)
        super().save(*args, **kwargs)

    def transition_to(self, new_status: str, **kwargs) -> None:
        """
        Transition to a new status. Raises InvalidTransitionError
        for illegal jumps. Auto-sets corresponding timestamp fields.
        """
        valid_targets = VALID_TRANSITIONS.get(self.status, [])
        if new_status not in valid_targets:
            raise InvalidTransitionError(self.status, new_status)

        now = timezone.now()
        self.status = new_status

        # Set corresponding timestamp
        timestamp_map = {
            "ASSIGNED": "assigned_at",
            "ON_THE_WAY": "on_the_way_at",
            "ARRIVED": "arrived_at",
            "COLLECTING": "otp_verified_at",
            "AWAITING_INVOICE": "scrap_submitted_at",
            "PAYMENT_PENDING": "invoice_approved_at",
            "COMPLETED": "payment_confirmed_at",
            "CANCELLED": "cancelled_at",
        }

        ts_field = timestamp_map.get(new_status)
        if ts_field:
            setattr(self, ts_field, now)

        # Handle additional kwargs
        for key, value in kwargs.items():
            setattr(self, key, value)

        self.save()

        # Trigger notifications
        from apps.notifications.tasks import (
            notify_customer_order_assigned,
            notify_partner_new_assignment,
            notify_customer_partner_on_way,
            notify_customer_partner_arrived,
            notify_customer_scrap_collected,
            notify_customer_payment_done,
            notify_customer_order_cancelled,
            notify_partner_order_cancelled,
        )

        if new_status == "ASSIGNED":
            notify_customer_order_assigned(self)
            notify_partner_new_assignment(self)
        elif new_status == "ON_THE_WAY":
            notify_customer_partner_on_way(self)
        elif new_status == "ARRIVED":
            notify_customer_partner_arrived(self)
        elif new_status == "AWAITING_INVOICE":
            notify_customer_scrap_collected(self)
        elif new_status == "COMPLETED":
            notify_customer_payment_done(self)
        elif new_status == "CANCELLED":
            notify_customer_order_cancelled(self)
            notify_partner_order_cancelled(self)


class ScrapItem(models.Model):
    """
    Individual scrap item in an order.
    Rates are snapshotted at collection time — they never change retroactively.
    """

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="scrap_items")
    category = models.ForeignKey(
        "pricing.ScrapCategory", on_delete=models.PROTECT, related_name="scrap_items",
    )
    weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    customer_rate = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Snapshot of customer rate at collection time",
    )
    partner_rate = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Snapshot of partner rate at collection time",
    )
    customer_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="weight_kg * customer_rate",
    )
    partner_amount = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="weight_kg * partner_rate",
    )

    class Meta:
        ordering = ["id"]

    def __str__(self) -> str:
        return f"{self.category.name}: {self.weight_kg}kg @ ₹{self.customer_rate} (Order: {self.order.order_id})"

    def save(self, *args, **kwargs):
        """Auto-calculate amounts from weight and rates."""
        self.customer_amount = self.weight_kg * self.customer_rate
        self.partner_amount = self.weight_kg * self.partner_rate
        super().save(*args, **kwargs)


class OrderRating(models.Model):
    """
    Customer rating of a partner after order completion.
    Updates PartnerProfile.rating via rolling average.
    """

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="rating")
    customer = models.ForeignKey(
        "accounts.CustomerProfile", on_delete=models.CASCADE, related_name="ratings_given",
    )
    rating = models.IntegerField(help_text="1-5 stars")
    feedback = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Rating {self.rating}★ for {self.order.order_id}"

    def save(self, *args, **kwargs):
        """Update partner's rolling average rating on save."""
        super().save(*args, **kwargs)
        if self.order.partner:
            self.order.partner.update_rating(self.rating)
