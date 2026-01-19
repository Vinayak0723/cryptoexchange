"""
URL Configuration
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/accounts/', include('apps.accounts.urls')),
    path('api/v1/wallets/', include('apps.wallets.urls')),
    path('api/v1/trading/', include('apps.trading.urls')),
    path('api/v1/security/', include('security.urls')),
]
