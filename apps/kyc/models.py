"""
KYC/AML Models
==============
Complete identity verification system for production use.
"""
import uuid
from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator


class KYCLevel(models.Model):
    """KYC verification levels with associated limits"""
    LEVEL_CHOICES = [
        (0, 'Unverified'),
        (1, 'Basic'),
        (2, 'Intermediate'),
        (3, 'Advanced'),
    ]
    
    name = models.CharField(max_length=50)
    level = models.IntegerField(choices=LEVEL_CHOICES, unique=True)
    description = models.TextField(blank=True)
    
    # Limits (in USD equivalent)
    daily_withdrawal_limit = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    monthly_withdrawal_limit = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    daily_deposit_limit = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    
    # Permissions
    can_trade = models.BooleanField(default=False)
    can_withdraw_crypto = models.BooleanField(default=False)
    can_withdraw_fiat = models.BooleanField(default=False)
    can_deposit_fiat = models.BooleanField(default=False)
    can_use_p2p = models.BooleanField(default=False)
    
    # Requirements
    required_documents = models.JSONField(default=list)
    
    class Meta:
        ordering = ['level']
    
    def __str__(self):
        return f"{self.name} (Level {self.level})"


class KYCProfile(models.Model):
    """User's KYC profile and verification status"""
    STATUS_CHOICES = [
        ('unverified', 'Unverified'),
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='kyc_profile')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unverified')
    current_level = models.ForeignKey(KYCLevel, on_delete=models.PROTECT, null=True, blank=True)
    
    # Personal Information
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    
    # Address
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    
    # ID Information
    id_type = models.CharField(max_length=50, blank=True)  # passport, national_id, drivers_license
    id_number = models.CharField(max_length=100, blank=True)
    id_expiry = models.DateField(null=True, blank=True)
    
    # Tax Information
    tax_id = models.CharField(max_length=50, blank=True)  # PAN for India
    tax_country = models.CharField(max_length=100, blank=True)
    
    # Verification metadata
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='kyc_verifications'
    )
    rejection_reason = models.TextField(blank=True)
    
    # Risk assessment
    risk_score = models.IntegerField(default=0)  # 0-100, higher = more risky
    risk_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'KYC Profile'
        verbose_name_plural = 'KYC Profiles'
    
    def __str__(self):
        return f"KYC: {self.user.email} - {self.status}"
    
    def get_limits(self):
        """Get current limits based on KYC level"""
        if self.current_level:
            return {
                'daily_withdrawal': self.current_level.daily_withdrawal_limit,
                'monthly_withdrawal': self.current_level.monthly_withdrawal_limit,
                'daily_deposit': self.current_level.daily_deposit_limit,
                'can_trade': self.current_level.can_trade,
                'can_withdraw_crypto': self.current_level.can_withdraw_crypto,
                'can_withdraw_fiat': self.current_level.can_withdraw_fiat,
                'can_deposit_fiat': self.current_level.can_deposit_fiat,
            }
        return {
            'daily_withdrawal': 0,
            'monthly_withdrawal': 0,
            'daily_deposit': 0,
            'can_trade': False,
            'can_withdraw_crypto': False,
            'can_withdraw_fiat': False,
            'can_deposit_fiat': False,
        }


class KYCDocument(models.Model):
    """Documents uploaded for KYC verification"""
    DOCUMENT_TYPES = [
        ('passport', 'Passport'),
        ('national_id', 'National ID (Aadhaar/PAN)'),
        ('drivers_license', 'Driver\'s License'),
        ('selfie', 'Selfie with ID'),
        ('proof_of_address', 'Proof of Address'),
        ('bank_statement', 'Bank Statement'),
        ('utility_bill', 'Utility Bill'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kyc_profile = models.ForeignKey(KYCProfile, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    
    # File storage
    file = models.FileField(
        upload_to='kyc_documents/%Y/%m/',
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'pdf'])]
    )
    file_hash = models.CharField(max_length=64, blank=True)  # SHA256 hash for integrity
    
    # Review
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_documents'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Metadata
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.kyc_profile.user.email} - {self.document_type}"


class KYCVerificationRequest(models.Model):
    """Verification requests submitted by users"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kyc_profile = models.ForeignKey(KYCProfile, on_delete=models.CASCADE, related_name='verification_requests')
    
    request_type = models.CharField(max_length=50)  # 'basic', 'intermediate', 'advanced'
    target_level = models.ForeignKey(KYCLevel, on_delete=models.PROTECT, related_name='requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Review details
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='kyc_reviews'
    )
    review_notes = models.TextField(blank=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"{self.kyc_profile.user.email} - {self.request_type} - {self.status}"


class KYCAuditLog(models.Model):
    """Audit log for all KYC-related actions"""
    ACTION_CHOICES = [
        ('profile_created', 'Profile Created'),
        ('profile_updated', 'Profile Updated'),
        ('document_uploaded', 'Document Uploaded'),
        ('document_approved', 'Document Approved'),
        ('document_rejected', 'Document Rejected'),
        ('verification_submitted', 'Verification Submitted'),
        ('verification_approved', 'Verification Approved'),
        ('verification_rejected', 'Verification Rejected'),
        ('level_upgraded', 'Level Upgraded'),
        ('level_downgraded', 'Level Downgraded'),
        ('profile_suspended', 'Profile Suspended'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kyc_profile = models.ForeignKey(KYCProfile, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    
    # Actor
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='kyc_audit_logs'
    )
    
    # Details
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.kyc_profile.user.email} - {self.action}"
