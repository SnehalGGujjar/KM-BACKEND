from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id", "recipient_type", "recipient_id",
            "title", "body", "type", "reference_id",
            "is_read", "city_id", "created_at",
        ]
