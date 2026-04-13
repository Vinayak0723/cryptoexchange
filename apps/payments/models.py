"""
Payment Models
==============
Real payment processing for fiat and crypto
"""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings


class PaymentMethod(models.Model):
    """User's saved payment methods"""
    METHOD_TYPES = [
        ('bank_account', 'Bank Account'),
        ('upi', 'UPI'),
        ('card', 'Card'),
        ('crypto_wallet', 'Crypto Wallet'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_methods')
    method_type = models.CharField(max_length=20, choices=METHOD_TYPES)
    
    # For bank accounts
    bank_name = models.CharField(max_length=100, blank=True)
    account_number_last4 = models.CharField(max_length=4, blank=True)
    ifsc_code = models.CharField(max_length=11, blank=True)
    account_holder_name = models.CharField(max_length=200, blank=True)
    
    # For UPI
    upi_id = models.CharField(max_length=100, blank=True)
    
    # For crypto wallets
    wallet_address = models.CharField(max_length=100, blank=True)
    chain = models.CharField(max_length=20, blank=True)
    
    is_verified = models.BooleanField(default=False)
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_primary', '-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.method_type}"


class FiatDeposit(models.Model):
    """Fiat currency deposits via Razorpay"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fiat_deposits')
    
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    fee = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=18, decimal_places=2)
    
    # Razorpay details
    razorpay_order_id = models.CharField(max_length=100, unique=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=500, blank=True)
    
    payment_method = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Internal credit
    credited_currency = models.CharField(max_length=10, default='USDT')
    credited_amount = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    exchange_rate = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    
    failure_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.amount} {self.currency} - {self.status}"


class FiatWithdrawal(models.Model):
    """Fiat currency withdrawals"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fiat_withdrawals')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
    
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    fee = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=18, decimal_places=2)
    
    # Source currency
    source_currency = models.CharField(max_length=10, default='USDT')
    source_amount = models.DecimalField(max_digits=18, decimal_places=8)
    exchange_rate = models.DecimalField(max_digits=18, decimal_places=8)
    
    # Bank transfer details
    transfer_id = models.CharField(max_length=100, blank=True)
    utr_number = models.CharField(max_length=100, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    failure_reason = models.TextField(blank=True)
    
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_withdrawals'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.amount} {self.currency} - {self.status}"


class CryptoDeposit(models.Model):
    """Crypto deposits from blockchain"""
    STATUS_CHOICES = [
        ('pending', 'Pending Confirmation'),
        ('confirming', 'Confirming'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='crypto_deposits')
    
    currency = models.CharField(max_length=10)
    amount = models.DecimalField(max_digits=18, decimal_places=8)
    
    # Blockchain details
    chain = models.CharField(max_length=20)
    tx_hash = models.CharField(max_length=100, unique=True)
    from_address = models.CharField(max_length=100)
    to_address = models.CharField(max_length=100)
    
    confirmations = models.IntegerField(default=0)
    required_confirmations = models.IntegerField(default=12)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    credited_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.amount} {self.currency} - {self.status}"


class CryptoWithdrawal(models.Model):
    """Crypto withdrawals to blockchain"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('broadcasting', 'Broadcasting'),
        ('confirming', 'Confirming'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='crypto_withdrawals')
    
    currency = models.CharField(max_length=10)
    amount = models.DecimalField(max_digits=18, decimal_places=8)
    fee = models.DecimalField(max_digits=18, decimal_places=8)
    net_amount = models.DecimalField(max_digits=18, decimal_places=8)
    
    # Blockchain details
    chain = models.CharField(max_length=20)
    to_address = models.CharField(max_length=100)
    tx_hash = models.CharField(max_length=100, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    failure_reason = models.TextField(blank=True)
    
    # 2FA verification
    requires_2fa = models.BooleanField(default=True)
    is_2fa_verified = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    broadcast_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.amount} {self.currency} - {self.status}"


class PaymentAuditLog(models.Model):
    """Audit log for all payment operations"""
    ACTION_CHOICES = [
        ('fiat_deposit_created', 'Fiat Deposit Created'),
        ('fiat_deposit_completed', 'Fiat Deposit Completed'),
        ('fiat_deposit_failed', 'Fiat Deposit Failed'),
        ('fiat_withdrawal_requested', 'Fiat Withdrawal Requested'),
        ('fiat_withdrawal_completed', 'Fiat Withdrawal Completed'),
        ('crypto_deposit_detected', 'Crypto Deposit Detected'),
        ('crypto_deposit_credited', 'Crypto Deposit Credited'),
        ('crypto_withdrawal_requested', 'Crypto Withdrawal Requested'),
        ('crypto_withdrawal_broadcast', 'Crypto Withdrawal Broadcast'),
        ('crypto_withdrawal_completed', 'Crypto Withdrawal Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    
    amount = models.DecimalField(max_digits=18, decimal_places=8)
    currency = models.CharField(max_length=10)
    
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
