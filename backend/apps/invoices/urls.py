from django.urls import path

from . import views

urlpatterns = [
    path("admin/invoices/", views.AdminInvoiceListView.as_view(), name="admin-invoice-list"),
    path("admin/invoices/<int:pk>/", views.AdminInvoiceDetailView.as_view(), name="admin-invoice-detail"),
    path("admin/invoices/<int:pk>/edit/", views.AdminInvoiceEditView.as_view(), name="admin-invoice-edit"),
    path("admin/invoices/<int:pk>/approve/", views.AdminInvoiceApproveView.as_view(), name="admin-invoice-approve"),
]
