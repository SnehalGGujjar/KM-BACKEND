"""
Notifications app — Expo Push Notification Service + Celery task.
Sends push notifications via Expo Push API and persists records.
"""

import logging

import requests
from celery import shared_task

from apps.accounts.models import CustomerProfile, PartnerProfile

from .models import Notification

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _send_expo_push(push_token: str, title: str, body: str, data: dict = None) -> bool:
    """
    Send a single push notification via Expo Push API.
    Returns True if accepted by Expo servers.
    """
    if not push_token or not push_token.startswith("ExponentPushToken"):
        logger.warning(f"Invalid push token: {push_token}")
        return False

    payload = {
        "to": push_token,
        "title": title,
        "body": body,
        "sound": "default",
        "data": data or {},
    }

    try:
        response = requests.post(
            EXPO_PUSH_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        return response.status_code == 200
    except Exception as e:
        logger.error(f"Expo push failed: {e}")
        return False


@shared_task
def send_notification_task(
    recipient_type: str,
    recipient_id: int,
    title: str,
    body: str,
    notification_type: str = "ORDER_UPDATE",
    reference_id: str = None,
    city_id: int = None,
):
    """
    Celery task: persist notification + send Expo push.
    Called from order lifecycle signal handlers.
    """
    # 1. Persist notification
    Notification.objects.create(
        recipient_type=recipient_type,
        recipient_id=recipient_id,
        title=title,
        body=body,
        type=notification_type,
        reference_id=reference_id,
        city_id=city_id,
    )

    # 2. Get push token
    push_token = None
    try:
        if recipient_type == "CUSTOMER":
            profile = CustomerProfile.objects.get(pk=recipient_id)
            push_token = profile.expo_push_token
        elif recipient_type == "PARTNER":
            profile = PartnerProfile.objects.get(pk=recipient_id)
            push_token = profile.expo_push_token
    except Exception:
        pass

    # 3. Send Expo push
    if push_token:
        _send_expo_push(
            push_token,
            title,
            body,
            data={"type": notification_type, "reference_id": reference_id},
        )


@shared_task
def send_broadcast_task(
    recipient_type: str,
    title: str,
    body: str,
    city_id: int = None,
):
    """
    Celery task: broadcast notification to all users of a type.
    Optionally scoped to a specific city.
    """
    if recipient_type == "CUSTOMER":
        profiles = CustomerProfile.objects.filter(is_active=True)
        if city_id:
            profiles = profiles.filter(city_id=city_id)
    elif recipient_type == "PARTNER":
        profiles = PartnerProfile.objects.filter(approval_status="APPROVED")
        if city_id:
            profiles = profiles.filter(city_id=city_id)
    else:
        return

    for profile in profiles:
        # Persist
        Notification.objects.create(
            recipient_type=recipient_type,
            recipient_id=profile.id,
            title=title,
            body=body,
            type="BROADCAST",
            city_id=city_id,
        )
        # Push
        if profile.expo_push_token:
            _send_expo_push(profile.expo_push_token, title, body)


# ── Convenience functions for order lifecycle notifications ──────────


def notify_customer_order_assigned(order):
    """Notification #1: Customer gets notified when partner is assigned."""
    send_notification_task.delay(
        "CUSTOMER", order.customer.id,
        "Partner Assigned! 🎉",
        f"{order.partner.name} has been assigned to your order {order.order_id}",
        "ORDER_UPDATE", order.order_id, order.city_id,
    )


def notify_partner_new_assignment(order):
    """Notification #2: Partner gets notified of new assignment."""
    send_notification_task.delay(
        "PARTNER", order.partner.id,
        "New Order Assigned 📦",
        f"You have a new pickup: {order.order_id} on {order.pickup_date}, {order.pickup_slot}",
        "ORDER_UPDATE", order.order_id, order.city_id,
    )


def notify_customer_partner_on_way(order):
    """Notification #3: Customer notified partner is on the way."""
    send_notification_task.delay(
        "CUSTOMER", order.customer.id,
        "Partner On The Way 🚗",
        f"{order.partner.name} is on the way! Your OTP: {order.arrival_otp}",
        "ORDER_UPDATE", order.order_id, order.city_id,
    )


def notify_customer_partner_arrived(order):
    """Notification #4: Customer notified partner has arrived."""
    send_notification_task.delay(
        "CUSTOMER", order.customer.id,
        "Partner Arrived 📍",
        f"{order.partner.name} has arrived. Please share your OTP: {order.arrival_otp}",
        "ORDER_UPDATE", order.order_id, order.city_id,
    )


def notify_customer_scrap_collected(order):
    """Notification #5: Customer notified scrap has been collected."""
    send_notification_task.delay(
        "CUSTOMER", order.customer.id,
        "Scrap Collected ✅",
        f"Your scrap has been collected. Invoice is being processed for order {order.order_id}",
        "ORDER_UPDATE", order.order_id, order.city_id,
    )


def notify_partner_invoice_approved(order, invoice):
    """Notification #6: Partner notified invoice has been approved."""
    send_notification_task.delay(
        "PARTNER", order.partner.id,
        "Invoice Approved 📄",
        f"Invoice for {order.order_id} approved. Commission ₹{invoice.commission} deducted from wallet.",
        "INVOICE", order.order_id, order.city_id,
    )


def notify_customer_invoice_ready(order, invoice):
    """Notification #7: Customer notified payment amount is ready."""
    send_notification_task.delay(
        "CUSTOMER", order.customer.id,
        "Payment Ready 💰",
        f"You will receive ₹{invoice.customer_total} for order {order.order_id}",
        "INVOICE", order.order_id, order.city_id,
    )


def notify_customer_payment_done(order):
    """Notification #8: Customer notified payment is complete."""
    send_notification_task.delay(
        "CUSTOMER", order.customer.id,
        "Pickup Complete! 🎊",
        f"Order {order.order_id} is complete. Rate your experience!",
        "ORDER_UPDATE", order.order_id, order.city_id,
    )


def notify_customer_order_cancelled(order):
    """Notification #9: Customer notified order is cancelled."""
    send_notification_task.delay(
        "CUSTOMER", order.customer.id,
        "Order Cancelled ❌",
        f"Order {order.order_id} has been cancelled. Reason: {order.cancellation_reason or 'N/A'}",
        "ORDER_UPDATE", order.order_id, order.city_id,
    )


def notify_partner_order_cancelled(order):
    """Notification #10: Partner notified order is cancelled."""
    if order.partner:
        send_notification_task.delay(
            "PARTNER", order.partner.id,
            "Order Cancelled ❌",
            f"Order {order.order_id} has been cancelled.",
            "ORDER_UPDATE", order.order_id, order.city_id,
        )


def notify_partner_wallet_low(partner, balance):
    """Notification #11: Partner wallet low balance warning."""
    send_notification_task.delay(
        "PARTNER", partner.id,
        "Low Wallet Balance ⚠️",
        f"Your wallet balance is ₹{balance}. Please top-up to continue receiving orders.",
        "WALLET", None, partner.city_id,
    )
