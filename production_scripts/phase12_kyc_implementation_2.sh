#!/bin/bash

# ============================================
# PHASE 12: KYC/AML COMPLIANCE SYSTEM
# ============================================
# Complete Identity Verification System
# - Document upload (ID, Passport, Selfie)
# - KYC verification levels
# - Withdrawal limits based on verification
# - Admin review panel
# - Audit logging
# ============================================

cd ~/Projects/cryptoexchange

echo "============================================"
echo "PHASE 12: KYC/AML Compliance System"
echo "============================================"

# 1. Create KYC app
echo "Creating KYC app..."
python manage.py startapp kyc
mv kyc apps/

# 2. Create KYC models
echo "Creating KYC models..."
cat > apps/kyc/models.py << 'MODELS_EOF'
"""
KYC/AML Models for Identity Verification
"""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone


class KYCLevel(models.Model):
    """KYC verification levels with associated limits"""
    
    class LevelType(models.TextChoices):
        UNVERIFIED = 'unverified', 'Unverified'
        BASIC = 'basic', 'Basic'
        INTERMEDIATE = 'intermediate', 'Intermediate'
        ADVANCED = 'advanced', 'Advanced'
    
    level = models.CharField(
        max_length=20,
        choices=LevelType.choices,
        unique=True
    )
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    
    # Limits
    daily_withdrawal_limit = models.DecimalField(
        max_digits=20, decimal_places=2,
        help_text='Daily withdrawal limit in USD'
    )
    monthly_withdrawal_limit = models.DecimalField(
        max_digits=20, decimal_places=2,
        help_text='Monthly withdrawal limit in USD'
    )
    daily_deposit_limit = models.DecimalField(
        max_digits=20, decimal_places=2,
        help_text='Daily deposit limit in USD'
    )
    
    # Features
    can_trade = models.BooleanField(default=True)
    can_withdraw_crypto = models.BooleanField(default=False)
    can_withdraw_fiat = models.BooleanField(default=False)
    can_use_p2p = models.BooleanField(default=False)
    
    # Requirements
    requires_email = models.BooleanField(default=True)
    requires_phone = models.BooleanField(default=False)
    requires_id_document = models.BooleanField(default=False)
    requires_selfie = models.BooleanField(default=False)
    requires_proof_of_address = models.BooleanField(default=False)
    requires_source_of_funds = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'kyc_levels'
        ordering = ['daily_withdrawal_limit']
    
    def __str__(self):
        return f"{self.name} - ${self.daily_withdrawal_limit}/day"


class KYCProfile(models.Model):
    """User's KYC profile and verification status"""
    
    class Status(models.TextChoices):
        NOT_STARTED = 'not_started', 'Not Started'
        PENDING = 'pending', 'Pending Review'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        EXPIRED = 'expired', 'Expired'
        SUSPENDED = 'suspended', 'Suspended'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='kyc_profile'
    )
    
    # Current level
    current_level = models.ForeignKey(
        KYCLevel,
        on_delete=models.PROTECT,
        related_name='profiles',
        null=True,
        blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NOT_STARTED
    )
    
    # Personal Information
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    
    # Contact
    phone_number = models.CharField(max_length=20, blank=True)
    phone_verified = models.BooleanField(default=False)
    
    # Address
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    
    # Verification timestamps
    email_verified_at = models.DateTimeField(null=True, blank=True)
    phone_verified_at = models.DateTimeField(null=True, blank=True)
    identity_verified_at = models.DateTimeField(null=True, blank=True)
    address_verified_at = models.DateTimeField(null=True, blank=True)
    
    # Review
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='kyc_reviews'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Risk assessment
    risk_score = models.IntegerField(default=0, help_text='0-100, higher = more risk')
    is_pep = models.BooleanField(default=False, help_text='Politically Exposed Person')
    is_sanctioned = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'kyc_profiles'
    
    def __str__(self):
        return f"KYC: {self.user.email} - {self.status}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def is_verified(self):
        return self.status == self.Status.APPROVED
    
    def get_withdrawal_limit(self, period='daily'):
        if not self.current_level:
            return Decimal('0')
        if period == 'monthly':
            return self.current_level.monthly_withdrawal_limit
        return self.current_level.daily_withdrawal_limit


