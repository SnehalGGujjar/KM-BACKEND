"""
Accounts app — Models.
Manages OTP authentication, customer profiles, and partner profiles.
"""

from django.conf import settings
from django.db import models


class OTPRecord(models.Model):
    """
    Stores OTP records for phone-based authentication.
    OTP is stored as a bcrypt hash — never store plaintext.
    Rate limit: max 3 OTPRecords per phone per hour (enforced in view).
    """

    PURPOSE_CHOICES = [
        ("LOGIN", "Login"),
        ("ARRIVAL_VERIFY", "Arrival Verification"),
    ]

    phone_number = models.CharField(max_length=15, db_index=True)
    otp_hash = models.CharField(max_length=128, help_text="bcrypt hash of the OTP")
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    attempts = models.IntegerField(default=0, help_text="Max 3 attempts before lockout")
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField(help_text="created_at + 5 minutes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["phone_number", "purpose", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"OTP for {self.phone_number} ({self.purpose}) @ {self.created_at}"

    @property
    def is_expired(self) -> bool:
        """Check if OTP has expired."""
        from django.utils import timezone

        return timezone.now() > self.expires_at

    @property
    def is_locked(self) -> bool:
        """Check if OTP is locked due to too many attempts."""
        return self.attempts >= 3


class CustomerProfile(models.Model):
    """
    Profile for household customers who sell scrap.
    City-scoped — a customer belongs to one city.
    """

    CUSTOMER_TYPE_CHOICES = [
        ("B2C", "Individual (B2C)"),
        ("B2B", "Business (B2B)"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_profile",
    )
    phone = models.CharField(max_length=15, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    address = models.TextField()
    city = models.ForeignKey(
        "cities.City",
        on_delete=models.PROTECT,
        related_name="customers",
    )
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    email = models.EmailField(blank=True, null=True)
    customer_type = models.CharField(
        max_length=5,
        choices=CUSTOMER_TYPE_CHOICES,
        default="B2C",
    )
    expo_push_token = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.phone}) — {self.city.name}"


class PartnerProfile(models.Model):
    """
    Profile for local kabadiwala scrap collectors.
    City-scoped — a partner only receives orders from their city.
    Must be approved by admin before going online.
    """

    APPROVAL_STATUS_CHOICES = [
        ("PENDING", "Pending Review"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("DISABLED", "Disabled"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="partner_profile",
    )
    phone = models.CharField(max_length=15, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    city = models.ForeignKey(
        "cities.City",
        on_delete=models.PROTECT,
        related_name="partners",
    )
    # Document uploads — Cloudinary secure URLs
    aadhaar_doc_url = models.CharField(
        max_length=500,
        blank=True,
        help_text="Cloudinary URL for Aadhaar document",
    )
    vehicle_doc_url = models.CharField(
        max_length=500,
        blank=True,
        help_text="Cloudinary URL for vehicle registration",
    )
    license_doc_url = models.CharField(
        max_length=500,
        blank=True,
        help_text="Cloudinary URL for driving license",
    )
    # Godown (warehouse) details — optional
    godown_address = models.TextField(blank=True, null=True)
    godown_latitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True
    )
    godown_longitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True
    )
    # Status
    approval_status = models.CharField(
        max_length=10,
        choices=APPROVAL_STATUS_CHOICES,
        default="PENDING",
    )
    rejection_reason = models.TextField(blank=True, null=True)
    is_online = models.BooleanField(default=False)
    # Rating
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    total_ratings = models.IntegerField(default=0)
    # Push notifications
    expo_push_token = models.CharField(max_length=255, blank=True, null=True)
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.phone}) — {self.city.name} [{self.approval_status}]"

    def update_rating(self, new_rating: int) -> None:
        """
        Update the partner's rolling average rating.
        Called when a new OrderRating is created.
        """
        total = self.rating * self.total_ratings + new_rating
        self.total_ratings += 1
        self.rating = round(total / self.total_ratings, 2)
        self.save(update_fields=["rating", "total_ratings", "updated_at"])
