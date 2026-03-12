"""
Notifications app — Models.
In-app notification system with Expo push support.
"""

from django.db import models


class NotificationTemplate(models.Model):
    """
    Predefined notification templates.
    Variables in templates use {variable_name} syntax.
    """

    name = models.CharField(max_length=100, unique=True, help_text="e.g. 'order_assigned'")
    title_template = models.CharField(max_length=200, help_text="e.g. 'Partner Assigned!'")
    body_template = models.TextField(help_text="e.g. '{partner_name} has been assigned to your order {order_id}'")
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.name

    def render(self, **kwargs) -> dict:
        """Render template with variables."""
        return {
            "title": self.title_template.format(**kwargs),
            "body": self.body_template.format(**kwargs),
        }


class Notification(models.Model):
    """
    In-app notification record.
    Persisted for notification history screen.
    """

    RECIPIENT_TYPE_CHOICES = [
        ("CUSTOMER", "Customer"),
        ("PARTNER", "Partner"),
        ("ADMIN", "Admin"),
    ]

    TYPE_CHOICES = [
        ("ORDER_UPDATE", "Order Update"),
        ("INVOICE", "Invoice"),
        ("WALLET", "Wallet"),
        ("SYSTEM", "System"),
        ("BROADCAST", "Broadcast"),
    ]

    recipient_type = models.CharField(max_length=10, choices=RECIPIENT_TYPE_CHOICES)
    recipient_id = models.IntegerField(help_text="Customer or Partner profile ID")
    title = models.CharField(max_length=200)
    body = models.TextField()
    type = models.CharField(max_length=15, choices=TYPE_CHOICES, default="ORDER_UPDATE")
    reference_id = models.CharField(
        max_length=50, blank=True, null=True,
        help_text="e.g. order_id for deep-linking",
    )
    is_read = models.BooleanField(default=False)
    city_id = models.IntegerField(null=True, blank=True, help_text="For city-scoped broadcast filtering")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient_type", "recipient_id", "is_read"]),
        ]

    def __str__(self) -> str:
        return f"[{self.type}] {self.title} → {self.recipient_type}:{self.recipient_id}"
