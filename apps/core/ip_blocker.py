"""
IP Blocking Service
===================
Block malicious IPs automatically
"""
from django.core.cache import cache
from django.http import JsonResponse
import logging

logger = logging.getLogger('security')


class IPBlocker:
    """
    Service to block and track suspicious IPs

    Features:
    - Track failed authentication attempts
    - Auto-block after threshold reached
    - Manual block/unblock
    - Block duration management
    """

    BLOCK_THRESHOLD = 10      # Failed attempts before blocking
    BLOCK_DURATION = 3600     # Block for 1 hour (seconds)
    TRACK_WINDOW = 300        # Track attempts for 5 minutes (seconds)

    @classmethod
    def track_failed_attempt(cls, ip_address: str, reason: str = '') -> int:
        """
        Track a failed authentication attempt

        Args:
            ip_address: The IP address that failed
            reason: Reason for the failure

        Returns:
            Current attempt count
        """
        cache_key = f'ip_failed:{ip_address}'
        attempts = cache.get(cache_key, 0)
        attempts += 1
        cache.set(cache_key, attempts, cls.TRACK_WINDOW)

        logger.warning(f"Failed attempt from {ip_address}: {reason} (attempt {attempts}/{cls.BLOCK_THRESHOLD})")

        if attempts >= cls.BLOCK_THRESHOLD:
            cls.block_ip(ip_address, f"Too many failed attempts: {reason}")

        return attempts

    @classmethod
    def block_ip(cls, ip_address: str, reason: str = '') -> None:
        """
        Block an IP address

        Args:
            ip_address: The IP to block
            reason: Reason for blocking
        """
        cache_key = f'ip_blocked:{ip_address}'
        cache.set(cache_key, {
            'reason': reason,
            'blocked_at': __import__('time').time()
        }, cls.BLOCK_DURATION)
        logger.error(f"IP BLOCKED: {ip_address} - {reason}")

    @classmethod
    def unblock_ip(cls, ip_address: str) -> None:
        """
        Unblock an IP address

        Args:
            ip_address: The IP to unblock
        """
        cache_key = f'ip_blocked:{ip_address}'
        cache.delete(cache_key)
        # Also clear failed attempts
        cache.delete(f'ip_failed:{ip_address}')
        logger.info(f"IP UNBLOCKED: {ip_address}")

    @classmethod
    def is_blocked(cls, ip_address: str) -> bool:
        """
        Check if an IP is blocked

        Args:
            ip_address: The IP to check

        Returns:
            True if blocked, False otherwise
        """
        cache_key = f'ip_blocked:{ip_address}'
        return cache.get(cache_key) is not None

    @classmethod
    def get_block_info(cls, ip_address: str) -> dict:
        """
        Get block information for an IP

        Args:
            ip_address: The IP to check

        Returns:
            Block info dict or empty dict
        """
        cache_key = f'ip_blocked:{ip_address}'
        return cache.get(cache_key, {})

    @classmethod
    def get_failed_attempts(cls, ip_address: str) -> int:
        """
        Get number of failed attempts for an IP

        Args:
            ip_address: The IP to check

        Returns:
            Number of failed attempts
        """
        cache_key = f'ip_failed:{ip_address}'
        return cache.get(cache_key, 0)

    @classmethod
    def clear_failed_attempts(cls, ip_address: str) -> None:
        """
        Clear failed attempts for an IP (e.g., after successful login)

        Args:
            ip_address: The IP to clear
        """
        cache_key = f'ip_failed:{ip_address}'
        cache.delete(cache_key)


class IPBlockMiddleware:
    """
    Middleware to check for blocked IPs

    Returns 403 Forbidden for blocked IPs
    """

    # Paths to check (empty = check all)
    CHECK_PATHS = []

    # Paths to skip
    SKIP_PATHS = [
        '/api/v1/health/',
        '/static/',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip certain paths
        if any(request.path.startswith(p) for p in self.SKIP_PATHS):
            return self.get_response(request)

        ip = self._get_ip(request)

        if IPBlocker.is_blocked(ip):
            info = IPBlocker.get_block_info(ip)
            logger.warning(f"Blocked IP attempted access: {ip}")
            return JsonResponse({
                'error': 'ip_blocked',
                'message': 'Your IP has been temporarily blocked due to suspicious activity.',
                'reason': info.get('reason', 'Suspicious activity detected')
            }, status=403)

        return self.get_response(request)

    def _get_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')