"""
Security Utilities
==================
Helper functions for security features
"""

import qrcode
import io
import base64
from django.core.cache import cache
from ipware import get_client_ip


def generate_qr_code(data):
    """Generate QR code as base64 image"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode()


def get_client_ip_address(request):
    """Get client IP address from request"""
    ip, is_routable = get_client_ip(request)
    return ip


def check_rate_limit(key, limit, window):
    """
    Check rate limit using cache
    Returns (allowed, remaining, reset_time)
    """
    cache_key = f"ratelimit:{key}"
    current = cache.get(cache_key, 0)
    
    if current >= limit:
        ttl = cache.ttl(cache_key) if hasattr(cache, 'ttl') else window
        return False, 0, ttl
    
    # Increment counter
    if current == 0:
        cache.set(cache_key, 1, window)
    else:
        cache.incr(cache_key)
    
    return True, limit - current - 1, window


def sanitize_input(text, max_length=1000):
    """Sanitize user input"""
    import bleach
    if not text:
        return text
    
    # Strip HTML tags
    cleaned = bleach.clean(text, tags=[], strip=True)
    
    # Truncate if needed
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    
    return cleaned.strip()


def mask_email(email):
    """Mask email for display (e.g., j***@example.com)"""
    if not email or '@' not in email:
        return email
    
    local, domain = email.split('@')
    if len(local) <= 2:
        masked_local = local[0] + '***'
    else:
        masked_local = local[0] + '***' + local[-1]
    
    return f"{masked_local}@{domain}"


def mask_ip(ip_address):
    """Mask IP address for display"""
    if not ip_address:
        return ip_address
    
    parts = ip_address.split('.')
    if len(parts) == 4:  # IPv4
        return f"{parts[0]}.{parts[1]}.***.***"
    
    return ip_address[:10] + '***'  # IPv6
