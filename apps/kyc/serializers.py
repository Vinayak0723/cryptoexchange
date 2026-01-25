"""
KYC Serializers
===============
"""
from rest_framework import serializers
from .models import KYCLevel, KYCProfile, KYCDocument, KYCVerificationRequest, KYCAuditLog


class KYCLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCLevel
        fields = [
            'id', 'name', 'level', 'description',
            'daily_withdrawal_limit', 'monthly_withdrawal_limit', 'daily_deposit_limit',
            'can_trade', 'can_withdraw_crypto', 'can_withdraw_fiat', 'can_deposit_fiat',
            'required_documents'
        ]


class KYCDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCDocument
        fields = [
            'id', 'document_type', 'file', 'status',
            'rejection_reason', 'uploaded_at', 'reviewed_at'
        ]
        read_only_fields = ['id', 'status', 'rejection_reason', 'uploaded_at', 'reviewed_at']


class KYCProfileSerializer(serializers.ModelSerializer):
    current_level = KYCLevelSerializer(read_only=True)
    documents = KYCDocumentSerializer(many=True, read_only=True)
    limits = serializers.SerializerMethodField()
    
    class Meta:
        model = KYCProfile
        fields = [
            'id', 'status', 'current_level',
            'first_name', 'last_name', 'date_of_birth', 'nationality',
            'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
            'id_type', 'id_number', 'id_expiry',
            'tax_id', 'tax_country',
            'documents', 'limits',
            'created_at', 'updated_at', 'verified_at'
        ]
        read_only_fields = ['id', 'status', 'current_level', 'verified_at', 'created_at', 'updated_at']
    
    def get_limits(self, obj):
        return obj.get_limits()


class KYCProfileUpdateSerializer(serializers.ModelSerializer):
    """For updating personal information"""
    class Meta:
        model = KYCProfile
        fields = [
            'first_name', 'last_name', 'date_of_birth', 'nationality',
            'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
            'id_type', 'id_number', 'id_expiry',
            'tax_id', 'tax_country'
        ]


class KYCVerificationRequestSerializer(serializers.ModelSerializer):
    target_level = KYCLevelSerializer(read_only=True)
    
    class Meta:
        model = KYCVerificationRequest
        fields = [
            'id', 'request_type', 'target_level', 'status',
            'review_notes', 'submitted_at', 'reviewed_at'
        ]
        read_only_fields = ['id', 'status', 'review_notes', 'submitted_at', 'reviewed_at']


class KYCAuditLogSerializer(serializers.ModelSerializer):
    performed_by_email = serializers.CharField(source='performed_by.email', read_only=True)
    
    class Meta:
        model = KYCAuditLog
        fields = [
            'id', 'action', 'performed_by_email', 'details',
            'ip_address', 'created_at'
        ]


class DocumentUploadSerializer(serializers.Serializer):
    """For uploading documents"""
    document_type = serializers.ChoiceField(choices=KYCDocument.DOCUMENT_TYPES)
    file = serializers.FileField()
    
    def validate_file(self, value):
        # Max 10MB
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size must be less than 10MB")
        return value


class VerificationSubmitSerializer(serializers.Serializer):
    """For submitting verification request"""
    target_level = serializers.IntegerField(min_value=1, max_value=3)


class AdminDocumentReviewSerializer(serializers.Serializer):
    """For admin document review"""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)


class AdminVerificationReviewSerializer(serializers.Serializer):
    """For admin verification review"""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    notes = serializers.CharField(required=False, allow_blank=True)
