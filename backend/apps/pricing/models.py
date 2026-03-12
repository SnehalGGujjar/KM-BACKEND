"""
Pricing app — Models.
City-scoped pricing for scrap categories.
Supports customer rates, partner default rates, partner custom rates,
and partner-initiated rate change requests.
"""

from django.conf import settings
from django.db import models


class ScrapCategory(models.Model):
    """Scrap category — Paper, Plastic, Metal, E-Waste, Other."""

    name = models.CharField(max_length=100, help_text="e.g. Paper, Plastic, Metal")
    slug = models.SlugField(max_length=100, unique=True, help_text="e.g. paper, plastic, metal")
    icon_url = models.CharField(max_length=500, blank=True, help_text="Cloudinary URL for category icon")
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Scrap Categories"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class CustomerRate(models.Model):
    """
    Rate paid TO the customer for their scrap per kg.
    City-scoped — different cities can have different rates.
    """

    category = models.ForeignKey(ScrapCategory, on_delete=models.CASCADE, related_name="customer_rates")
    city = models.ForeignKey("cities.City", on_delete=models.CASCADE, related_name="customer_rates")
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("category", "city")
        ordering = ["city", "category"]

    def __str__(self) -> str:
        return f"{self.category.name} @ ₹{self.price_per_kg}/kg — {self.city.name} (Customer)"


class PartnerDefaultRate(models.Model):
    """
    Default rate that the partner pays to the platform per kg.
    City-scoped — applies to all partners in a city unless overridden.
    Commission = PartnerDefaultRate - CustomerRate.
    """

    category = models.ForeignKey(ScrapCategory, on_delete=models.CASCADE, related_name="partner_default_rates")
    city = models.ForeignKey("cities.City", on_delete=models.CASCADE, related_name="partner_default_rates")
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("category", "city")
        ordering = ["city", "category"]

    def __str__(self) -> str:
        return f"{self.category.name} @ ₹{self.price_per_kg}/kg — {self.city.name} (Partner Default)"


class PartnerCustomRate(models.Model):
    """
    Custom rate override for a specific partner.
    Takes priority over PartnerDefaultRate when resolving partner rate.
    """

    partner = models.ForeignKey(
        "accounts.PartnerProfile", on_delete=models.CASCADE, related_name="custom_rates"
    )
    category = models.ForeignKey(ScrapCategory, on_delete=models.CASCADE, related_name="partner_custom_rates")
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("partner", "category")
        ordering = ["partner", "category"]

    def __str__(self) -> str:
        return f"{self.category.name} @ ₹{self.price_per_kg}/kg — {self.partner.name} (Custom)"


class PartnerRateRequest(models.Model):
    """
    Partner-initiated rate change request.
    Partner submits; admin approves or rejects.
    On approval, auto-creates/updates PartnerCustomRate.
    """

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    ]

    partner = models.ForeignKey(
        "accounts.PartnerProfile", on_delete=models.CASCADE, related_name="rate_requests"
    )
    category = models.ForeignKey(ScrapCategory, on_delete=models.CASCADE, related_name="rate_requests")
    requested_rate = models.DecimalField(max_digits=10, decimal_places=2)
    current_rate = models.DecimalField(max_digits=10, decimal_places=2, help_text="Snapshot at time of request")
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="PENDING")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    review_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.partner.name} — {self.category.name}: ₹{self.current_rate} → ₹{self.requested_rate} [{self.status}]"
