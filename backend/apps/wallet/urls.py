from django.urls import path

from . import views

urlpatterns = [
    # ── Partner ──────────────────────────────────────
    path("partner/wallet/", views.PartnerWalletView.as_view(), name="partner-wallet"),
    path("partner/wallet/transactions/", views.PartnerWalletTransactionsView.as_view(), name="partner-wallet-transactions"),

    # ── Admin ────────────────────────────────────────
    path("admin/wallets/", views.AdminWalletListView.as_view(), name="admin-wallet-list"),
    path("admin/wallets/<int:partner_id>/", views.AdminWalletDetailView.as_view(), name="admin-wallet-detail"),
    path("admin/wallets/<int:partner_id>/top-up/", views.AdminWalletTopUpView.as_view(), name="admin-wallet-topup"),
    path("admin/wallets/<int:partner_id>/adjust/", views.AdminWalletAdjustView.as_view(), name="admin-wallet-adjust"),
]
