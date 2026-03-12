from django.urls import path

from . import views

urlpatterns = [
    # ── Customer ─────────────────────────────────────
    path("pricing/rates/", views.CustomerRatesView.as_view(), name="customer-rates"),

    # ── Partner ──────────────────────────────────────
    path("partner/pricing/rates/", views.PartnerRatesView.as_view(), name="partner-rates"),
    path("partner/pricing/request-change/", views.PartnerRateRequestCreateView.as_view(), name="partner-rate-request"),
    path("partner/pricing/my-requests/", views.PartnerMyRateRequestsView.as_view(), name="partner-my-rate-requests"),

    # ── Admin ────────────────────────────────────────
    path("admin/pricing/", views.AdminPricingView.as_view(), name="admin-pricing"),
    path("admin/pricing/customer/<int:city_id>/<int:category_id>/", views.AdminUpdateCustomerRateView.as_view(), name="admin-update-customer-rate"),
    path("admin/pricing/partner-default/<int:city_id>/<int:category_id>/", views.AdminUpdatePartnerDefaultRateView.as_view(), name="admin-update-partner-default-rate"),
    path("admin/pricing/partner-custom/<int:partner_id>/<int:category_id>/", views.AdminUpdatePartnerCustomRateView.as_view(), name="admin-update-partner-custom-rate"),
    path("admin/pricing/rate-requests/", views.AdminRateRequestListView.as_view(), name="admin-rate-requests"),
    path("admin/pricing/rate-requests/<int:pk>/approve/", views.AdminRateRequestApproveView.as_view(), name="admin-rate-request-approve"),
    path("admin/pricing/rate-requests/<int:pk>/reject/", views.AdminRateRequestRejectView.as_view(), name="admin-rate-request-reject"),
]
