from django.urls import path

from . import views

urlpatterns = [
    # ── Customer Endpoints ───────────────────────────
    path("orders/create/", views.CustomerCreateOrderView.as_view(), name="customer-create-order"),
    path("orders/current/", views.CustomerCurrentOrderView.as_view(), name="customer-current-order"),
    path("orders/history/", views.CustomerOrderHistoryView.as_view(), name="customer-order-history"),
    path("orders/<str:order_id>/", views.CustomerOrderDetailView.as_view(), name="customer-order-detail"),
    path("orders/<str:order_id>/cancel/", views.CustomerCancelOrderView.as_view(), name="customer-cancel-order"),
    path("orders/<str:order_id>/rate/", views.CustomerRateOrderView.as_view(), name="customer-rate-order"),

    # ── Partner Endpoints ────────────────────────────
    path("partner/orders/", views.PartnerAssignedOrdersView.as_view(), name="partner-orders"),
    path("partner/orders/history/", views.PartnerOrderHistoryView.as_view(), name="partner-order-history"),
    path("partner/orders/<str:order_id>/", views.PartnerOrderDetailView.as_view(), name="partner-order-detail"),
    path("partner/orders/<str:order_id>/status/", views.PartnerUpdateStatusView.as_view(), name="partner-update-status"),
    path("partner/orders/<str:order_id>/verify-otp/", views.PartnerVerifyArrivalOTPView.as_view(), name="partner-verify-otp"),
    path("partner/orders/<str:order_id>/submit-scrap/", views.PartnerSubmitScrapView.as_view(), name="partner-submit-scrap"),

    # ── Admin Endpoints ──────────────────────────────
    path("admin/dashboard/", views.AdminDashboardStatsView.as_view(), name="admin-dashboard"),
    path("admin/orders/", views.AdminOrderListView.as_view(), name="admin-order-list"),
    path("admin/orders/create/", views.AdminCreateOrderView.as_view(), name="admin-create-order"),
    path("admin/orders/<str:order_id>/", views.AdminOrderDetailView.as_view(), name="admin-order-detail"),
    path("admin/orders/<str:order_id>/assign/", views.AdminAssignPartnerView.as_view(), name="admin-assign-partner"),
    path("admin/orders/<str:order_id>/reassign/", views.AdminReassignPartnerView.as_view(), name="admin-reassign-partner"),
    path("admin/orders/<str:order_id>/cancel/", views.AdminCancelOrderView.as_view(), name="admin-cancel-order"),
    path("admin/orders/<str:order_id>/complete/", views.AdminCompleteOrderView.as_view(), name="admin-complete-order"),
]
