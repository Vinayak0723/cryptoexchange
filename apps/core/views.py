"""
Core Views
==========
System status and health checks
"""
from django.http import JsonResponse
from django.db import connection
from django.conf import settings


def health_check(request):
    """
    Health check endpoint for deployment platforms

    Returns:
        JSON with health status and database connection
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return JsonResponse({
        'status': 'healthy' if db_status == 'connected' else 'unhealthy',
        'database': db_status,
        'version': '1.0.0'
    })


def system_status(request):
    """
    Get system status for frontend

    Returns configuration flags for:
    - Demo mode
    - Trading enabled
    - Withdrawals enabled
    - Deposits enabled
    - Maintenance mode
    """
    return JsonResponse({
        'demo_mode': getattr(settings, 'DEMO_MODE', False),
        'trading_enabled': getattr(settings, 'TRADING_ENABLED', True),
        'withdrawals_enabled': getattr(settings, 'WITHDRAWALS_ENABLED', True),
        'deposits_enabled': getattr(settings, 'DEPOSITS_ENABLED', True),
        'maintenance_mode': getattr(settings, 'MAINTENANCE_MODE', False),
        'maintenance_message': getattr(settings, 'MAINTENANCE_MESSAGE', ''),
        'version': '1.0.0',
    })