class KYCDocument(models.Model):
    """Uploaded KYC documents"""
    
    class DocumentType(models.TextChoices):
        PASSPORT = 'passport', 'Passport'
        NATIONAL_ID = 'national_id', 'National ID'
        DRIVERS_LICENSE = 'drivers_license', "Driver's License"
        SELFIE = 'selfie', 'Selfie with ID'
        PROOF_OF_ADDRESS = 'proof_of_address', 'Proof of Address'
        BANK_STATEMENT = 'bank_statement', 'Bank Statement'
        UTILITY_BILL = 'utility_bill', 'Utility Bill'
        SOURCE_OF_FUNDS = 'source_of_funds', 'Source of Funds'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Review'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        EXPIRED = 'expired', 'Expired'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kyc_profile = models.ForeignKey(
        KYCProfile,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    
    document_type = models.CharField(max_length=30, choices=DocumentType.choices)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    # File
    file = models.FileField(upload_to='kyc_documents/%Y/%m/')
    file_hash = models.CharField(max_length=64, blank=True)  # SHA256 hash
    original_filename = models.CharField(max_length=255)
    file_size = models.IntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True)
    
    # Document details
    document_number = models.CharField(max_length=100, blank=True)
    issuing_country = models.CharField(max_length=100, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    # Review
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_documents'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # OCR/AI extraction
    extracted_data = models.JSONField(default=dict, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'kyc_documents'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.document_type} - {self.kyc_profile.user.email}"
    
    @property
    def is_expired(self):
        if self.expiry_date:
            return self.expiry_date < timezone.now().date()
        return False


class KYCVerificationRequest(models.Model):
    """Track verification requests/submissions"""
    
    class RequestType(models.TextChoices):
        BASIC = 'basic', 'Basic Verification'
        INTERMEDIATE = 'intermediate', 'Intermediate Verification'
        ADVANCED = 'advanced', 'Advanced Verification'
        RESUBMISSION = 'resubmission', 'Resubmission'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_REVIEW = 'in_review', 'In Review'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        MORE_INFO = 'more_info', 'More Info Required'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kyc_profile = models.ForeignKey(
        KYCProfile,
        on_delete=models.CASCADE,
        related_name='verification_requests'
    )
    
    request_type = models.CharField(max_length=20, choices=RequestType.choices)
    target_level = models.ForeignKey(
        KYCLevel,
        on_delete=models.PROTECT,
        related_name='verification_requests'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    # Documents submitted with this request
    documents = models.ManyToManyField(KYCDocument, related_name='verification_requests')
    
    # Review
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_kyc_requests'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_kyc_requests'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Notes
    admin_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    additional_info_request = models.TextField(blank=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'kyc_verification_requests'
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"{self.request_type} - {self.kyc_profile.user.email} - {self.status}"


class KYCAuditLog(models.Model):
    """Audit log for KYC-related actions"""
    
    class Action(models.TextChoices):
        PROFILE_CREATED = 'profile_created', 'Profile Created'
        DOCUMENT_UPLOADED = 'document_uploaded', 'Document Uploaded'
        DOCUMENT_APPROVED = 'document_approved', 'Document Approved'
        DOCUMENT_REJECTED = 'document_rejected', 'Document Rejected'
        VERIFICATION_SUBMITTED = 'verification_submitted', 'Verification Submitted'
        VERIFICATION_APPROVED = 'verification_approved', 'Verification Approved'
        VERIFICATION_REJECTED = 'verification_rejected', 'Verification Rejected'
        LEVEL_UPGRADED = 'level_upgraded', 'Level Upgraded'
        LEVEL_DOWNGRADED = 'level_downgraded', 'Level Downgraded'
        PROFILE_SUSPENDED = 'profile_suspended', 'Profile Suspended'
        PROFILE_REACTIVATED = 'profile_reactivated', 'Profile Reactivated'
        RISK_SCORE_UPDATED = 'risk_score_updated', 'Risk Score Updated'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kyc_profile = models.ForeignKey(
        KYCProfile,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    
    action = models.CharField(max_length=30, choices=Action.choices)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='kyc_actions'
    )
    
    # Details
    description = models.TextField()
    old_value = models.JSONField(default=dict, blank=True)
    new_value = models.JSONField(default=dict, blank=True)
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'kyc_audit_logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action} - {self.kyc_profile.user.email}"
MODELS_EOF

# 3. Create KYC Serializers
echo "Creating KYC serializers..."
cat > apps/kyc/serializers.py << 'SERIALIZERS_EOF'
"""
KYC Serializers
"""
from rest_framework import serializers
from .models import KYCLevel, KYCProfile, KYCDocument, KYCVerificationRequest, KYCAuditLog


class KYCLevelSerializer(serializers.ModelSerializer):
    """Serializer for KYC levels"""
    
    class Meta:
        model = KYCLevel
        fields = [
            'level', 'name', 'description',
            'daily_withdrawal_limit', 'monthly_withdrawal_limit', 'daily_deposit_limit',
            'can_trade', 'can_withdraw_crypto', 'can_withdraw_fiat', 'can_use_p2p',
            'requires_email', 'requires_phone', 'requires_id_document',
            'requires_selfie', 'requires_proof_of_address', 'requires_source_of_funds'
        ]


class KYCDocumentSerializer(serializers.ModelSerializer):
    """Serializer for KYC documents"""
    
    class Meta:
        model = KYCDocument
        fields = [
            'id', 'document_type', 'status',
            'original_filename', 'file_size', 'mime_type',
            'document_number', 'issuing_country', 'issue_date', 'expiry_date',
            'rejection_reason', 'is_expired',
            'created_at', 'reviewed_at'
        ]
        read_only_fields = [
            'id', 'status', 'file_size', 'mime_type',
            'rejection_reason', 'is_expired', 'created_at', 'reviewed_at'
        ]


class KYCDocumentUploadSerializer(serializers.Serializer):
    """Serializer for document upload"""
    
    document_type = serializers.ChoiceField(choices=KYCDocument.DocumentType.choices)
    file = serializers.FileField()
    document_number = serializers.CharField(required=False, allow_blank=True)
    issuing_country = serializers.CharField(required=False, allow_blank=True)
    issue_date = serializers.DateField(required=False, allow_null=True)
    expiry_date = serializers.DateField(required=False, allow_null=True)
    
    def validate_file(self, value):
        # Max 10MB
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size must be under 10MB")
        
        # Allowed types
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                f"Invalid file type. Allowed: JPEG, PNG, GIF, PDF"
            )
        
        return value


class KYCProfileSerializer(serializers.ModelSerializer):
    """Serializer for KYC profile"""
    
    current_level = KYCLevelSerializer(read_only=True)
    documents = KYCDocumentSerializer(many=True, read_only=True)
    full_name = serializers.CharField(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    daily_withdrawal_limit = serializers.SerializerMethodField()
    monthly_withdrawal_limit = serializers.SerializerMethodField()
    
    class Meta:
        model = KYCProfile
        fields = [
            'id', 'status', 'current_level',
            'first_name', 'last_name', 'full_name', 'date_of_birth', 'nationality',
            'phone_number', 'phone_verified',
            'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
            'email_verified_at', 'phone_verified_at', 'identity_verified_at', 'address_verified_at',
            'is_verified', 'risk_score',
            'daily_withdrawal_limit', 'monthly_withdrawal_limit',
            'documents', 'rejection_reason',
            'created_at', 'updated_at', 'expires_at'
        ]
        read_only_fields = [
            'id', 'status', 'current_level', 'phone_verified',
            'email_verified_at', 'phone_verified_at', 'identity_verified_at', 'address_verified_at',
            'is_verified', 'risk_score', 'rejection_reason',
            'created_at', 'updated_at', 'expires_at'
        ]
    
    def get_daily_withdrawal_limit(self, obj):
        return str(obj.get_withdrawal_limit('daily'))
    
    def get_monthly_withdrawal_limit(self, obj):
        return str(obj.get_withdrawal_limit('monthly'))


class KYCProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating KYC profile"""
    
    class Meta:
        model = KYCProfile
        fields = [
            'first_name', 'last_name', 'date_of_birth', 'nationality',
            'phone_number',
            'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country'
        ]
    
    def validate_date_of_birth(self, value):
        from datetime import date
        if value:
            today = date.today()
            age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
            if age < 18:
                raise serializers.ValidationError("You must be at least 18 years old")
            if age > 120:
                raise serializers.ValidationError("Invalid date of birth")
        return value


class KYCVerificationRequestSerializer(serializers.ModelSerializer):
    """Serializer for verification requests"""
    
    target_level = KYCLevelSerializer(read_only=True)
    documents = KYCDocumentSerializer(many=True, read_only=True)
    
    class Meta:
        model = KYCVerificationRequest
        fields = [
            'id', 'request_type', 'target_level', 'status',
            'documents', 'rejection_reason', 'additional_info_request',
            'submitted_at', 'reviewed_at'
        ]
        read_only_fields = [
            'id', 'status', 'rejection_reason', 'additional_info_request',
            'submitted_at', 'reviewed_at'
        ]


class SubmitVerificationSerializer(serializers.Serializer):
    """Serializer for submitting verification request"""
    
    target_level = serializers.ChoiceField(choices=KYCLevel.LevelType.choices)
    document_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list
    )


class KYCAuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs"""
    
    performed_by_email = serializers.CharField(source='performed_by.email', read_only=True)
    
    class Meta:
        model = KYCAuditLog
        fields = [
            'id', 'action', 'performed_by_email',
            'description', 'old_value', 'new_value',
            'ip_address', 'created_at'
        ]


# Admin Serializers
class AdminKYCProfileSerializer(serializers.ModelSerializer):
    """Admin serializer for KYC profile with full details"""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    current_level = KYCLevelSerializer(read_only=True)
    documents = KYCDocumentSerializer(many=True, read_only=True)
    verification_requests = KYCVerificationRequestSerializer(many=True, read_only=True)
    
    class Meta:
        model = KYCProfile
        fields = '__all__'


class AdminDocumentReviewSerializer(serializers.Serializer):
    """Serializer for admin document review"""
    
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    document_number = serializers.CharField(required=False, allow_blank=True)
    issuing_country = serializers.CharField(required=False, allow_blank=True)
    expiry_date = serializers.DateField(required=False, allow_null=True)
    
    def validate(self, data):
        if data['action'] == 'reject' and not data.get('rejection_reason'):
            raise serializers.ValidationError({
                'rejection_reason': 'Rejection reason is required when rejecting a document'
            })
        return data


class AdminVerificationReviewSerializer(serializers.Serializer):
    """Serializer for admin verification review"""
    
    action = serializers.ChoiceField(choices=['approve', 'reject', 'request_more_info'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    additional_info_request = serializers.CharField(required=False, allow_blank=True)
    admin_notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if data['action'] == 'reject' and not data.get('rejection_reason'):
            raise serializers.ValidationError({
                'rejection_reason': 'Rejection reason is required'
            })
        if data['action'] == 'request_more_info' and not data.get('additional_info_request'):
            raise serializers.ValidationError({
                'additional_info_request': 'Please specify what additional information is needed'
            })
        return data
SERIALIZERS_EOF

# 4. Create KYC Services
echo "Creating KYC services..."
mkdir -p apps/kyc/services
touch apps/kyc/services/__init__.py

cat > apps/kyc/services/kyc_service.py << 'SERVICE_EOF'
"""
KYC Service - Business logic for KYC operations
"""
import hashlib
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from ..models import KYCLevel, KYCProfile, KYCDocument, KYCVerificationRequest, KYCAuditLog


class KYCService:
    """Service class for KYC operations"""
    
    @staticmethod
    def get_or_create_profile(user):
        """Get or create KYC profile for user"""
        profile, created = KYCProfile.objects.get_or_create(
            user=user,
            defaults={
                'current_level': KYCLevel.objects.filter(
                    level=KYCLevel.LevelType.UNVERIFIED
                ).first()
            }
        )
        
        if created:
            KYCAuditLog.objects.create(
                kyc_profile=profile,
                action=KYCAuditLog.Action.PROFILE_CREATED,
                performed_by=user,
                description=f"KYC profile created for {user.email}"
            )
        
        return profile
    
    @staticmethod
    def update_profile(profile, data, request=None):
        """Update KYC profile with personal information"""
        for field, value in data.items():
            if hasattr(profile, field):
                setattr(profile, field, value)
        
        profile.save()
        
        KYCAuditLog.objects.create(
            kyc_profile=profile,
            action=KYCAuditLog.Action.PROFILE_CREATED,
            performed_by=profile.user,
            description="Profile information updated",
            new_value=data,
            ip_address=request.META.get('REMOTE_ADDR') if request else None,
            user_agent=request.META.get('HTTP_USER_AGENT', '') if request else ''
        )
        
        return profile
    
    @staticmethod
    def upload_document(profile, document_type, file, **kwargs):
        """Upload a KYC document"""
        # Calculate file hash
        file_hash = hashlib.sha256()
        for chunk in file.chunks():
            file_hash.update(chunk)
        
        document = KYCDocument.objects.create(
            kyc_profile=profile,
            document_type=document_type,
            file=file,
            file_hash=file_hash.hexdigest(),
            original_filename=file.name,
            file_size=file.size,
            mime_type=file.content_type,
            document_number=kwargs.get('document_number', ''),
            issuing_country=kwargs.get('issuing_country', ''),
            issue_date=kwargs.get('issue_date'),
            expiry_date=kwargs.get('expiry_date')
        )
        
        KYCAuditLog.objects.create(
            kyc_profile=profile,
            action=KYCAuditLog.Action.DOCUMENT_UPLOADED,
            performed_by=profile.user,
            description=f"Document uploaded: {document_type}",
            new_value={
                'document_id': str(document.id),
                'document_type': document_type,
                'filename': file.name
            }
        )
        
        return document
    
    @staticmethod
    @transaction.atomic
    def submit_verification(profile, target_level_type, document_ids=None):
        """Submit a verification request"""
        target_level = KYCLevel.objects.get(level=target_level_type)
        
        # Determine request type
        if profile.status == KYCProfile.Status.REJECTED:
            request_type = KYCVerificationRequest.RequestType.RESUBMISSION
        else:
            request_type = target_level_type
        
        # Create verification request
        verification_request = KYCVerificationRequest.objects.create(
            kyc_profile=profile,
            request_type=request_type,
            target_level=target_level,
            status=KYCVerificationRequest.Status.PENDING
        )
        
        # Attach documents
        if document_ids:
            documents = KYCDocument.objects.filter(
                id__in=document_ids,
                kyc_profile=profile
            )
            verification_request.documents.set(documents)
        else:
            # Attach all pending documents
            pending_docs = profile.documents.filter(status=KYCDocument.Status.PENDING)
            verification_request.documents.set(pending_docs)
        
        # Update profile status
        profile.status = KYCProfile.Status.PENDING
        profile.save()
        
        KYCAuditLog.objects.create(
            kyc_profile=profile,
            action=KYCAuditLog.Action.VERIFICATION_SUBMITTED,
            performed_by=profile.user,
            description=f"Verification request submitted for {target_level.name}",
            new_value={
                'request_id': str(verification_request.id),
                'target_level': target_level_type
            }
        )
        
        return verification_request
    
    @staticmethod
    @transaction.atomic
    def approve_document(document, admin_user, **kwargs):
        """Approve a KYC document"""
        old_status = document.status
        
        document.status = KYCDocument.Status.APPROVED
        document.reviewed_by = admin_user
        document.reviewed_at = timezone.now()
        
        # Update additional fields if provided
        if kwargs.get('document_number'):
            document.document_number = kwargs['document_number']
        if kwargs.get('issuing_country'):
            document.issuing_country = kwargs['issuing_country']
        if kwargs.get('expiry_date'):
            document.expiry_date = kwargs['expiry_date']
        
        document.save()
        
        KYCAuditLog.objects.create(
            kyc_profile=document.kyc_profile,
            action=KYCAuditLog.Action.DOCUMENT_APPROVED,
            performed_by=admin_user,
            description=f"Document approved: {document.document_type}",
            old_value={'status': old_status},
            new_value={'status': document.status}
        )
        
        return document
    
    @staticmethod
    @transaction.atomic
    def reject_document(document, admin_user, reason):
        """Reject a KYC document"""
        old_status = document.status
        
        document.status = KYCDocument.Status.REJECTED
        document.reviewed_by = admin_user
        document.reviewed_at = timezone.now()
        document.rejection_reason = reason
        document.save()
        
        KYCAuditLog.objects.create(
            kyc_profile=document.kyc_profile,
            action=KYCAuditLog.Action.DOCUMENT_REJECTED,
            performed_by=admin_user,
            description=f"Document rejected: {document.document_type}",
            old_value={'status': old_status},
            new_value={'status': document.status, 'reason': reason}
        )
        
        return document
    
    @staticmethod
    @transaction.atomic
    def approve_verification(verification_request, admin_user, notes=''):
        """Approve a verification request and upgrade user level"""
        profile = verification_request.kyc_profile
        old_level = profile.current_level
        
        # Update verification request
        verification_request.status = KYCVerificationRequest.Status.APPROVED
        verification_request.reviewed_by = admin_user
        verification_request.reviewed_at = timezone.now()
        verification_request.admin_notes = notes
        verification_request.save()
        
        # Update profile
        profile.current_level = verification_request.target_level
        profile.status = KYCProfile.Status.APPROVED
        profile.reviewed_by = admin_user
        profile.reviewed_at = timezone.now()
        
        # Set verification timestamps based on level
        now = timezone.now()
        if verification_request.target_level.requires_id_document:
            profile.identity_verified_at = now
        if verification_request.target_level.requires_proof_of_address:
            profile.address_verified_at = now
        
        # Set expiry (typically 1-2 years)
        from datetime import timedelta
        profile.expires_at = now + timedelta(days=365)
        
        profile.save()
        
        # Approve all pending documents in this request
        verification_request.documents.filter(
            status=KYCDocument.Status.PENDING
        ).update(
            status=KYCDocument.Status.APPROVED,
            reviewed_by=admin_user,
            reviewed_at=now
        )
        
        KYCAuditLog.objects.create(
            kyc_profile=profile,
            action=KYCAuditLog.Action.VERIFICATION_APPROVED,
            performed_by=admin_user,
            description=f"Verification approved - Level upgraded to {verification_request.target_level.name}",
            old_value={'level': old_level.level if old_level else None},
            new_value={'level': verification_request.target_level.level}
        )
        
        KYCAuditLog.objects.create(
            kyc_profile=profile,
            action=KYCAuditLog.Action.LEVEL_UPGRADED,
            performed_by=admin_user,
            description=f"Level upgraded from {old_level.name if old_level else 'None'} to {verification_request.target_level.name}",
            old_value={'level': old_level.level if old_level else None},
            new_value={'level': verification_request.target_level.level}
        )
        
        return verification_request
    
    @staticmethod
    @transaction.atomic
    def reject_verification(verification_request, admin_user, reason, notes=''):
        """Reject a verification request"""
        profile = verification_request.kyc_profile
        
        # Update verification request
        verification_request.status = KYCVerificationRequest.Status.REJECTED
        verification_request.reviewed_by = admin_user
        verification_request.reviewed_at = timezone.now()
        verification_request.rejection_reason = reason
        verification_request.admin_notes = notes
        verification_request.save()
        
        # Update profile
        profile.status = KYCProfile.Status.REJECTED
        profile.rejection_reason = reason
        profile.save()
        
        KYCAuditLog.objects.create(
            kyc_profile=profile,
            action=KYCAuditLog.Action.VERIFICATION_REJECTED,
            performed_by=admin_user,
            description=f"Verification rejected: {reason}",
            new_value={'reason': reason}
        )
        
        return verification_request
    
    @staticmethod
    def request_more_info(verification_request, admin_user, info_request, notes=''):
        """Request additional information for verification"""
        verification_request.status = KYCVerificationRequest.Status.MORE_INFO
        verification_request.additional_info_request = info_request
        verification_request.admin_notes = notes
        verification_request.save()
        
        # Update profile status
        profile = verification_request.kyc_profile
        profile.status = KYCProfile.Status.NOT_STARTED  # Allow resubmission
        profile.save()
        
        return verification_request
    
    @staticmethod
    def check_withdrawal_limit(user, amount_usd):
        """Check if withdrawal is within user's KYC limits"""
        try:
            profile = user.kyc_profile
            if not profile.current_level:
                return False, "KYC verification required"
            
            daily_limit = profile.get_withdrawal_limit('daily')
            if amount_usd > daily_limit:
                return False, f"Amount exceeds daily limit of ${daily_limit}"
            
            # TODO: Check actual daily withdrawal total
            
            return True, None
        except KYCProfile.DoesNotExist:
            return False, "KYC profile not found"
    
    @staticmethod
    def get_user_limits(user):
        """Get user's current limits based on KYC level"""
        try:
            profile = user.kyc_profile
            level = profile.current_level
            
            if not level:
                return {
                    'daily_withdrawal': Decimal('0'),
                    'monthly_withdrawal': Decimal('0'),
                    'daily_deposit': Decimal('0'),
                    'can_trade': False,
                    'can_withdraw_crypto': False,
                    'can_withdraw_fiat': False
                }
            
            return {
                'daily_withdrawal': level.daily_withdrawal_limit,
                'monthly_withdrawal': level.monthly_withdrawal_limit,
                'daily_deposit': level.daily_deposit_limit,
                'can_trade': level.can_trade,
                'can_withdraw_crypto': level.can_withdraw_crypto,
                'can_withdraw_fiat': level.can_withdraw_fiat
            }
        except KYCProfile.DoesNotExist:
            return {
                'daily_withdrawal': Decimal('0'),
                'monthly_withdrawal': Decimal('0'),
                'daily_deposit': Decimal('0'),
                'can_trade': False,
                'can_withdraw_crypto': False,
                'can_withdraw_fiat': False
            }
SERVICE_EOF

# 5. Create KYC Views
echo "Creating KYC views..."
cat > apps/kyc/views.py << 'VIEWS_EOF'
"""
KYC Views
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from .models import KYCLevel, KYCProfile, KYCDocument, KYCVerificationRequest, KYCAuditLog
from .serializers import (
    KYCLevelSerializer, KYCProfileSerializer, KYCProfileUpdateSerializer,
    KYCDocumentSerializer, KYCDocumentUploadSerializer,
    KYCVerificationRequestSerializer, SubmitVerificationSerializer,
    KYCAuditLogSerializer,
    AdminKYCProfileSerializer, AdminDocumentReviewSerializer, AdminVerificationReviewSerializer
)
from .services.kyc_service import KYCService


# =====================
# User Views
# =====================

class KYCLevelListView(APIView):
    """List all KYC levels and their requirements"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        levels = KYCLevel.objects.all().order_by('daily_withdrawal_limit')
        serializer = KYCLevelSerializer(levels, many=True)
        return Response(serializer.data)


class KYCProfileView(APIView):
    """Get or update user's KYC profile"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        profile = KYCService.get_or_create_profile(request.user)
        serializer = KYCProfileSerializer(profile)
        return Response(serializer.data)
    
    def patch(self, request):
        profile = KYCService.get_or_create_profile(request.user)
        
        # Don't allow updates if verification is pending
        if profile.status == KYCProfile.Status.PENDING:
            return Response(
                {'error': 'Cannot update profile while verification is pending'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = KYCProfileUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            KYCService.update_profile(profile, serializer.validated_data, request)
            return Response(KYCProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class KYCDocumentUploadView(APIView):
    """Upload KYC documents"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        serializer = KYCDocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        profile = KYCService.get_or_create_profile(request.user)
        
        document = KYCService.upload_document(
            profile=profile,
            document_type=serializer.validated_data['document_type'],
            file=serializer.validated_data['file'],
            document_number=serializer.validated_data.get('document_number', ''),
            issuing_country=serializer.validated_data.get('issuing_country', ''),
            issue_date=serializer.validated_data.get('issue_date'),
            expiry_date=serializer.validated_data.get('expiry_date')
        )
        
        return Response(
            KYCDocumentSerializer(document).data,
            status=status.HTTP_201_CREATED
        )


class KYCDocumentListView(APIView):
    """List user's KYC documents"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        profile = KYCService.get_or_create_profile(request.user)
        documents = profile.documents.all()
        serializer = KYCDocumentSerializer(documents, many=True)
        return Response(serializer.data)


class KYCDocumentDeleteView(APIView):
    """Delete a pending KYC document"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, document_id):
        profile = KYCService.get_or_create_profile(request.user)
        document = get_object_or_404(
            KYCDocument,
            id=document_id,
            kyc_profile=profile,
            status=KYCDocument.Status.PENDING
        )
        
        document.file.delete()
        document.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class SubmitVerificationView(APIView):
    """Submit verification request"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = SubmitVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        profile = KYCService.get_or_create_profile(request.user)
        
        # Check if already pending
        if profile.status == KYCProfile.Status.PENDING:
            return Response(
                {'error': 'You already have a pending verification request'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            verification_request = KYCService.submit_verification(
                profile=profile,
                target_level_type=serializer.validated_data['target_level'],
                document_ids=serializer.validated_data.get('document_ids')
            )
            
            return Response(
                KYCVerificationRequestSerializer(verification_request).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class VerificationStatusView(APIView):
    """Get verification request status"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        profile = KYCService.get_or_create_profile(request.user)
        requests = profile.verification_requests.all()[:10]
        serializer = KYCVerificationRequestSerializer(requests, many=True)
        return Response(serializer.data)


class KYCLimitsView(APIView):
    """Get user's current KYC limits"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        limits = KYCService.get_user_limits(request.user)
        return Response({
            'daily_withdrawal_limit': str(limits['daily_withdrawal']),
            'monthly_withdrawal_limit': str(limits['monthly_withdrawal']),
            'daily_deposit_limit': str(limits['daily_deposit']),
            'can_trade': limits['can_trade'],
            'can_withdraw_crypto': limits['can_withdraw_crypto'],
            'can_withdraw_fiat': limits['can_withdraw_fiat']
        })


# =====================
# Admin Views
# =====================

class AdminKYCProfileListView(APIView):
    """Admin: List all KYC profiles"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        status_filter = request.query_params.get('status')
        level_filter = request.query_params.get('level')
        
        profiles = KYCProfile.objects.select_related('user', 'current_level').all()
        
        if status_filter:
            profiles = profiles.filter(status=status_filter)
        if level_filter:
            profiles = profiles.filter(current_level__level=level_filter)
        
        profiles = profiles.order_by('-updated_at')[:100]
        serializer = AdminKYCProfileSerializer(profiles, many=True)
        return Response(serializer.data)


class AdminKYCProfileDetailView(APIView):
    """Admin: Get KYC profile details"""
    permission_classes = [IsAdminUser]
    
    def get(self, request, profile_id):
        profile = get_object_or_404(KYCProfile, id=profile_id)
        serializer = AdminKYCProfileSerializer(profile)
        return Response(serializer.data)


class AdminPendingVerificationsView(APIView):
    """Admin: List pending verification requests"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        pending = KYCVerificationRequest.objects.filter(
            status__in=[
                KYCVerificationRequest.Status.PENDING,
                KYCVerificationRequest.Status.IN_REVIEW
            ]
        ).select_related('kyc_profile__user', 'target_level').order_by('submitted_at')
        
        serializer = KYCVerificationRequestSerializer(pending, many=True)
        return Response(serializer.data)


class AdminDocumentReviewView(APIView):
    """Admin: Review a KYC document"""
    permission_classes = [IsAdminUser]
    
    def post(self, request, document_id):
        document = get_object_or_404(KYCDocument, id=document_id)
        serializer = AdminDocumentReviewSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        
        if action == 'approve':
            document = KYCService.approve_document(
                document=document,
                admin_user=request.user,
                document_number=serializer.validated_data.get('document_number'),
                issuing_country=serializer.validated_data.get('issuing_country'),
                expiry_date=serializer.validated_data.get('expiry_date')
            )
        else:
            document = KYCService.reject_document(
                document=document,
                admin_user=request.user,
                reason=serializer.validated_data['rejection_reason']
            )
        
        return Response(KYCDocumentSerializer(document).data)


class AdminVerificationReviewView(APIView):
    """Admin: Review a verification request"""
    permission_classes = [IsAdminUser]
    
    def post(self, request, request_id):
        verification_request = get_object_or_404(KYCVerificationRequest, id=request_id)
        serializer = AdminVerificationReviewSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        action = serializer.validated_data['action']
        notes = serializer.validated_data.get('admin_notes', '')
        
        if action == 'approve':
            verification_request = KYCService.approve_verification(
                verification_request=verification_request,
                admin_user=request.user,
                notes=notes
            )
        elif action == 'reject':
            verification_request = KYCService.reject_verification(
                verification_request=verification_request,
                admin_user=request.user,
                reason=serializer.validated_data['rejection_reason'],
                notes=notes
            )
        else:  # request_more_info
            verification_request = KYCService.request_more_info(
                verification_request=verification_request,
                admin_user=request.user,
                info_request=serializer.validated_data['additional_info_request'],
                notes=notes
            )
        
        return Response(KYCVerificationRequestSerializer(verification_request).data)


class AdminKYCAuditLogView(APIView):
    """Admin: View KYC audit logs"""
    permission_classes = [IsAdminUser]
    
    def get(self, request, profile_id=None):
        if profile_id:
            logs = KYCAuditLog.objects.filter(kyc_profile_id=profile_id)
        else:
            logs = KYCAuditLog.objects.all()
        
        logs = logs.select_related('performed_by').order_by('-created_at')[:100]
        serializer = KYCAuditLogSerializer(logs, many=True)
        return Response(serializer.data)
VIEWS_EOF

# 6. Create KYC URLs
echo "Creating KYC URLs..."
cat > apps/kyc/urls.py << 'URLS_EOF'
"""
KYC URL Configuration
"""
from django.urls import path
from .views import (
    # User views
    KYCLevelListView,
    KYCProfileView,
    KYCDocumentUploadView,
    KYCDocumentListView,
    KYCDocumentDeleteView,
    SubmitVerificationView,
    VerificationStatusView,
    KYCLimitsView,
    # Admin views
    AdminKYCProfileListView,
    AdminKYCProfileDetailView,
    AdminPendingVerificationsView,
    AdminDocumentReviewView,
    AdminVerificationReviewView,
    AdminKYCAuditLogView,
)

app_name = 'kyc'

urlpatterns = [
    # User endpoints
    path('levels/', KYCLevelListView.as_view(), name='levels'),
    path('profile/', KYCProfileView.as_view(), name='profile'),
    path('documents/', KYCDocumentListView.as_view(), name='document-list'),
    path('documents/upload/', KYCDocumentUploadView.as_view(), name='document-upload'),
    path('documents/<uuid:document_id>/delete/', KYCDocumentDeleteView.as_view(), name='document-delete'),
    path('verify/', SubmitVerificationView.as_view(), name='submit-verification'),
    path('verify/status/', VerificationStatusView.as_view(), name='verification-status'),
    path('limits/', KYCLimitsView.as_view(), name='limits'),
    
    # Admin endpoints
    path('admin/profiles/', AdminKYCProfileListView.as_view(), name='admin-profiles'),
    path('admin/profiles/<uuid:profile_id>/', AdminKYCProfileDetailView.as_view(), name='admin-profile-detail'),
    path('admin/pending/', AdminPendingVerificationsView.as_view(), name='admin-pending'),
    path('admin/documents/<uuid:document_id>/review/', AdminDocumentReviewView.as_view(), name='admin-document-review'),
    path('admin/verify/<uuid:request_id>/review/', AdminVerificationReviewView.as_view(), name='admin-verification-review'),
    path('admin/audit/', AdminKYCAuditLogView.as_view(), name='admin-audit-logs'),
    path('admin/audit/<uuid:profile_id>/', AdminKYCAuditLogView.as_view(), name='admin-profile-audit-logs'),
]
URLS_EOF

# 7. Create app config
echo "Creating app config..."
cat > apps/kyc/apps.py << 'APPS_EOF'
from django.apps import AppConfig


class KycConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.kyc'
    verbose_name = 'KYC/AML'
APPS_EOF

# 8. Create __init__.py
touch apps/kyc/__init__.py

# 9. Update main urls.py to include KYC
echo "Updating main URLs..."
cat > config/urls.py << 'MAINURLS_EOF'
"""
URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # API v1
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/wallets/', include('apps.wallets.urls')),
    path('api/v1/email/', include('emails.urls')),
    path('api/v1/trading/', include('apps.trading.urls')),
    path('api/v1/security/', include('security.urls')),
    path('api/v1/kyc/', include('apps.kyc.urls')),  # KYC endpoints
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
MAINURLS_EOF

# 10. Add KYC app to INSTALLED_APPS
echo "Adding KYC to INSTALLED_APPS..."

# Check if already added
if ! grep -q "'apps.kyc'" config/settings/base.py; then
    sed -i '' "s/'apps.trading',/'apps.trading',\n    'apps.kyc',/" config/settings/base.py
fi

# 11. Create data migration for initial KYC levels
echo "Creating initial data migration..."
cat > apps/kyc/migrations/0002_initial_levels.py << 'DATAMIGRATION_EOF'
"""
Initial KYC Levels Data Migration
"""
from django.db import migrations
from decimal import Decimal


def create_initial_levels(apps, schema_editor):
    KYCLevel = apps.get_model('kyc', 'KYCLevel')
    
    levels = [
        {
            'level': 'unverified',
            'name': 'Unverified',
            'description': 'Basic account with limited features',
            'daily_withdrawal_limit': Decimal('0'),
            'monthly_withdrawal_limit': Decimal('0'),
            'daily_deposit_limit': Decimal('1000'),
            'can_trade': True,
            'can_withdraw_crypto': False,
            'can_withdraw_fiat': False,
            'can_use_p2p': False,
            'requires_email': True,
            'requires_phone': False,
            'requires_id_document': False,
            'requires_selfie': False,
            'requires_proof_of_address': False,
            'requires_source_of_funds': False,
        },
        {
            'level': 'basic',
            'name': 'Basic Verified',
            'description': 'Email and phone verified',
            'daily_withdrawal_limit': Decimal('2000'),
            'monthly_withdrawal_limit': Decimal('10000'),
            'daily_deposit_limit': Decimal('5000'),
            'can_trade': True,
            'can_withdraw_crypto': True,
            'can_withdraw_fiat': False,
            'can_use_p2p': False,
            'requires_email': True,
            'requires_phone': True,
            'requires_id_document': False,
            'requires_selfie': False,
            'requires_proof_of_address': False,
            'requires_source_of_funds': False,
        },
        {
            'level': 'intermediate',
            'name': 'Intermediate Verified',
            'description': 'ID document verified',
            'daily_withdrawal_limit': Decimal('50000'),
            'monthly_withdrawal_limit': Decimal('200000'),
            'daily_deposit_limit': Decimal('50000'),
            'can_trade': True,
            'can_withdraw_crypto': True,
            'can_withdraw_fiat': True,
            'can_use_p2p': True,
            'requires_email': True,
            'requires_phone': True,
            'requires_id_document': True,
            'requires_selfie': True,
            'requires_proof_of_address': False,
            'requires_source_of_funds': False,
        },
        {
            'level': 'advanced',
            'name': 'Advanced Verified',
            'description': 'Full verification with proof of address',
            'daily_withdrawal_limit': Decimal('500000'),
            'monthly_withdrawal_limit': Decimal('2000000'),
            'daily_deposit_limit': Decimal('500000'),
            'can_trade': True,
            'can_withdraw_crypto': True,
            'can_withdraw_fiat': True,
            'can_use_p2p': True,
            'requires_email': True,
            'requires_phone': True,
            'requires_id_document': True,
            'requires_selfie': True,
            'requires_proof_of_address': True,
            'requires_source_of_funds': True,
        },
    ]
    
    for level_data in levels:
        KYCLevel.objects.create(**level_data)


def remove_initial_levels(apps, schema_editor):
    KYCLevel = apps.get_model('kyc', 'KYCLevel')
    KYCLevel.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('kyc', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_initial_levels, remove_initial_levels),
    ]
DATAMIGRATION_EOF

# 12. Run migrations
echo "Running migrations..."
python manage.py makemigrations kyc
python manage.py migrate

# 13. Commit and push
echo "Committing changes..."
git add -A
git commit -m "Phase 12: KYC/AML Compliance System - Identity verification, document upload, limits"
git push origin main

echo ""
echo "============================================"
echo "✅ PHASE 12 COMPLETE: KYC/AML Compliance"
echo "============================================"
echo ""
echo "New API Endpoints:"
echo ""
echo "USER ENDPOINTS:"
echo "  GET  /api/v1/kyc/levels/              - List KYC levels & requirements"
echo "  GET  /api/v1/kyc/profile/             - Get your KYC profile"
echo "  PATCH /api/v1/kyc/profile/            - Update personal information"
echo "  GET  /api/v1/kyc/documents/           - List your documents"
echo "  POST /api/v1/kyc/documents/upload/    - Upload a document"
echo "  DELETE /api/v1/kyc/documents/{id}/    - Delete pending document"
echo "  POST /api/v1/kyc/verify/              - Submit verification request"
echo "  GET  /api/v1/kyc/verify/status/       - Check verification status"
echo "  GET  /api/v1/kyc/limits/              - Get your current limits"
echo ""
echo "ADMIN ENDPOINTS:"
echo "  GET  /api/v1/kyc/admin/profiles/      - List all KYC profiles"
echo "  GET  /api/v1/kyc/admin/profiles/{id}/ - Get profile details"
echo "  GET  /api/v1/kyc/admin/pending/       - List pending verifications"
echo "  POST /api/v1/kyc/admin/documents/{id}/review/ - Review document"
echo "  POST /api/v1/kyc/admin/verify/{id}/review/    - Review verification"
echo "  GET  /api/v1/kyc/admin/audit/         - View audit logs"
echo ""
echo "KYC LEVELS:"
echo "  Unverified:   \$0/day withdrawal, can trade only"
echo "  Basic:        \$2,000/day, crypto withdrawals"
echo "  Intermediate: \$50,000/day, fiat + P2P"
echo "  Advanced:     \$500,000/day, full access"
echo ""
