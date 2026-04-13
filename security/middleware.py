"""
Security Middleware
===================
Rate limiting and security headers
"""

from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings
from ipware import get_client_ip
import time


class RateLimitMiddleware:
    """
    Rate limiting middleware
    """
    
    # Rate limits: (requests, window_seconds)
    RATE_LIMITS = {
        'default': (100, 60),      # 100 requests per minute
        'auth': (10, 60),          # 10 auth attempts per minute
        'trading': (60, 60),       # 60 trades per minute
        'withdrawal': (5, 300),    # 5 withdrawals per 5 minutes
    }
    
    AUTH_PATHS = ['/api/v1/auth/login/', '/api/v1/auth/register/']
    TRADING_PATHS = ['/api/v1/trading/orders/']
    WITHDRAWAL_PATHS = ['/api/v1/wallet/withdraw/']
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Skip rate limiting for certain paths
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return self.get_response(request)
        
        # Get client IP
        ip, _ = get_client_ip(request)
        if not ip:
            ip = 'unknown'
        
        # Determine rate limit category
        category = self._get_category(request.path)
        limit, window = self.RATE_LIMITS.get(category, self.RATE_LIMITS['default'])
        
        # Check rate limit
        cache_key = f"ratelimit:{category}:{ip}"
        current = cache.get(cache_key, 0)
        
        if current >= limit:
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'retry_after': window
            }, status=429)
        
        # Increment counter
        if current == 0:
            cache.set(cache_key, 1, window)
        else:
            cache.incr(cache_key)
        
        # Add rate limit headers
        response = self.get_response(request)
        response['X-RateLimit-Limit'] = str(limit)
        response['X-RateLimit-Remaining'] = str(max(0, limit - current - 1))
        response['X-RateLimit-Reset'] = str(int(time.time()) + window)
        
        return response
    
    def _get_category(self, path):
        if any(path.startswith(p) for p in self.AUTH_PATHS):
            return 'auth'
        if any(path.startswith(p) for p in self.TRADING_PATHS):
            return 'trading'
        if any(path.startswith(p) for p in self.WITHDRAWAL_PATHS):
            return 'withdrawal'
        return 'default'


class SecurityHeadersMiddleware:
    """
    Add security headers to responses
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Content Security Policy (adjust as needed)
        if not settings.DEBUG:
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' wss: https:;"
            )
        
        return response
