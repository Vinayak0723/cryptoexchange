"""
Management command to set up demo data.

Usage:
    python manage.py setup_demo_data
"""

from django.core.management.base import BaseCommand
from decimal import Decimal

from apps.wallets.models import Currency
from apps.trading.models import TradingPair


class Command(BaseCommand):
    help = 'Set up demo currencies and trading pairs'

    def handle(self, *args, **options):
        self.stdout.write('Setting up demo data...\n')

        # Create currencies
        currencies_data = [
            {
                'symbol': 'ETH',
                'name': 'Ethereum',
                'currency_type': 'native',
                'decimals': 18,
                'min_deposit': Decimal('0.001'),
                'min_withdrawal': Decimal('0.01'),
                'withdrawal_fee': Decimal('0.005'),
            },
            {
                'symbol': 'USDT',
                'name': 'Tether USD',
                'currency_type': 'erc20',
                'contract_address': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                'decimals': 6,
                'min_deposit': Decimal('1'),
                'min_withdrawal': Decimal('10'),
                'withdrawal_fee': Decimal('5'),
            },
            {
                'symbol': 'USDC',
                'name': 'USD Coin',
                'currency_type': 'erc20',
                'contract_address': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                'decimals': 6,
                'min_deposit': Decimal('1'),
                'min_withdrawal': Decimal('10'),
                'withdrawal_fee': Decimal('5'),
            },
            {
                'symbol': 'BTC',
                'name': 'Wrapped Bitcoin',
                'currency_type': 'erc20',
                'contract_address': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
                'decimals': 8,
                'min_deposit': Decimal('0.0001'),
                'min_withdrawal': Decimal('0.001'),
                'withdrawal_fee': Decimal('0.0005'),
            },
            {
                'symbol': 'BNB',
                'name': 'Binance Coin',
                'currency_type': 'erc20',
                'contract_address': '0xB8c77482e45F1F44dE1745D96b62d974C2688',
                'decimals': 18,
                'min_deposit': Decimal('0.01'),
                'min_withdrawal': Decimal('0.1'),
                'withdrawal_fee': Decimal('0.001'),
            },
            {
                'symbol': 'ADA',
                'name': 'Cardano',
                'currency_type': 'erc20',
                'contract_address': '0x3EE2200Efb3400cB571784b4C9b8b3b1F0Ea9Dd',
                'decimals': 18,
                'min_deposit': Decimal('1'),
                'min_withdrawal': Decimal('5'),
                'withdrawal_fee': Decimal('0.5'),
            },
            {
                'symbol': 'SOL',
                'name': 'Solana',
                'currency_type': 'erc20',
                'contract_address': '0xD31a59c85AE9D8Efec211251670Bf85Db18c413',
                'decimals': 9,
                'min_deposit': Decimal('0.01'),
                'min_withdrawal': Decimal('0.1'),
                'withdrawal_fee': Decimal('0.002'),
            },
            {
                'symbol': 'DOT',
                'name': 'Polkadot',
                'currency_type': 'erc20',
                'contract_address': '0x7083609fCEc18B8AcbFf2bE22F07250928',
                'decimals': 12,
                'min_deposit': Decimal('0.1'),
                'min_withdrawal': Decimal('1'),
                'withdrawal_fee': Decimal('0.1'),
            },
            {
                'symbol': 'MATIC',
                'name': 'Polygon',
                'currency_type': 'erc20',
                'contract_address': '0x7D1AfA7Ff7Bc3eFdC59F8A0b526411850460',
                'decimals': 18,
                'min_deposit': Decimal('1'),
                'min_withdrawal': Decimal('10'),
                'withdrawal_fee': Decimal('0.5'),
            },
            {
                'symbol': 'AVAX',
                'name': 'Avalanche',
                'currency_type': 'erc20',
                'contract_address': '0xB31f66AA3C1e785363F06B5F876dC75681eA8',
                'decimals': 18,
                'min_deposit': Decimal('0.01'),
                'min_withdrawal': Decimal('0.1'),
                'withdrawal_fee': Decimal('0.001'),
            },
            {
                'symbol': 'LINK',
                'name': 'Chainlink',
                'currency_type': 'erc20',
                'contract_address': '0x514910771AF9Ca656af840dff83E8264EcF986DA25',
                'decimals': 18,
                'min_deposit': Decimal('0.1'),
                'min_withdrawal': Decimal('1'),
                'withdrawal_fee': Decimal('0.1'),
            },
            {
                'symbol': 'UNI',
                'name': 'Uniswap',
                'currency_type': 'erc20',
                'contract_address': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
                'decimals': 18,
                'min_deposit': Decimal('0.1'),
                'min_withdrawal': Decimal('10'),
                'withdrawal_fee': Decimal('0.3'),
            },
            {
                'symbol': 'AAVE',
                'name': 'Aave',
                'currency_type': 'erc20',
                'contract_address': '0x7Fc66500c84A76Ad01e0633eA3CEdD9A9eD4E',
                'decimals': 18,
                'min_deposit': Decimal('0.01'),
                'min_withdrawal': Decimal('0.1'),
                'withdrawal_fee': Decimal('0.001'),
            },
            {
                'symbol': 'SHIB',
                'name': 'Shiba Inu',
                'currency_type': 'erc20',
                'contract_address': '0x95aD61a015bd670d44c0C6145B0C68463e4887',
                'decimals': 18,
                'min_deposit': Decimal('100000'),
                'min_withdrawal': Decimal('1000000'),
                'withdrawal_fee': Decimal('1'),
            },
            {
                'symbol': 'DOGE',
                'name': 'Dogecoin',
                'currency_type': 'erc20',
                'contract_address': '0x420693DA7Cf21a6eD21a0e4E1962Bef68Aa5eD',
                'decimals': 8,
                'min_deposit': Decimal('10'),
                'min_withdrawal': Decimal('100'),
                'withdrawal_fee': Decimal('0.5'),
            },
        ]

        currencies = {}
        for data in currencies_data:
            currency, created = Currency.objects.update_or_create(
                symbol=data['symbol'],
                defaults=data
            )
            currencies[data['symbol']] = currency
            status = 'Created' if created else 'Updated'
            self.stdout.write(f'  {status} currency: {currency.symbol}')

        # Create trading pairs
        pairs_data = [
            {
                'base': 'ETH',
                'quote': 'USDT',
                'last_price': Decimal('2500.00'),
            },
            {
                'base': 'BTC',
                'quote': 'USDT',
                'last_price': Decimal('45000.00'),
            },
            {
                'base': 'ETH',
                'quote': 'USDC',
                'last_price': Decimal('2500.00'),
            },
            {
                'base': 'BNB',
                'quote': 'USDT',
                'last_price': Decimal('320.00'),
            },
            {
                'base': 'ADA',
                'quote': 'USDT',
                'last_price': Decimal('0.65'),
            },
            {
                'base': 'SOL',
                'quote': 'USDT',
                'last_price': Decimal('110.00'),
            },
            {
                'base': 'DOT',
                'quote': 'USDT',
                'last_price': Decimal('7.50'),
            },
            {
                'base': 'MATIC',
                'quote': 'USDT',
                'last_price': Decimal('0.95'),
            },
            {
                'base': 'AVAX',
                'quote': 'USDT',
                'last_price': Decimal('38.00'),
            },
            {
                'base': 'LINK',
                'quote': 'USDT',
                'last_price': Decimal('14.50'),
            },
            {
                'base': 'UNI',
                'quote': 'USDT',
                'last_price': Decimal('8.20'),
            },
            {
                'base': 'AAVE',
                'quote': 'USDT',
                'last_price': Decimal('95.00'),
            },
            {
                'base': 'SHIB',
                'quote': 'USDT',
                'last_price': Decimal('0.000025'),
            },
            {
                'base': 'DOGE',
                'quote': 'USDT',
                'last_price': Decimal('0.085'),
            },
            {
                'base': 'ETH',
                'quote': 'BTC',
                'last_price': Decimal('0.055'),
            },
            {
                'base': 'BNB',
                'quote': 'ETH',
                'last_price': Decimal('0.012'),
            },
        ]

        for data in pairs_data:
            base = currencies[data['base']]
            quote = currencies[data['quote']]
            symbol = f"{data['base']}_{data['quote']}"

            pair, created = TradingPair.objects.update_or_create(
                symbol=symbol,
                defaults={
                    'base_currency': base.symbol,
                    'quote_currency': quote.symbol,
                    'is_active': True,
                    'last_price': data['last_price'],
                    'min_quantity': Decimal('0.001'),
                    'max_quantity': Decimal('1000000'),
                }
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(f'  {status} trading pair: {pair.symbol}')

        self.stdout.write(self.style.SUCCESS('\n✅ Demo data setup complete!'))
        self.stdout.write('\nCurrencies: ' + ', '.join(currencies.keys()))
        self.stdout.write('Trading Pairs: ' + ', '.join([f"{p['base']}_{p['quote']}" for p in pairs_data]))