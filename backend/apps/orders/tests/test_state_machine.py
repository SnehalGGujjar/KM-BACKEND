import pytest
from decimal import Decimal
from apps.orders.models import Order, InvalidTransitionError
from apps.pricing.models import ScrapCategory
from apps.cities.models import City

@pytest.mark.django_db
class TestOrderStateMachine:
    def test_valid_transitions(self):
        city = City.objects.create(name="Belgaum", slug="belgaum", state="Karnataka")
        order = Order.objects.create(city=city)
        assert order.status == 'NEW'
        
        # Valid: NEW -> ASSIGNED
        order.transition_to('ASSIGNED')
        assert order.status == 'ASSIGNED'
        
        # Valid: ASSIGNED -> ACCEPTED
        order.transition_to('ACCEPTED')
        assert order.status == 'ACCEPTED'

    def test_invalid_transitions(self):
        city = City.objects.create(name="Belgaum", slug="belgaum", state="Karnataka")
        order = Order.objects.create(city=city)
        assert order.status == 'NEW'
        
        # Invalid: NEW -> ON_THE_WAY
        with pytest.raises(InvalidTransitionError):
            order.transition_to('ON_THE_WAY')
