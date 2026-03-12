from rest_framework import generics, permissions

from .models import City
from .serializers import CitySerializer


class CityListView(generics.ListAPIView):
    """List all active cities. Public endpoint for app dropdowns."""

    serializer_class = CitySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return City.objects.filter(is_active=True)


class AdminCityListCreateView(generics.ListCreateAPIView):
    """Admin: list all cities (including inactive) and create new ones."""

    serializer_class = CitySerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = City.objects.all()


class AdminCityUpdateView(generics.UpdateAPIView):
    """Admin: update city (enable/disable)."""

    serializer_class = CitySerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = City.objects.all()
