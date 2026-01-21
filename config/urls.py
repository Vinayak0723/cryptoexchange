"""
URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from .views import health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health check endpoint
    path('api/v1/health/', health_check, name='health_check'),
    
    # API endpoints
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/wallets/', include('apps.wallets.urls')),
    path('api/v1/email/', include('emails.urls')),
    path('api/v1/trading/', include('apps.trading.urls')),
    path('api/v1/security/', include('security.urls')),
]
