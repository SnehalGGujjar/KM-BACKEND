from django.urls import path

from . import views

urlpatterns = [
    # Public
    path("cities/", views.CityListView.as_view(), name="city-list"),
    # Admin
    path("admin/cities/", views.AdminCityListCreateView.as_view(), name="admin-city-list-create"),
    path("admin/cities/<int:pk>/", views.AdminCityUpdateView.as_view(), name="admin-city-update"),
]
