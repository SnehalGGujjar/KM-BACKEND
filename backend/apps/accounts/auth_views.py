"""
Accounts app — Auth Views.
OTP-based authentication, registration, and push token management.
"""

import random
import string
from datetime import timedelta

import bcrypt
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.cities.models import City

from .models import CustomerProfile, OTPRecord, PartnerProfile
from .otp_service import get_otp_service
from .serializers import (
    CustomerProfileCreateSerializer,
    CustomerProfileSerializer,
    PartnerProfileSerializer,
    PartnerRegistrationSerializer,
)


def _generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP."""
    return "".join(random.choices(string.digits, k=length))


def _hash_otp(otp: str) -> str:
    """Hash OTP using bcrypt. Never store plaintext."""
    return bcrypt.hashpw(otp.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_otp_hash(otp: str, otp_hash: str) -> bool:
    """Verify OTP against its bcrypt hash."""
    return bcrypt.checkpw(otp.encode("utf-8"), otp_hash.encode("utf-8"))


class SendOTPView(APIView):
    """
    POST /api/v1/auth/send-otp/
    Send OTP to phone number for login or arrival verification.
    Rate limit: max 3 OTP sends per phone per hour.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        phone = request.data.get("phone", "").strip()
        purpose = request.data.get("purpose", "LOGIN").upper()

        if not phone:
            return Response(
                {"success": False, "data": None, "error": "Phone number is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if purpose not in ("LOGIN", "ARRIVAL_VERIFY"):
            return Response(
                {"success": False, "data": None, "error": "Invalid purpose. Use LOGIN or ARRIVAL_VERIFY"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Rate limit: max 3 OTPs per phone per hour
        one_hour_ago = timezone.now() - timedelta(hours=1)
        recent_count = OTPRecord.objects.filter(
            phone_number=phone,
            created_at__gte=one_hour_ago,
        ).count()

        if recent_count >= 3:
            return Response(
                {"success": False, "data": None, "error": "Too many OTP requests. Try again in an hour."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Generate and hash OTP
        otp = _generate_otp()
        otp_hash = _hash_otp(otp)

        # Create OTP record
        OTPRecord.objects.create(
            phone_number=phone,
            otp_hash=otp_hash,
            purpose=purpose,
            expires_at=timezone.now() + timedelta(seconds=300),  # 5 minutes
        )

        # Send OTP via configured provider
        service = get_otp_service()
        sent = service.send(phone, otp)

        if not sent:
            return Response(
                {"success": False, "data": None, "error": "Failed to send OTP. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({
            "success": True,
            "data": {"message": "OTP sent successfully", "expires_in_seconds": 300},
            "error": None,
        })


class VerifyOTPView(APIView):
    """
    POST /api/v1/auth/verify-otp/
    Verify OTP and return JWT tokens.
    Returns is_new_user flag so the app knows to show registration.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        phone = request.data.get("phone", "").strip()
        otp = request.data.get("otp", "").strip()
        purpose = request.data.get("purpose", "LOGIN").upper()

        if not phone or not otp:
            return Response(
                {"success": False, "data": None, "error": "Phone and OTP are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the latest unused OTP for this phone + purpose
        otp_record = (
            OTPRecord.objects.filter(
                phone_number=phone,
                purpose=purpose,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp_record:
            return Response(
                {"success": False, "data": None, "error": "No OTP found. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check expiry
        if otp_record.is_expired:
            return Response(
                {"success": False, "data": None, "error": "OTP has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check lockout
        if otp_record.is_locked:
            return Response(
                {"success": False, "data": None, "error": "Too many attempts. Please request a new OTP after 30 minutes."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Verify OTP
        from django.conf import settings
        is_dev_bypass = getattr(settings, "DEBUG", False) and otp == "123456"
        
        if not is_dev_bypass and not _verify_otp_hash(otp, otp_record.otp_hash):
            otp_record.attempts += 1
            otp_record.save(update_fields=["attempts"])
            remaining = 3 - otp_record.attempts
            return Response(
                {
                    "success": False,
                    "data": None,
                    "error": f"Invalid OTP. {remaining} attempt(s) remaining.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Mark OTP as used
        otp_record.is_used = True
        otp_record.save(update_fields=["is_used"])

        # For LOGIN purpose: get or create user
        if purpose == "LOGIN":
            is_new_user = False
            try:
                user = User.objects.get(username=phone)
            except User.DoesNotExist:
                # Create a new user — they'll need to register profile next
                user = User.objects.create_user(username=phone, password=None)
                is_new_user = True

            # Check if they have a profile
            has_customer_profile = CustomerProfile.objects.filter(user=user).exists()
            has_partner_profile = PartnerProfile.objects.filter(user=user).exists()

            if not has_customer_profile and not has_partner_profile:
                is_new_user = True

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                "success": True,
                "data": {
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                    "is_new_user": is_new_user,
                    "has_customer_profile": has_customer_profile,
                    "has_partner_profile": has_partner_profile,
                },
                "error": None,
            })

        # For ARRIVAL_VERIFY purpose: just return success
        return Response({
            "success": True,
            "data": {"verified": True},
            "error": None,
        })


class RefreshTokenView(APIView):
    """
    POST /api/v1/auth/refresh/
    Refresh access token using refresh token.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh_token", "")

        if not refresh_token:
            return Response(
                {"success": False, "data": None, "error": "Refresh token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(refresh_token)
            return Response({
                "success": True,
                "data": {
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                },
                "error": None,
            })
        except Exception:
            return Response(
                {"success": False, "data": None, "error": "Invalid or expired refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class RegisterCustomerView(APIView):
    """
    POST /api/v1/auth/register/customer/
    Complete customer profile after first OTP verification.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Check if profile already exists
        if CustomerProfile.objects.filter(user=request.user).exists():
            return Response(
                {"success": False, "data": None, "error": "Customer profile already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CustomerProfileCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Validate city exists
        try:
            city = City.objects.get(pk=data["city_id"], is_active=True)
        except City.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Invalid or inactive city"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = CustomerProfile.objects.create(
            user=request.user,
            phone=request.user.username,  # Username is phone number
            name=data["name"],
            address=data["address"],
            city=city,
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            email=data.get("email"),
        )

        return Response(
            {
                "success": True,
                "data": CustomerProfileSerializer(profile).data,
                "error": None,
            },
            status=status.HTTP_201_CREATED,
        )


class RegisterPartnerView(APIView):
    """
    POST /api/v1/auth/register/partner/
    Submit partner registration after first OTP verification.
    Partner starts in PENDING status — admin must approve.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Check if profile already exists
        if PartnerProfile.objects.filter(user=request.user).exists():
            return Response(
                {"success": False, "data": None, "error": "Partner profile already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PartnerRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Validate city exists
        try:
            city = City.objects.get(pk=data["city_id"], is_active=True)
        except City.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Invalid or inactive city"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = PartnerProfile.objects.create(
            user=request.user,
            phone=request.user.username,
            name=data["name"],
            city=city,
            aadhaar_doc_url=data["aadhaar_doc_url"],
            vehicle_doc_url=data["vehicle_doc_url"],
            license_doc_url=data["license_doc_url"],
            godown_address=data.get("godown_address", ""),
            godown_latitude=data.get("godown_latitude"),
            godown_longitude=data.get("godown_longitude"),
            approval_status="PENDING",
        )

        return Response(
            {
                "success": True,
                "data": PartnerProfileSerializer(profile).data,
                "error": None,
            },
            status=status.HTTP_201_CREATED,
        )


class UpdatePushTokenView(APIView):
    """
    PUT /api/v1/auth/push-token/
    Update Expo push token for current user.
    Called on every app launch to keep the token fresh.
    """

    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        token = request.data.get("expo_push_token", "")

        if not token:
            return Response(
                {"success": False, "data": None, "error": "expo_push_token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update on whichever profile exists
        updated = False

        try:
            profile = request.user.customer_profile
            profile.expo_push_token = token
            profile.save(update_fields=["expo_push_token", "updated_at"])
            updated = True
        except CustomerProfile.DoesNotExist:
            pass

        try:
            profile = request.user.partner_profile
            profile.expo_push_token = token
            profile.save(update_fields=["expo_push_token", "updated_at"])
            updated = True
        except PartnerProfile.DoesNotExist:
            pass

        if not updated:
            return Response(
                {"success": False, "data": None, "error": "No profile found for this user"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "success": True,
            "data": {"message": "Push token updated"},
            "error": None,
        })
