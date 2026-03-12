from django.contrib import admin

from .models import City


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "state", "is_active", "created_at")
    list_filter = ("is_active", "state")
    search_fields = ("name", "slug", "state")
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("is_active",)
