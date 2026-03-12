from django.urls import path

from . import auth_views, views

urlpatterns = [
    # ── Auth Endpoints (Public) ──────────────────────
    path("send-otp/", auth_views.SendOTPView.as_view(), name="send-otp"),
    path("verify-otp/", auth_views.VerifyOTPView.as_view(), name="verify-otp"),
    path("refresh/", auth_views.RefreshTokenView.as_view(), name="refresh-token"),
    path("register/customer/", auth_views.RegisterCustomerView.as_view(), name="register-customer"),
    path("register/partner/", auth_views.RegisterPartnerView.as_view(), name="register-partner"),
    path("push-token/", auth_views.UpdatePushTokenView.as_view(), name="update-push-token"),

    # ── Customer Endpoints ───────────────────────────
    path("customer/profile/", views.CustomerProfileView.as_view(), name="customer-profile"),

    # ── Partner Endpoints ────────────────────────────
    path("partner/profile/", views.PartnerProfileView.as_view(), name="partner-profile"),
    path("partner/toggle-online/", views.PartnerToggleOnlineView.as_view(), name="partner-toggle-online"),

    # ── Admin Customer Endpoints ─────────────────────
    path("admin/customers/", views.AdminCustomerListView.as_view(), name="admin-customer-list"),
    path("admin/customers/create/", views.AdminCustomerCreateView.as_view(), name="admin-customer-create"),
    path("admin/customers/<int:pk>/", views.AdminCustomerDetailView.as_view(), name="admin-customer-detail"),
    path("admin/customers/<int:pk>/message/", views.AdminCustomerMessageView.as_view(), name="admin-customer-message"),

    # ── Admin Partner Endpoints ──────────────────────
    path("admin/partners/", views.AdminPartnerListView.as_view(), name="admin-partner-list"),
    path("admin/partners/<int:pk>/", views.AdminPartnerDetailView.as_view(), name="admin-partner-detail"),
    path("admin/partners/<int:pk>/approve/", views.AdminPartnerApproveView.as_view(), name="admin-partner-approve"),
    path("admin/partners/<int:pk>/reject/", views.AdminPartnerRejectView.as_view(), name="admin-partner-reject"),
    path("admin/partners/<int:pk>/disable/", views.AdminPartnerDisableView.as_view(), name="admin-partner-disable"),
    path("admin/partners/<int:pk>/enable/", views.AdminPartnerEnableView.as_view(), name="admin-partner-enable"),
]
