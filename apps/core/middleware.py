"""
Core Middleware
===============
Production checks and maintenance mode
"""
from django.http import JsonResponse
from django.conf import settings


class MaintenanceModeMiddleware:
    """
    Return 503 when in maintenance mode

    Allows certain paths like health check and admin
    """

    ALLOWED_PATHS = [
        '/api/v1/health/',
        '/api/v1/status/',
        '/admin/',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if getattr(settings, 'MAINTENANCE_MODE', False):
            # Allow certain paths
            if not any(request.path.startswith(p) for p in self.ALLOWED_PATHS):
                return JsonResponse({
                    'error': 'maintenance',
                    'message': getattr(settings, 'MAINTENANCE_MESSAGE', 'System under maintenance')
                }, status=503)

        return self.get_response(request)


class TradingEnabledMiddleware:
    """
    Check if trading is enabled for trade-related endpoints

    Blocks POST/PUT/PATCH to trading endpoints when disabled
    """

    TRADING_PATHS = [
        '/api/v1/trading/orders/',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method in ['POST', 'PUT', 'PATCH']:
            if any(request.path.startswith(p) for p in self.TRADING_PATHS):
                if not getattr(settings, 'TRADING_ENABLED', True):
                    return JsonResponse({
                        'error': 'trading_disabled',
                        'message': 'Trading is temporarily disabled'
                    }, status=503)

        return self.get_response(request)


class WithdrawalsEnabledMiddleware:
    """
    Check if withdrawals are enabled

    Blocks POST to withdrawal endpoints when disabled
    """

    WITHDRAWAL_PATHS = [
        '/api/v1/payments/fiat/withdraw/',
        '/api/v1/payments/crypto/withdraw/',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'POST':
            if any(request.path.startswith(p) for p in self.WITHDRAWAL_PATHS):
                if not getattr(settings, 'WITHDRAWALS_ENABLED', True):
                    return JsonResponse({
                        'error': 'withdrawals_disabled',
                        'message': 'Withdrawals are temporarily disabled'
                    }, status=503)

        return self.get_response(request)


class DepositsEnabledMiddleware:
    """
    Check if deposits are enabled

    Blocks POST to deposit endpoints when disabled
    """

    DEPOSIT_PATHS = [
        '/api/v1/payments/fiat/deposit/',
        '/api/v1/payments/crypto/deposit/',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'POST':
            if any(request.path.startswith(p) for p in self.DEPOSIT_PATHS):
                if not getattr(settings, 'DEPOSITS_ENABLED', True):
                    return JsonResponse({
                        'error': 'deposits_disabled',
                        'message': 'Deposits are temporarily disabled'
                    }, status=503)

        return self.get_response(request)