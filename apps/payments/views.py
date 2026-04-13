"""
Payment Views
=============
API endpoints for fiat and crypto payments
"""
import json
from decimal import Decimal
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .models import (
    PaymentMethod, FiatDeposit, FiatWithdrawal,
    CryptoDeposit, CryptoWithdrawal
)
from .serializers import (
    PaymentMethodSerializer, FiatDepositSerializer, FiatWithdrawalSerializer,
    CryptoDepositSerializer, CryptoWithdrawalSerializer,
    CreateFiatDepositSerializer, CreateFiatWithdrawalSerializer,
    CreateCryptoWithdrawalSerializer
)


class PaymentMethodListView(APIView):
    """List and create payment methods"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        methods = PaymentMethod.objects.filter(user=request.user, is_active=True)
        serializer = PaymentMethodSerializer(methods, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = PaymentMethodSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PaymentMethodDetailView(APIView):
    """Manage individual payment method"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, method_id):
        method = PaymentMethod.objects.filter(
            id=method_id, user=request.user
        ).first()
        
        if not method:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        
        method.is_active = False
        method.save()
        return Response({'message': 'Payment method removed'})


# ============================================
# FIAT DEPOSIT VIEWS
# ============================================

class FiatDepositCreateView(APIView):
    """Create a fiat deposit order"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CreateFiatDepositSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        amount = serializer.validated_data['amount']
        
        # Check KYC limits
        from apps.kyc.models import KYCProfile
        kyc_profile = KYCProfile.objects.filter(user=request.user).first()
        
        if kyc_profile and kyc_profile.current_level:
            limits = kyc_profile.get_limits()
            if not limits.get('can_deposit_fiat', False):
                return Response(
                    {'error': 'Fiat deposits require KYC verification'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        try:
            from .services.razorpay_service import RazorpayService
            razorpay = RazorpayService()
            result = razorpay.create_deposit_order(request.user, amount)
            
            return Response({
                'deposit_id': str(result['deposit'].id),
                'razorpay_order_id': result['razorpay_order_id'],
                'razorpay_key': result['razorpay_key'],
                'amount': result['amount'],
                'currency': result['currency'],
                'name': result['name'],
                'description': result['description'],
                'prefill': result['prefill']
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FiatDepositVerifyView(APIView):
    """Verify and complete fiat deposit"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response(
                {'error': 'Missing payment details'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .services.razorpay_service import RazorpayService
            razorpay = RazorpayService()
            
            # Get current exchange rate (you'd fetch this from an API)
            exchange_rate = Decimal('83.50')  # Example: 1 USD = 83.50 INR
            
            deposit = razorpay.complete_deposit(
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                exchange_rate
            )
            
            return Response(FiatDepositSerializer(deposit).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': 'Payment verification failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FiatDepositListView(APIView):
    """List user's fiat deposits"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        deposits = FiatDeposit.objects.filter(user=request.user)[:50]
        serializer = FiatDepositSerializer(deposits, many=True)
        return Response(serializer.data)


# ============================================
# FIAT WITHDRAWAL VIEWS
# ============================================

class FiatWithdrawalCreateView(APIView):
    """Create a fiat withdrawal request"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CreateFiatWithdrawalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Check KYC
        from apps.kyc.models import KYCProfile
        kyc_profile = KYCProfile.objects.filter(user=request.user).first()
        
        if not kyc_profile or not kyc_profile.current_level:
            return Response(
                {'error': 'KYC verification required for withdrawals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        limits = kyc_profile.get_limits()
        if not limits.get('can_withdraw_fiat', False):
            return Response(
                {'error': 'Your KYC level does not allow fiat withdrawals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get payment method
        payment_method = PaymentMethod.objects.filter(
            id=serializer.validated_data['payment_method_id'],
            user=request.user,
            is_active=True,
            method_type__in=['bank_account', 'upi']
        ).first()
        
        if not payment_method:
            return Response(
                {'error': 'Invalid payment method'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        amount_inr = serializer.validated_data['amount']
        source_currency = serializer.validated_data.get('source_currency', 'USDT')
        
        # Get exchange rate
        exchange_rate = Decimal('83.50')  # Example rate
        source_amount = (amount_inr / exchange_rate).quantize(Decimal('0.00000001'))
        
        # Check balance
        from apps.wallets.models import Balance
        balance = Balance.objects.filter(
            user=request.user,
            currency__symbol=source_currency
        ).first()
        
        if not balance or balance.available < source_amount:
            return Response(
                {'error': 'Insufficient balance'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate fee (1%)
        fee = (amount_inr * Decimal('0.01')).quantize(Decimal('0.01'))
        net_amount = amount_inr - fee
        
        # Lock balance
        balance.available -= source_amount
        balance.locked += source_amount
        balance.save()
        
        # Create withdrawal
        withdrawal = FiatWithdrawal.objects.create(
            user=request.user,
            payment_method=payment_method,
            amount=amount_inr,
            fee=fee,
            net_amount=net_amount,
            source_currency=source_currency,
            source_amount=source_amount,
            exchange_rate=exchange_rate,
            status='pending'
        )
        
        return Response(FiatWithdrawalSerializer(withdrawal).data, status=status.HTTP_201_CREATED)


class FiatWithdrawalListView(APIView):
    """List user's fiat withdrawals"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        withdrawals = FiatWithdrawal.objects.filter(user=request.user)[:50]
        serializer = FiatWithdrawalSerializer(withdrawals, many=True)
        return Response(serializer.data)


# ============================================
# CRYPTO DEPOSIT VIEWS
# ============================================

class CryptoDepositAddressView(APIView):
    """Get deposit address for user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        chain = request.query_params.get('chain', 'ethereum')
        currency = request.query_params.get('currency', 'ETH')
        
        # In production, generate unique deposit address per user
        # For now, return the hot wallet address
        from django.conf import settings
        deposit_address = getattr(settings, 'DEPOSIT_WALLET_ADDRESS', '0x...')
        
        return Response({
            'address': deposit_address,
            'chain': chain,
            'currency': currency,
            'minimum_deposit': '0.001' if currency in ['ETH', 'BNB', 'MATIC'] else '10',
            'confirmations_required': 12 if chain == 'ethereum' else 15
        })


class CryptoDepositSubmitView(APIView):
    """Submit a crypto deposit transaction for verification"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        tx_hash = request.data.get('tx_hash')
        chain = request.data.get('chain', 'ethereum')
        currency = request.data.get('currency', 'ETH')
        
        if not tx_hash:
            return Response(
                {'error': 'Transaction hash required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .services.blockchain_service import BlockchainService
            blockchain = BlockchainService(chain=chain)
            deposit = blockchain.process_deposit(request.user, tx_hash, currency)
            
            return Response(CryptoDepositSerializer(deposit).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': 'Failed to process deposit'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CryptoDepositListView(APIView):
    """List user's crypto deposits"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        deposits = CryptoDeposit.objects.filter(user=request.user)[:50]
        serializer = CryptoDepositSerializer(deposits, many=True)
        return Response(serializer.data)


# ============================================
# CRYPTO WITHDRAWAL VIEWS
# ============================================

class CryptoWithdrawalCreateView(APIView):
    """Create a crypto withdrawal request"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CreateCryptoWithdrawalSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Check KYC
        from apps.kyc.models import KYCProfile
        kyc_profile = KYCProfile.objects.filter(user=request.user).first()
        
        if not kyc_profile or not kyc_profile.current_level:
            return Response(
                {'error': 'KYC verification required for withdrawals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        limits = kyc_profile.get_limits()
        if not limits.get('can_withdraw_crypto', False):
            return Response(
                {'error': 'Your KYC level does not allow crypto withdrawals'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from .services.blockchain_service import BlockchainService
            chain = serializer.validated_data.get('chain', 'ethereum')
            blockchain = BlockchainService(chain=chain)
            
            withdrawal = blockchain.create_withdrawal(
                request.user,
                serializer.validated_data['currency'],
                serializer.validated_data['amount'],
                serializer.validated_data['to_address']
            )
            
            return Response(CryptoWithdrawalSerializer(withdrawal).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CryptoWithdrawalListView(APIView):
    """List user's crypto withdrawals"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        withdrawals = CryptoWithdrawal.objects.filter(user=request.user)[:50]
        serializer = CryptoWithdrawalSerializer(withdrawals, many=True)
        return Response(serializer.data)


# ============================================
# RAZORPAY WEBHOOK
# ============================================

@method_decorator(csrf_exempt, name='dispatch')
class RazorpayWebhookView(APIView):
    """Handle Razorpay webhooks"""
    permission_classes = []
    authentication_classes = []
    
    def post(self, request):
        payload = request.body
        signature = request.headers.get('X-Razorpay-Signature')
        
        if not signature:
            return Response({'error': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .services.razorpay_service import RazorpayService
            razorpay = RazorpayService()
            
            if not razorpay.verify_webhook_signature(payload, signature):
                return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
            
            event = json.loads(payload)
            event_type = event.get('event')
            
            if event_type == 'payment.captured':
                # Payment successful - handled by verify endpoint
                pass
            elif event_type == 'payment.failed':
                # Handle failed payment
                payment_entity = event['payload']['payment']['entity']
                order_id = payment_entity.get('order_id')
                
                if order_id:
                    deposit = FiatDeposit.objects.filter(razorpay_order_id=order_id).first()
                    if deposit and deposit.status == 'pending':
                        deposit.status = 'failed'
                        deposit.failure_reason = payment_entity.get('error_description', 'Payment failed')
                        deposit.save()
            
            return Response({'status': 'ok'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# ADMIN VIEWS
# ============================================

class AdminPendingWithdrawalsView(APIView):
    """Admin: List pending withdrawals"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        fiat_withdrawals = FiatWithdrawal.objects.filter(status='pending')
        crypto_withdrawals = CryptoWithdrawal.objects.filter(status='pending')
        
        return Response({
            'fiat': FiatWithdrawalSerializer(fiat_withdrawals, many=True).data,
            'crypto': CryptoWithdrawalSerializer(crypto_withdrawals, many=True).data
        })


class AdminProcessFiatWithdrawalView(APIView):
    """Admin: Process a fiat withdrawal"""
    permission_classes = [IsAdminUser]
    
    def post(self, request, withdrawal_id):
        action = request.data.get('action')  # 'approve' or 'reject'
        utr_number = request.data.get('utr_number', '')
        
        withdrawal = FiatWithdrawal.objects.filter(id=withdrawal_id).first()
        if not withdrawal:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if withdrawal.status != 'pending':
            return Response({'error': 'Already processed'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.utils import timezone
        from apps.wallets.models import Balance, BalanceTransaction
        
        if action == 'approve':
            withdrawal.status = 'completed'
            withdrawal.utr_number = utr_number
            withdrawal.processed_by = request.user
            withdrawal.processed_at = timezone.now()
            withdrawal.save()
            
            # Deduct from locked balance
            balance = Balance.objects.filter(
                user=withdrawal.user,
                currency__symbol=withdrawal.source_currency
            ).first()
            
            if balance:
                balance.locked -= withdrawal.source_amount
                balance.save()
                
                BalanceTransaction.objects.create(
                    balance=balance,
                    transaction_type='withdrawal',
                    amount=-withdrawal.source_amount,
                    balance_after=balance.available,
                    reference_type='fiat_withdrawal',
                    reference_id=str(withdrawal.id),
                    description=f'Fiat withdrawal: {withdrawal.amount} INR'
                )
        else:
            withdrawal.status = 'cancelled'
            withdrawal.failure_reason = request.data.get('reason', 'Rejected by admin')
            withdrawal.processed_by = request.user
            withdrawal.processed_at = timezone.now()
            withdrawal.save()
            
            # Return locked balance
            balance = Balance.objects.filter(
                user=withdrawal.user,
                currency__symbol=withdrawal.source_currency
            ).first()
            
            if balance:
                balance.locked -= withdrawal.source_amount
                balance.available += withdrawal.source_amount
                balance.save()
        
        return Response(FiatWithdrawalSerializer(withdrawal).data)


class AdminProcessCryptoWithdrawalView(APIView):
    """Admin: Process a crypto withdrawal"""
    permission_classes = [IsAdminUser]
    
    def post(self, request, withdrawal_id):
        action = request.data.get('action')  # 'broadcast' or 'reject'
        
        withdrawal = CryptoWithdrawal.objects.filter(id=withdrawal_id).first()
        if not withdrawal:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if withdrawal.status != 'pending':
            return Response({'error': 'Already processed'}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.utils import timezone
        from apps.wallets.models import Balance, BalanceTransaction
        
        if action == 'broadcast':
            try:
                from .services.blockchain_service import BlockchainService
                blockchain = BlockchainService(chain=withdrawal.chain)
                tx_hash = blockchain.broadcast_withdrawal(withdrawal)
                
                return Response({
                    'status': 'broadcast',
                    'tx_hash': tx_hash,
                    'withdrawal': CryptoWithdrawalSerializer(withdrawal).data
                })
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            withdrawal.status = 'cancelled'
            withdrawal.failure_reason = request.data.get('reason', 'Rejected by admin')
            withdrawal.save()
            
            # Return locked balance
            balance = Balance.objects.filter(
                user=withdrawal.user,
                currency__symbol=withdrawal.currency
            ).first()
            
            if balance:
                balance.locked -= withdrawal.amount
                balance.available += withdrawal.amount
                balance.save()
            
            return Response(CryptoWithdrawalSerializer(withdrawal).data)
