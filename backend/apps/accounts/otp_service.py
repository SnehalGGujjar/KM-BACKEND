"""
OTP Service — Abstract provider interface.
Build once, swap anytime via OTP_PROVIDER env var.

Supported providers:
  - console  → prints OTP to Django terminal (local dev, zero SMS cost)
  - msg91    → sends via MSG91 API
  - fast2sms → sends via Fast2SMS API
  - twilio   → sends via Twilio API
"""

import logging
from abc import ABC, abstractmethod

from django.conf import settings

logger = logging.getLogger(__name__)


class BaseOTPService(ABC):
    """Abstract base class for OTP delivery providers."""

    @abstractmethod
    def send(self, phone: str, otp: str) -> bool:
        """
        Send OTP to the given phone number.
        Returns True if sent successfully, False otherwise.
        """
        raise NotImplementedError


class ConsoleOTPService(BaseOTPService):
    """Prints OTP to Django terminal. Use in local development."""

    def send(self, phone: str, otp: str) -> bool:
        print(f"\n{'='*50}")
        print(f"  [DEV OTP] Phone: {phone}")
        print(f"  [DEV OTP] Code:  {otp}")
        print(f"{'='*50}\n")
        logger.info(f"[DEV OTP] Sent OTP to {phone}: {otp}")
        return True


class MSG91OTPService(BaseOTPService):
    """Send OTP via MSG91 API."""

    def send(self, phone: str, otp: str) -> bool:
        import requests

        try:
            url = "https://api.msg91.com/api/v5/otp"
            headers = {
                "authkey": settings.OTP_API_KEY,
                "Content-Type": "application/json",
            }
            payload = {
                "template_id": settings.OTP_TEMPLATE_ID,
                "mobile": f"91{phone}",
                "otp": otp,
            }
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"MSG91 OTP send failed for {phone}: {e}")
            return False


class Fast2SMSOTPService(BaseOTPService):
    """Send OTP via Fast2SMS API."""

    def send(self, phone: str, otp: str) -> bool:
        import requests

        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {"authorization": settings.OTP_API_KEY}
            payload = {
                "variables_values": otp,
                "route": "otp",
                "numbers": phone,
            }
            response = requests.post(url, data=payload, headers=headers, timeout=10)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Fast2SMS OTP send failed for {phone}: {e}")
            return False


class TwilioOTPService(BaseOTPService):
    """Send OTP via Twilio API."""

    def send(self, phone: str, otp: str) -> bool:
        import requests

        try:
            account_sid = settings.OTP_API_KEY
            auth_token = settings.OTP_SENDER_ID
            from_number = settings.OTP_TEMPLATE_ID

            url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
            payload = {
                "To": f"+91{phone}",
                "From": from_number,
                "Body": f"Your Kabadi Man verification code is: {otp}. Valid for 5 minutes.",
            }
            response = requests.post(
                url,
                data=payload,
                auth=(account_sid, auth_token),
                timeout=10,
            )
            return response.status_code in (200, 201)
        except Exception as e:
            logger.error(f"Twilio OTP send failed for {phone}: {e}")
            return False


# ── Provider Factory ─────────────────────────────────

_PROVIDERS = {
    "console": ConsoleOTPService,
    "msg91": MSG91OTPService,
    "fast2sms": Fast2SMSOTPService,
    "twilio": TwilioOTPService,
}


def get_otp_service() -> BaseOTPService:
    """
    Get the configured OTP service based on OTP_PROVIDER env var.
    Defaults to ConsoleOTPService for local development.
    """
    provider_name = getattr(settings, "OTP_PROVIDER", "console").lower()
    provider_class = _PROVIDERS.get(provider_name)

    if provider_class is None:
        logger.warning(
            f"Unknown OTP_PROVIDER '{provider_name}', falling back to console"
        )
        provider_class = ConsoleOTPService

    return provider_class()
