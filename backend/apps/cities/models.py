"""
Cities app — Models.
City is a first-class data field used across the entire platform.
"""

from django.db import models


class City(models.Model):
    """
    Represents a city where Kabadi Man operates.
    All orders, profiles, and pricing are scoped to a city.
    """

    name = models.CharField(max_length=100, help_text="City display name, e.g. 'Belgaum'")
    slug = models.SlugField(max_length=100, unique=True, help_text="URL-safe identifier, e.g. 'belgaum'")
    state = models.CharField(max_length=100, help_text="State name, e.g. 'Karnataka'")
    is_active = models.BooleanField(default=True, help_text="Admin can disable a city to hide it from dropdowns")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Cities"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name}, {self.state}"
