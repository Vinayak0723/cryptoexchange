"""
Setup KYC Levels Command
========================
Creates default KYC verification levels
"""
from django.core.management.base import BaseCommand
from apps.kyc.models import KYCLevel


class Command(BaseCommand):
    help = 'Setup default KYC verification levels'

    def handle(self, *args, **options):
        levels = [
            {
                'level': 0,
                'name': 'Unverified',
                'description': 'No verification - limited features',
                'daily_withdrawal_limit': 0,
                'monthly_withdrawal_limit': 0,
                'can_trade': True,
                'can_withdraw_crypto': False,
                'can_withdraw_fiat': False,
                'can_deposit_fiat': True,
                'can_use_p2p': False,
            },
            {
                'level': 1,
                'name': 'Basic',
                'description': 'Email + Phone verified - basic features',
                'daily_withdrawal_limit': 2000,
                'monthly_withdrawal_limit': 10000,
                'can_trade': True,
                'can_withdraw_crypto': True,
                'can_withdraw_fiat': False,
                'can_deposit_fiat': True,
                'can_use_p2p': False,
            },
            {
                'level': 2,
                'name': 'Intermediate',
                'description': 'ID verified - full features',
                'daily_withdrawal_limit': 50000,
                'monthly_withdrawal_limit': 200000,
                'can_trade': True,
                'can_withdraw_crypto': True,
                'can_withdraw_fiat': True,
                'can_deposit_fiat': True,
                'can_use_p2p': True,
            },
            {
                'level': 3,
                'name': 'Advanced',
                'description': 'Fully verified - highest limits',
                'daily_withdrawal_limit': 500000,
                'monthly_withdrawal_limit': 2000000,
                'can_trade': True,
                'can_withdraw_crypto': True,
                'can_withdraw_fiat': True,
                'can_deposit_fiat': True,
                'can_use_p2p': True,
            },
        ]

        for level_data in levels:
            try:
                level, created = KYCLevel.objects.update_or_create(
                    level=level_data['level'],
                    defaults=level_data
                )
                status = 'Created' if created else 'Updated'
                self.stdout.write(
                    self.style.SUCCESS(f"  {status}: {level.name} (Level {level.level})")
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"  Error creating level {level_data['level']}: {e}")
                )

        self.stdout.write(self.style.SUCCESS('\n✅ KYC levels setup complete!'))