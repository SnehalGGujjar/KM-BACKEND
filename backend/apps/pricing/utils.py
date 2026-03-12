"""
Pricing app — Rate resolution utility.
Determines the effective partner rate for a given partner + category.
"""

from decimal import Decimal
from typing import Optional

from apps.accounts.models import PartnerProfile

from .models import PartnerCustomRate, PartnerDefaultRate, ScrapCategory


def resolve_partner_rate(partner: PartnerProfile, category: ScrapCategory) -> Optional[Decimal]:
    """
    Resolve the effective partner rate for a given partner and scrap category.
    Resolution order:
      1. PartnerCustomRate for this partner + category
      2. PartnerDefaultRate for partner's city + category
      3. None if no rate is configured
    """
    # Step 1: Check for custom rate
    try:
        custom_rate = PartnerCustomRate.objects.get(
            partner=partner, category=category
        )
        return custom_rate.price_per_kg
    except PartnerCustomRate.DoesNotExist:
        pass

    # Step 2: Fall back to city default rate
    try:
        default_rate = PartnerDefaultRate.objects.get(
            city=partner.city, category=category
        )
        return default_rate.price_per_kg
    except PartnerDefaultRate.DoesNotExist:
        pass

    return None


def get_customer_rate(city_id: int, category: ScrapCategory) -> Optional[Decimal]:
    """Get customer rate for a category in a specific city."""
    from .models import CustomerRate

    try:
        rate = CustomerRate.objects.get(city_id=city_id, category=category)
        return rate.price_per_kg
    except CustomerRate.DoesNotExist:
        return None
