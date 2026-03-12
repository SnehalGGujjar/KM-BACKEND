"""
Management command to seed initial cities.
Usage: python manage.py seed_cities
"""

from django.core.management.base import BaseCommand

from apps.cities.models import City

INITIAL_CITIES = [
    {"name": "Belgaum", "slug": "belgaum", "state": "Karnataka"},
    {"name": "Kolhapur", "slug": "kolhapur", "state": "Maharashtra"},
    {"name": "Hubli", "slug": "hubli", "state": "Karnataka"},
    {"name": "Dharwad", "slug": "dharwad", "state": "Karnataka"},
    {"name": "Nippani", "slug": "nippani", "state": "Karnataka"},
]


class Command(BaseCommand):
    help = "Seed initial cities into the database"

    def handle(self, *args, **options):
        created_count = 0
        for city_data in INITIAL_CITIES:
            city, created = City.objects.get_or_create(
                slug=city_data["slug"],
                defaults={
                    "name": city_data["name"],
                    "state": city_data["state"],
                    "is_active": True,
                },
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  Created: {city.name}, {city.state}"))
            else:
                self.stdout.write(f"  Exists: {city.name}, {city.state}")

        self.stdout.write(self.style.SUCCESS(f"\nDone! {created_count} new cities created."))
