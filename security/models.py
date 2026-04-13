"""
Security Models
===============
Models for 2FA, API Keys, and IP Whitelisting
Note: Using existing audit.AuditLog for audit logging
"""

import secrets
import hashlib
import pyotp
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class TwoFactorAuth(models.Model):
    """
    Two-Factor Authentication settings for users
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='two_factor_auth'
    )
    secret_key = models.CharField(max_length=32)
    is_enabled = models.BooleanField(default=False)
    backup_codes = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Two-Factor Authentication"
        verbose_name_plural = "Two-Factor Authentications"
    
    def __str__(self):
        status = "enabled" if self.is_enabled else "disabled"
        return f"2FA for {self.user.email} ({status})"
    
    @classmethod
    def generate_secret(cls):
        """Generate a new TOTP secret key"""
        return pyotp.random_base32()
    
    def get_totp(self):
        """Get TOTP object for verification"""
        return pyotp.TOTP(self.secret_key)
    
    def verify_code(self, code):
        """Verify a TOTP code"""
        totp = self.get_totp()
        return totp.verify(code, valid_window=1)
    
    def get_provisioning_uri(self):
        """Get URI for QR code generation"""
        totp = self.get_totp()
        return totp.provisioning_uri(
            name=self.user.email,
            issuer_name="CryptoExchange"
        )
    
    def generate_backup_codes(self, count=10):
        """Generate backup codes for account recovery"""
        codes = [secrets.token_hex(4).upper() for _ in range(count)]
        self.backup_codes = [
            hashlib.sha256(code.encode()).hexdigest() 
            for code in codes
        ]
        self.save()
        return codes  # Return plain codes to show user once
    
    def verify_backup_code(self, code):
        """Verify and consume a backup code"""
        code_hash = hashlib.sha256(code.upper().encode()).hexdigest()
        if code_hash in self.backup_codes:
            self.backup_codes.remove(code_hash)
            self.save()
            return True
        return False


class APIKey(models.Model):
    """
    API Keys for programmatic trading access
    """
    PERMISSION_CHOICES = [
        ('read', 'Read Only'),
        ('trade', 'Trading'),
        ('withdraw', 'Withdraw'),
        ('full', 'Full Access'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='api_keys'
    )
    name = models.CharField(max_length=100)
    key = models.CharField(max_length=64, unique=True, db_index=True)
    secret_hash = models.CharField(max_length=128)  # Store hashed secret
    permissions = models.CharField(max_length=20, choices=PERMISSION_CHOICES, default='read')
    ip_whitelist = models.JSONField(default=list, blank=True)  # List of allowed IPs
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    last_used_ip = models.GenericIPAddressField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "API Key"
        verbose_name_plural = "API Keys"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.user.email})"
    
    @classmethod
    def generate_key_pair(cls):
        """Generate a new API key and secret pair"""
        api_key = f"cx_{secrets.token_hex(24)}"
        api_secret = secrets.token_hex(32)
        secret_hash = hashlib.sha256(api_secret.encode()).hexdigest()
        return api_key, api_secret, secret_hash
    
    def verify_secret(self, secret):
        """Verify the API secret"""
        secret_hash = hashlib.sha256(secret.encode()).hexdigest()
        return secrets.compare_digest(self.secret_hash, secret_hash)
    
    def is_valid(self):
        """Check if key is valid and not expired"""
        if not self.is_active:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True
    
    def check_ip(self, ip_address):
        """Check if IP is allowed"""
        if not self.ip_whitelist:
            return True  # No whitelist means all IPs allowed
        return ip_address in self.ip_whitelist
    
    def record_usage(self, ip_address):
        """Record API key usage"""
        self.last_used_at = timezone.now()
        self.last_used_ip = ip_address
        self.save(update_fields=['last_used_at', 'last_used_ip'])


class IPWhitelist(models.Model):
    """
    IP Whitelist for withdrawal security
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='security_ip_whitelist'
    )
    ip_address = models.GenericIPAddressField()
    label = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "IP Whitelist"
        verbose_name_plural = "IP Whitelists"
        unique_together = ['user', 'ip_address']
    
    def __str__(self):
        return f"{self.label} - {self.ip_address} ({self.user.email})"


class LoginAttempt(models.Model):
    """
    Track login attempts for security monitoring
    """
    email = models.EmailField(db_index=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    success = models.BooleanField(default=False)
    failure_reason = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Login Attempt"
        verbose_name_plural = "Login Attempts"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'created_at']),
            models.Index(fields=['ip_address', 'created_at']),
        ]
    
    def __str__(self):
        status = "success" if self.success else "failed"
        return f"{self.email} - {status} - {self.created_at}"
    
    @classmethod
    def is_blocked(cls, email=None, ip_address=None, window_minutes=30, max_attempts=5):
        """Check if email or IP should be blocked"""
        window_start = timezone.now() - timedelta(minutes=window_minutes)
        
        if email:
            email_attempts = cls.objects.filter(
                email=email,
                success=False,
                created_at__gte=window_start
            ).count()
            if email_attempts >= max_attempts:
                return True, f"Too many failed attempts for this email"
        
        if ip_address:
            ip_attempts = cls.objects.filter(
                ip_address=ip_address,
                success=False,
                created_at__gte=window_start
            ).count()
            if ip_attempts >= max_attempts * 2:  # Higher threshold for IP
                return True, f"Too many failed attempts from this IP"
        
        return False, None
