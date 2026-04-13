"""
Security Serializers
====================
API serializers for security features
"""

from rest_framework import serializers
from .models import TwoFactorAuth, APIKey, IPWhitelist


class TwoFactorSetupSerializer(serializers.Serializer):
    """Serializer for 2FA setup response"""
    secret_key = serializers.CharField(read_only=True)
    qr_code = serializers.CharField(read_only=True)
    provisioning_uri = serializers.CharField(read_only=True)


class TwoFactorVerifySerializer(serializers.Serializer):
    """Serializer for 2FA verification"""
    code = serializers.CharField(min_length=6, max_length=6)
    
    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Code must be 6 digits")
        return value


class TwoFactorDisableSerializer(serializers.Serializer):
    """Serializer for disabling 2FA"""
    code = serializers.CharField(min_length=6, max_length=6)
    password = serializers.CharField(write_only=True)


class BackupCodeVerifySerializer(serializers.Serializer):
    """Serializer for backup code verification"""
    backup_code = serializers.CharField(min_length=8, max_length=8)


class TwoFactorStatusSerializer(serializers.ModelSerializer):
    """Serializer for 2FA status"""
    backup_codes_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = TwoFactorAuth
        fields = ['is_enabled', 'created_at', 'updated_at', 'backup_codes_remaining']
    
    def get_backup_codes_remaining(self, obj):
        return len(obj.backup_codes)


class APIKeyCreateSerializer(serializers.Serializer):
    """Serializer for creating API key"""
    name = serializers.CharField(max_length=100)
    permissions = serializers.ChoiceField(choices=APIKey.PERMISSION_CHOICES)
    ip_whitelist = serializers.ListField(
        child=serializers.IPAddressField(),
        required=False,
        default=list
    )
    expires_in_days = serializers.IntegerField(min_value=1, max_value=365, required=False)


class APIKeyResponseSerializer(serializers.Serializer):
    """Serializer for API key creation response (shows secret once)"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    key = serializers.CharField()
    secret = serializers.CharField()  # Only shown once!
    permissions = serializers.CharField()
    created_at = serializers.DateTimeField()
    expires_at = serializers.DateTimeField()
    message = serializers.CharField()


class APIKeyListSerializer(serializers.ModelSerializer):
    """Serializer for listing API keys"""
    key_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = APIKey
        fields = [
            'id', 'name', 'key_preview', 'permissions', 
            'ip_whitelist', 'is_active', 'last_used_at', 
            'last_used_ip', 'expires_at', 'created_at'
        ]
    
    def get_key_preview(self, obj):
        # Show only first and last 4 characters
        return f"{obj.key[:7]}...{obj.key[-4:]}"


class AuditLogSerializer(serializers.Serializer):
    """Serializer for audit logs - generic for existing audit app"""
    id = serializers.IntegerField()
    action = serializers.CharField()
    ip_address = serializers.CharField(allow_null=True)
    details = serializers.JSONField()
    created_at = serializers.DateTimeField()


class IPWhitelistSerializer(serializers.ModelSerializer):
    """Serializer for IP whitelist"""
    class Meta:
        model = IPWhitelist
        fields = ['id', 'ip_address', 'label', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class SecuritySettingsSerializer(serializers.Serializer):
    """Serializer for security settings overview"""
    two_factor_enabled = serializers.BooleanField()
    api_keys_count = serializers.IntegerField()
    whitelisted_ips_count = serializers.IntegerField()
    recent_login_attempts = serializers.IntegerField()
    last_login = serializers.DateTimeField()
    last_password_change = serializers.DateTimeField(allow_null=True)
