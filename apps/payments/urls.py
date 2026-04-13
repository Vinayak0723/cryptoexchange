"""
Payment URLs
============
"""
from django.urls import path
from .views import (
    PaymentMethodListView, PaymentMethodDetailView,
    FiatDepositCreateView, FiatDepositVerifyView, FiatDepositListView,
    FiatWithdrawalCreateView, FiatWithdrawalListView,
    CryptoDepositAddressView, CryptoDepositSubmitView, CryptoDepositListView,
    CryptoWithdrawalCreateView, CryptoWithdrawalListView,
    RazorpayWebhookView,
    AdminPendingWithdrawalsView, AdminProcessFiatWithdrawalView, AdminProcessCryptoWithdrawalView
)

app_name = 'payments'

urlpatterns = [
    # Payment methods
    path('methods/', PaymentMethodListView.as_view(), name='methods-list'),
    path('methods/<uuid:method_id>/', PaymentMethodDetailView.as_view(), name='methods-detail'),
    
    # Fiat deposits
    path('fiat/deposit/', FiatDepositCreateView.as_view(), name='fiat-deposit-create'),
    path('fiat/deposit/verify/', FiatDepositVerifyView.as_view(), name='fiat-deposit-verify'),
    path('fiat/deposits/', FiatDepositListView.as_view(), name='fiat-deposits-list'),
    
    # Fiat withdrawals
    path('fiat/withdraw/', FiatWithdrawalCreateView.as_view(), name='fiat-withdrawal-create'),
    path('fiat/withdrawals/', FiatWithdrawalListView.as_view(), name='fiat-withdrawals-list'),
    
    # Crypto deposits
    path('crypto/deposit/address/', CryptoDepositAddressView.as_view(), name='crypto-deposit-address'),
    path('crypto/deposit/submit/', CryptoDepositSubmitView.as_view(), name='crypto-deposit-submit'),
    path('crypto/deposits/', CryptoDepositListView.as_view(), name='crypto-deposits-list'),
    
    # Crypto withdrawals
    path('crypto/withdraw/', CryptoWithdrawalCreateView.as_view(), name='crypto-withdrawal-create'),
    path('crypto/withdrawals/', CryptoWithdrawalListView.as_view(), name='crypto-withdrawals-list'),
    
    # Webhooks
    path('webhooks/razorpay/', RazorpayWebhookView.as_view(), name='razorpay-webhook'),
    
    # Admin
    path('admin/pending/', AdminPendingWithdrawalsView.as_view(), name='admin-pending'),
    path('admin/fiat/<uuid:withdrawal_id>/process/', AdminProcessFiatWithdrawalView.as_view(), name='admin-process-fiat'),
    path('admin/crypto/<uuid:withdrawal_id>/process/', AdminProcessCryptoWithdrawalView.as_view(), name='admin-process-crypto'),
]
