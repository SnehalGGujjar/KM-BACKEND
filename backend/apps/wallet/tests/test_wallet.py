import pytest
from decimal import Decimal
from apps.wallet.models import PartnerWallet
from apps.accounts.models import PartnerProfile
from apps.cities.models import City
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestWalletAtomicity:
    def test_deduction_and_transaction_log(self):
        user = User.objects.create(username="partner")
        city = City.objects.create(name="Belgaum", slug="belgaum", state="Karnataka")
        profile = PartnerProfile.objects.create(user=user, phone="999", city=city)
        wallet = PartnerWallet.objects.create(partner=profile, balance=Decimal("1000.00"))
        
        wallet.deduct(Decimal("50.00"), None, "Test deduction")
        
        wallet.refresh_from_db()
        assert wallet.balance == Decimal("950.00")
        assert wallet.transactions.count() == 1
        tx = wallet.transactions.first()
        assert tx.type == "COMMISSION_DEDUCTION"
        assert tx.amount == Decimal("50.00")
        assert tx.balance_before == Decimal("1000.00")
        assert tx.balance_after == Decimal("950.00")

    def test_insufficient_balance(self):
        user = User.objects.create(username="partner2")
        city = City.objects.create(name="Belgaum2", slug="b2", state="Karnataka")
        profile = PartnerProfile.objects.create(user=user, phone="888", city=city)
        wallet = PartnerWallet.objects.create(partner=profile, balance=Decimal("10.00"))
        
        with pytest.raises(ValueError):
            wallet.deduct(Decimal("50.00"), None, "Test deduction")
