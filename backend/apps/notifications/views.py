"""
Notifications app — Views.
List notifications and mark as read.
"""

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """
    GET /notifications/
    List notifications for current user (Customer or Partner).
    """

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        try:
            profile = user.customer_profile
            return Notification.objects.filter(
                recipient_type="CUSTOMER", recipient_id=profile.id
            )
        except Exception:
            pass

        try:
            profile = user.partner_profile
            return Notification.objects.filter(
                recipient_type="PARTNER", recipient_id=profile.id
            )
        except Exception:
            pass

        return Notification.objects.none()


class NotificationMarkReadView(APIView):
    """
    POST /notifications/{id}/read/
    Mark a specific notification as read.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        qs = Notification.objects.all()

        try:
            profile = user.customer_profile
            qs = qs.filter(recipient_type="CUSTOMER", recipient_id=profile.id)
        except Exception:
            try:
                profile = user.partner_profile
                qs = qs.filter(recipient_type="PARTNER", recipient_id=profile.id)
            except Exception:
                qs = qs.none()

        try:
            notification = qs.get(pk=pk)
            notification.is_read = True
            notification.save(update_fields=["is_read"])
            return Response({"success": True, "data": {"is_read": True}, "error": None})
        except Notification.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Notification not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


class NotificationMarkAllReadView(APIView):
    """
    POST /notifications/read-all/
    Mark all notifications for the user as read.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        qs = Notification.objects.filter(is_read=False)

        try:
            profile = user.customer_profile
            qs = qs.filter(recipient_type="CUSTOMER", recipient_id=profile.id)
        except Exception:
            try:
                profile = user.partner_profile
                qs = qs.filter(recipient_type="PARTNER", recipient_id=profile.id)
            except Exception:
                qs = qs.none()

        updated_count = qs.update(is_read=True)
        return Response({
            "success": True, 
            "data": {"updated_count": updated_count}, 
            "error": None
        })
