"""
Core URLs
=========
System endpoints
"""
from django.urls import path
from .views import health_check, system_status

app_name = 'core'

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('status/', system_status, name='system-status'),
]