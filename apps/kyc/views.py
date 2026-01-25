"""
KYC Views
=========
API endpoints for KYC/AML compliance
"""
import hashlib
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser

from .models import KYCLevel, KYCProfile, KYCDocument, KYCVerificationRequest, KYCAuditLog
from .serializers import (
    KYCLevelSerializer, KYCProfileSerializer, KYCProfileUpdateSerializer,
    KYCDocumentSerializer, KYCVerificationRequestSerializer, KYCAuditLogSerializer,
    DocumentUploadSerializer, VerificationSubmitSerializer,
    AdminDocumentReviewSerializer, AdminVerificationReviewSerializer
)


def get_client_ip(request):
    """Get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def create_audit_log(kyc_profile, action, performed_by, request, details=None):
    """Create KYC audit log entry"""
    KYCAuditLog.objects.create(
        kyc_profile=kyc_profile,
        action=action,
        performed_by=performed_by,
        details=details or {},
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
    )


class KYCLevelListView(APIView):
    """List all KYC levels and their requirements"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        levels = KYCLevel.objects.all()
        serializer = KYCLevelSerializer(levels, many=True)
        return Response(serializer.data)


class KYCProfileView(APIView):
    """Get or update user's KYC profile"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        profile, created = KYCProfile.objects.get_or_create(
            user=request.user,
            defaults={'current_level': KYCLevel.objects.filter(level=0).first()}
        )
        
        if created:
            create_audit_log(profile, 'profile_created', request.user, request)
        
        serializer = KYCProfileSerializer(profile)
        return Response(serializer.data)
    
    def patch(self, request):
        profile, _ = KYCProfile.objects.get_or_create(user=request.user)
        
        serializer = KYCProfileUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            create_audit_log(
                profile, 'profile_updated', request.user, request,
                details={'updated_fields': list(request.data.keys())}
            )
            
            return Response(KYCProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class KYCDocumentListView(APIView):
    """List user's KYC documents"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        profile = KYCProfile.objects.filter(user=request.user).first()
        if not profile:
            return Response([])
        
        documents = profile.documents.all()
        serializer = KYCDocumentSerializer(documents, many=True)
        return Response(serializer.data)


