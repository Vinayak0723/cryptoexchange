"""
Security URLs
=============
URL patterns for security features
"""

from django.urls import path
from . import views

app_name = 'security'

urlpatterns = [
    # 2FA
    path('2fa/setup/', views.TwoFactorSetupView.as_view(), name='2fa-setup'),
    path('2fa/disable/', views.TwoFactorDisableView.as_view(), name='2fa-disable'),
    path('2fa/status/', views.TwoFactorStatusView.as_view(), name='2fa-status'),
    path('2fa/backup-codes/', views.TwoFactorRegenerateBackupCodesView.as_view(), name='2fa-backup-codes'),
    
    # API Keys
    path('api-keys/', views.APIKeyListCreateView.as_view(), name='api-keys'),
    path('api-keys/<int:pk>/', views.APIKeyDetailView.as_view(), name='api-key-detail'),
    
    # Audit Logs
    path('audit-logs/', views.AuditLogListView.as_view(), name='audit-logs'),
    
    # IP Whitelist
    path('ip-whitelist/', views.IPWhitelistView.as_view(), name='ip-whitelist'),
    path('ip-whitelist/<int:pk>/', views.IPWhitelistDeleteView.as_view(), name='ip-whitelist-delete'),
    
    # Security Overview
    path('overview/', views.SecurityOverviewView.as_view(), name='security-overview'),
]
