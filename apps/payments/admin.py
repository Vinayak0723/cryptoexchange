from django.contrib import admin
from .models import (
    PaymentMethod, FiatDeposit, FiatWithdrawal,
    CryptoDeposit, CryptoWithdrawal, PaymentAuditLog
)


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ['user', 'method_type', 'is_verified', 'is_primary', 'created_at']
    list_filter = ['method_type', 'is_verified', 'is_active']
    search_fields = ['user__email']


@admin.register(FiatDeposit)
class FiatDepositAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['status', 'currency']
    search_fields = ['user__email', 'razorpay_order_id']
    readonly_fields = ['id', 'created_at', 'completed_at']


@admin.register(FiatWithdrawal)
class FiatWithdrawalAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['status', 'currency']
    search_fields = ['user__email']
    readonly_fields = ['id', 'created_at', 'processed_at']


@admin.register(CryptoDeposit)
class CryptoDepositAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'currency', 'chain', 'status', 'created_at']
    list_filter = ['status', 'currency', 'chain']
    search_fields = ['user__email', 'tx_hash']
    readonly_fields = ['id', 'created_at', 'credited_at']


@admin.register(CryptoWithdrawal)
class CryptoWithdrawalAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'currency', 'chain', 'status', 'created_at']
    list_filter = ['status', 'currency', 'chain']
    search_fields = ['user__email', 'tx_hash', 'to_address']
    readonly_fields = ['id', 'created_at', 'broadcast_at', 'completed_at']


@admin.register(PaymentAuditLog)
class PaymentAuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'amount', 'currency', 'created_at']
    list_filter = ['action']
    search_fields = ['user__email']
    readonly_fields = ['id', 'created_at']