class KYCDocumentUploadView(APIView):
    """Upload a KYC document"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        profile, _ = KYCProfile.objects.get_or_create(user=request.user)
        
        # Calculate file hash for integrity
        file = serializer.validated_data['file']
        file_hash = hashlib.sha256(file.read()).hexdigest()
        file.seek(0)  # Reset file pointer
        
        # Check for duplicate
        existing = KYCDocument.objects.filter(
            kyc_profile=profile,
            document_type=serializer.validated_data['document_type'],
            status='pending'
        ).first()
        
        if existing:
            # Replace pending document
            existing.file.delete()
            existing.delete()
        
        document = KYCDocument.objects.create(
            kyc_profile=profile,
            document_type=serializer.validated_data['document_type'],
            file=file,
            file_hash=file_hash
        )
        
        create_audit_log(
            profile, 'document_uploaded', request.user, request,
            details={'document_type': document.document_type, 'document_id': str(document.id)}
        )
        
        return Response(KYCDocumentSerializer(document).data, status=status.HTTP_201_CREATED)


class KYCDocumentDeleteView(APIView):
    """Delete a pending KYC document"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, document_id):
        document = KYCDocument.objects.filter(
            id=document_id,
            kyc_profile__user=request.user,
            status='pending'
        ).first()
        
        if not document:
            return Response(
                {'error': 'Document not found or cannot be deleted'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        document.file.delete()
        document.delete()
        
        return Response({'message': 'Document deleted'})


class KYCVerificationSubmitView(APIView):
    """Submit verification request"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = VerificationSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        profile = KYCProfile.objects.filter(user=request.user).first()
        if not profile:
            return Response(
                {'error': 'Please complete your profile first'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        target_level = KYCLevel.objects.filter(level=serializer.validated_data['target_level']).first()
        if not target_level:
            return Response(
                {'error': 'Invalid target level'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already at or above target level
        if profile.current_level and profile.current_level.level >= target_level.level:
            return Response(
                {'error': 'Already at or above target level'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for pending request
        pending = KYCVerificationRequest.objects.filter(
            kyc_profile=profile,
            status__in=['pending', 'under_review']
        ).exists()
        
        if pending:
            return Response(
                {'error': 'You already have a pending verification request'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check required documents
        required_docs = target_level.required_documents
        uploaded_docs = list(profile.documents.filter(status='approved').values_list('document_type', flat=True))
        
        missing_docs = [doc for doc in required_docs if doc not in uploaded_docs]
        if missing_docs:
            return Response(
                {'error': f'Missing required documents: {", ".join(missing_docs)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create verification request
        request_type = ['', 'basic', 'intermediate', 'advanced'][target_level.level]
        verification_request = KYCVerificationRequest.objects.create(
            kyc_profile=profile,
            request_type=request_type,
            target_level=target_level
        )
        
        profile.status = 'pending'
        profile.save()
        
        create_audit_log(
            profile, 'verification_submitted', request.user, request,
            details={'target_level': target_level.level, 'request_id': str(verification_request.id)}
        )
        
        return Response(KYCVerificationRequestSerializer(verification_request).data, status=status.HTTP_201_CREATED)


class KYCVerificationStatusView(APIView):
    """Get verification request status"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        profile = KYCProfile.objects.filter(user=request.user).first()
        if not profile:
            return Response({'requests': []})
        
        requests = profile.verification_requests.all()[:5]
        serializer = KYCVerificationRequestSerializer(requests, many=True)
        return Response({'requests': serializer.data})


class KYCLimitsView(APIView):
    """Get user's current KYC limits"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        profile = KYCProfile.objects.filter(user=request.user).first()
        if not profile:
            return Response({
                'level': 0,
                'level_name': 'Unverified',
                'limits': {
                    'daily_withdrawal': 0,
                    'monthly_withdrawal': 0,
                    'daily_deposit': 0,
                    'can_trade': False,
                    'can_withdraw_crypto': False,
                    'can_withdraw_fiat': False,
                    'can_deposit_fiat': False,
                }
            })
        
        limits = profile.get_limits()
        return Response({
            'level': profile.current_level.level if profile.current_level else 0,
            'level_name': profile.current_level.name if profile.current_level else 'Unverified',
            'limits': limits
        })


# ============================================
# ADMIN VIEWS
# ============================================

class AdminKYCProfileListView(APIView):
    """Admin: List all KYC profiles"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        status_filter = request.query_params.get('status')
        profiles = KYCProfile.objects.select_related('user', 'current_level').all()
        
        if status_filter:
            profiles = profiles.filter(status=status_filter)
        
        serializer = KYCProfileSerializer(profiles, many=True)
        return Response(serializer.data)


class AdminKYCProfileDetailView(APIView):
    """Admin: Get KYC profile details"""
    permission_classes = [IsAdminUser]
    
    def get(self, request, profile_id):
        profile = KYCProfile.objects.filter(id=profile_id).first()
        if not profile:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = KYCProfileSerializer(profile)
        return Response(serializer.data)


class AdminPendingVerificationsView(APIView):
    """Admin: List pending verifications"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        pending = KYCVerificationRequest.objects.filter(
            status__in=['pending', 'under_review']
        ).select_related('kyc_profile__user', 'target_level')
        
        serializer = KYCVerificationRequestSerializer(pending, many=True)
        return Response(serializer.data)


class AdminDocumentReviewView(APIView):
    """Admin: Review a document"""
    permission_classes = [IsAdminUser]
    
    def post(self, request, document_id):
        serializer = AdminDocumentReviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        document = KYCDocument.objects.filter(id=document_id).first()
        if not document:
            return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)
        
        action = serializer.validated_data['action']
        
        if action == 'approve':
            document.status = 'approved'
            document.reviewed_by = request.user
            document.reviewed_at = timezone.now()
            document.save()
            
            create_audit_log(
                document.kyc_profile, 'document_approved', request.user, request,
                details={'document_id': str(document.id), 'document_type': document.document_type}
            )
        else:
            document.status = 'rejected'
            document.rejection_reason = serializer.validated_data.get('rejection_reason', '')
            document.reviewed_by = request.user
            document.reviewed_at = timezone.now()
            document.save()
            
            create_audit_log(
                document.kyc_profile, 'document_rejected', request.user, request,
                details={
                    'document_id': str(document.id),
                    'document_type': document.document_type,
                    'reason': document.rejection_reason
                }
            )
        
        return Response(KYCDocumentSerializer(document).data)


class AdminVerificationReviewView(APIView):
    """Admin: Review a verification request"""
    permission_classes = [IsAdminUser]
    
    @transaction.atomic
    def post(self, request, request_id):
        serializer = AdminVerificationReviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        verification = KYCVerificationRequest.objects.filter(id=request_id).first()
        if not verification:
            return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)
        
        action = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')
        
        if action == 'approve':
            verification.status = 'approved'
            verification.reviewer = request.user
            verification.review_notes = notes
            verification.reviewed_at = timezone.now()
            verification.save()
            
            # Upgrade user's KYC level
            profile = verification.kyc_profile
            old_level = profile.current_level.level if profile.current_level else 0
            profile.current_level = verification.target_level
            profile.status = 'verified'
            profile.verified_at = timezone.now()
            profile.verified_by = request.user
            profile.save()
            
            create_audit_log(
                profile, 'verification_approved', request.user, request,
                details={
                    'request_id': str(verification.id),
                    'old_level': old_level,
                    'new_level': verification.target_level.level
                }
            )
            
            create_audit_log(
                profile, 'level_upgraded', request.user, request,
                details={
                    'old_level': old_level,
                    'new_level': verification.target_level.level
                }
            )
        else:
            verification.status = 'rejected'
            verification.reviewer = request.user
            verification.review_notes = notes
            verification.reviewed_at = timezone.now()
            verification.save()
            
            profile = verification.kyc_profile
            profile.status = 'rejected'
            profile.rejection_reason = notes
            profile.save()
            
            create_audit_log(
                profile, 'verification_rejected', request.user, request,
                details={'request_id': str(verification.id), 'reason': notes}
            )
        
        return Response(KYCVerificationRequestSerializer(verification).data)


class AdminKYCAuditLogView(APIView):
    """Admin: View KYC audit logs"""
    permission_classes = [IsAdminUser]
    
    def get(self, request, profile_id=None):
        if profile_id:
            logs = KYCAuditLog.objects.filter(kyc_profile_id=profile_id)
        else:
            logs = KYCAuditLog.objects.all()[:100]
        
        serializer = KYCAuditLogSerializer(logs, many=True)
        return Response(serializer.data)
