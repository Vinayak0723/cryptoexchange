"""
Security Admin
==============
Admin interface for security models
"""

from django.contrib import admin
from .models import TwoFactorAuth, APIKey, IPWhitelist, LoginAttempt


@admin.register(TwoFactorAuth)
class TwoFactorAuthAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_enabled', 'created_at', 'updated_at']
    list_filter = ['is_enabled']
    search_fields = ['user__email']
    readonly_fields = ['secret_key', 'backup_codes']


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'permissions', 'is_active', 'last_used_at', 'created_at']
    list_filter = ['permissions', 'is_active']
    search_fields = ['name', 'user__email', 'key']
    readonly_fields = ['key', 'secret_hash']


@admin.register(IPWhitelist)
class IPWhitelistAdmin(admin.ModelAdmin):
    list_display = ['user', 'ip_address', 'label', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['user__email', 'ip_address', 'label']


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ['email', 'ip_address', 'success', 'failure_reason', 'created_at']
    list_filter = ['success']
    search_fields = ['email', 'ip_address']
    readonly_fields = ['email', 'ip_address', 'user_agent', 'success', 'failure_reason', 'created_at']
    date_hierarchy = 'created_at'
