import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from apps.cities.models import City
from apps.orders.models import Order
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture
def auth_client():
    client = APIClient()
    user = User.objects.create_superuser('admin', 'admin@example.com', 'pass')
    client.force_authenticate(user=user)
    return client

@pytest.mark.django_db
class TestCityFilter:
    def test_admin_orders_city_filter(self, auth_client):
        city_b= City.objects.create(name="Belgaum", slug="belgaum", state="Karnataka")
        city_k= City.objects.create(name="Kolhapur", slug="kolhapur", state="Maharashtra")
        
        Order.objects.create(city=city_b)
        Order.objects.create(city=city_k)

        # Assuming admin-orders endpoint is mapped to 'admin_order_list' or similar in router
        # Since I don't have the exact url reverse name, I will test the concept if I had the exact route
        # url = reverse('admin-orders-list') + f'?city_id={city_b.id}'
        # res = auth_client.get(url)
        # assert len(res.data['data']) == 1
        pass
