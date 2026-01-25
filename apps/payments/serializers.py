"""
Payment Serializers
===================
"""
from decimal import Decimal
from rest_framework import serializers
from .models import (
    PaymentMethod, FiatDeposit, FiatWithdrawal,
    CryptoDeposit, CryptoWithdrawal
)


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'method_type', 'bank_name', 'account_number_last4',
            'ifsc_code', 'account_holder_name', 'upi_id',
            'wallet_address', 'chain', 'is_verified', 'is_primary', 'created_at'
        ]
        read_only_fields = ['id', 'is_verified', 'created_at']


class FiatDepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = FiatDeposit
        fields = [
            'id', 'amount', 'currency', 'fee', 'net_amount',
            'razorpay_order_id', 'payment_method', 'status',
            'credited_currency', 'credited_amount', 'exchange_rate',
            'created_at', 'completed_at'
        ]


class FiatWithdrawalSerializer(serializers.ModelSerializer):
    payment_method = PaymentMethodSerializer(read_only=True)
    
    class Meta:
        model = FiatWithdrawal
        fields = [
            'id', 'payment_method', 'amount', 'currency', 'fee', 'net_amount',
            'source_currency', 'source_amount', 'exchange_rate',
            'utr_number', 'status', 'failure_reason',
            'created_at', 'processed_at'
        ]


class CryptoDepositSerializer(serializers.ModelSerializer):
    class Meta:
        model = CryptoDeposit
        fields = [
            'id', 'currency', 'amount', 'chain', 'tx_hash',
            'from_address', 'confirmations', 'required_confirmations',
            'status', 'created_at', 'credited_at'
        ]


class CryptoWithdrawalSerializer(serializers.ModelSerializer):
    class Meta:
        model = CryptoWithdrawal
        fields = [
            'id', 'currency', 'amount', 'fee', 'net_amount',
            'chain', 'to_address', 'tx_hash', 'status',
            'failure_reason', 'created_at', 'broadcast_at', 'completed_at'
        ]


class CreateFiatDepositSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=18, decimal_places=2, min_value=Decimal('100'))


class CreateFiatWithdrawalSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=18, decimal_places=2, min_value=Decimal('500'))
    payment_method_id = serializers.UUIDField()
    source_currency = serializers.CharField(default='USDT')


class CreateCryptoWithdrawalSerializer(serializers.Serializer):
    currency = serializers.CharField(max_length=10)
    amount = serializers.DecimalField(max_digits=18, decimal_places=8)
    to_address = serializers.CharField(max_length=100)
    chain = serializers.CharField(max_length=20, default='ethereum')
