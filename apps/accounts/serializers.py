"""
Accounts Serializers
====================
Serializers for user registration, login, and wallet authentication.
"""

import secrets
import string
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, WalletConnection, AuthNonce


def generate_secure_password(length=10):
    """Generate a secure 10-digit password."""
    # Mix of uppercase, lowercase, digits, and special characters
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(characters) for _ in range(length))
    return password


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'is_email_verified', 'is_2fa_enabled', 'created_at'
        ]
        read_only_fields = ['id', 'is_email_verified', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(
        write_only=True,
        min_length=10,
        validators=[validate_password],
        required=False  # Make optional since we can generate
    )
    password_confirm = serializers.CharField(write_only=True, required=False)
    use_generated_password = serializers.BooleanField(default=False)

    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name', 'use_generated_password']

    def validate(self, attrs):
        use_generated = attrs.get('use_generated_password', False)
        
        if use_generated:
            # Generate password automatically
            generated_password = generate_secure_password()
            attrs['password'] = generated_password
            attrs['password_confirm'] = generated_password
            attrs['generated_password'] = generated_password
        else:
            # User provided password
            if not attrs.get('password'):
                raise serializers.ValidationError({
                    'password': 'Password is required when not using generated password.'
                })
            if attrs['password'] != attrs['password_confirm']:
                raise serializers.ValidationError({
                    'password_confirm': 'Passwords do not match.'
                })
        
        return attrs

    def create(self, validated_data):
        use_generated = validated_data.get('use_generated_password', False)
        generated_password = validated_data.pop('generated_password', None)
        validated_data.pop('password_confirm')
        validated_data.pop('use_generated_password')
        
        user = User.objects.create_user(**validated_data)
        
        # Return user with generated password info
        result = {'user': user}
        if use_generated and generated_password:
            result['generated_password'] = generated_password
        
        return result


class LoginSerializer(serializers.Serializer):
    """Serializer for email/password login."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from apps.accounts.models import User as UserModel
        try:
            user = UserModel.objects.get(email=attrs.get('email'))
            if not user.check_password(attrs.get('password')):
                raise serializers.ValidationError('Invalid email or password.')
            if not user.is_active:
                raise serializers.ValidationError('Account is disabled.')
            attrs['user'] = user
            return attrs
        except UserModel.DoesNotExist:
            raise serializers.ValidationError('Invalid email or password.')


class WalletConnectionSerializer(serializers.ModelSerializer):
    """Serializer for Wallet Connection."""

    class Meta:
        model = WalletConnection
        fields = [
            'id', 'wallet_address', 'chain_id', 'wallet_type',
            'is_primary', 'is_verified', 'last_used_at', 'created_at'
        ]
        read_only_fields = ['id', 'is_verified', 'last_used_at', 'created_at']


class WalletNonceRequestSerializer(serializers.Serializer):
    """Request a nonce for wallet authentication."""

    wallet_address = serializers.CharField(max_length=42)

    def validate_wallet_address(self, value):
        # Basic Ethereum address validation
        if not value.startswith('0x') or len(value) != 42:
            raise serializers.ValidationError('Invalid Ethereum address format.')

        # Convert to checksum address
        from web3 import Web3
        try:
            return Web3.to_checksum_address(value)
        except Exception:
            raise serializers.ValidationError('Invalid Ethereum address.')


class WalletNonceResponseSerializer(serializers.Serializer):
    """Response with nonce for signing."""

    nonce = serializers.CharField()
    message = serializers.CharField()
    expires_at = serializers.DateTimeField()


class WalletVerifySerializer(serializers.Serializer):
    """Verify wallet signature."""

    wallet_address = serializers.CharField(max_length=42)
    signature = serializers.CharField()
    nonce = serializers.CharField()

    def validate_wallet_address(self, value):
        from web3 import Web3
        try:
            return Web3.to_checksum_address(value)
        except Exception:
            raise serializers.ValidationError('Invalid Ethereum address.')


class WalletConnectSerializer(serializers.Serializer):
    """Connect wallet to existing user account."""

    wallet_address = serializers.CharField(max_length=42)
    signature = serializers.CharField()
    nonce = serializers.CharField()
    wallet_type = serializers.ChoiceField(
        choices=['metamask', 'walletconnect'],
        default='metamask'
    )
    chain_id = serializers.IntegerField(default=1)

    def validate_wallet_address(self, value):
        from web3 import Web3
        try:
            return Web3.to_checksum_address(value)
        except Exception:
            raise serializers.ValidationError('Invalid Ethereum address.')


class ChangePasswordSerializer(serializers.Serializer):
    """Change user password."""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True,
        min_length=10,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Passwords do not match.'
            })
        return attrs