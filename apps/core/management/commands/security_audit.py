"""
Security Audit Command
======================
Check for common security issues before deployment
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import os


class Command(BaseCommand):
    help = 'Run security audit checks for production readiness'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write(self.style.HTTP_INFO("SECURITY AUDIT - CryptoExchange"))
        self.stdout.write("=" * 60)
        self.stdout.write("")

        issues = []
        warnings = []
        passed = []

        # ==========================================
        # CRITICAL CHECKS
        # ==========================================

        # Check DEBUG mode
        if settings.DEBUG:
            issues.append("DEBUG is True - MUST be False in production!")
        else:
            passed.append("DEBUG is False")

        # Check SECRET_KEY
        secret_key = getattr(settings, 'SECRET_KEY', '')
        if 'django-insecure' in secret_key:
            issues.append("SECRET_KEY contains 'django-insecure' - generate a new key!")
        elif len(secret_key) < 50:
            warnings.append("SECRET_KEY seems short - consider using a longer key")
        else:
            passed.append("SECRET_KEY looks secure")

        # Check ALLOWED_HOSTS
        allowed_hosts = getattr(settings, 'ALLOWED_HOSTS', [])
        if '*' in allowed_hosts:
            issues.append("ALLOWED_HOSTS contains '*' - specify actual domains!")
        elif not allowed_hosts:
            issues.append("ALLOWED_HOSTS is empty - add your domains!")
        else:
            passed.append(f"ALLOWED_HOSTS configured ({len(allowed_hosts)} hosts)")

        # ==========================================
        # HTTPS / SSL CHECKS
        # ==========================================

        if getattr(settings, 'SECURE_SSL_REDIRECT', False):
            passed.append("SECURE_SSL_REDIRECT is enabled")
        else:
            warnings.append("SECURE_SSL_REDIRECT is False - enable for production")

        if getattr(settings, 'SESSION_COOKIE_SECURE', False):
            passed.append("SESSION_COOKIE_SECURE is enabled")
        else:
            issues.append("SESSION_COOKIE_SECURE is False - cookies sent over HTTP!")

        if getattr(settings, 'CSRF_COOKIE_SECURE', False):
            passed.append("CSRF_COOKIE_SECURE is enabled")
        else:
            issues.append("CSRF_COOKIE_SECURE is False - CSRF token sent over HTTP!")

        # Check HSTS
        hsts_seconds = getattr(settings, 'SECURE_HSTS_SECONDS', 0)
        if hsts_seconds > 0:
            passed.append(f"HSTS enabled ({hsts_seconds} seconds)")
        else:
            warnings.append("HSTS not configured - browsers may use HTTP")

        # ==========================================
        # DATABASE CHECKS
        # ==========================================

        db_url = os.environ.get('DATABASE_URL', '')
        if 'localhost' in db_url or 'sqlite' in db_url.lower():
            warnings.append("Database appears to be local - use remote DB in production")
        elif db_url:
            passed.append("DATABASE_URL configured")
        else:
            warnings.append("DATABASE_URL not set in environment")

        # ==========================================
        # PAYMENT PROVIDER CHECKS
        # ==========================================

        # Razorpay
        razorpay_key = os.environ.get('RAZORPAY_KEY_ID', '')
        razorpay_secret = os.environ.get('RAZORPAY_KEY_SECRET', '')
        if razorpay_key and razorpay_secret:
            if razorpay_key.startswith('rzp_test'):
                warnings.append("Razorpay is using TEST keys - switch to LIVE for production")
            else:
                passed.append("Razorpay configured with live keys")
        else:
            warnings.append("RAZORPAY credentials not fully configured")

        razorpay_webhook = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')
        if razorpay_webhook:
            passed.append("Razorpay webhook secret configured")
        else:
            warnings.append("RAZORPAY_WEBHOOK_SECRET not set")

        # ==========================================
        # BLOCKCHAIN CHECKS
        # ==========================================

        alchemy_key = os.environ.get('ALCHEMY_API_KEY', '')
        if alchemy_key:
            passed.append("Alchemy API key configured")
        else:
            warnings.append("ALCHEMY_API_KEY not set - blockchain features won't work")

        hot_wallet = os.environ.get('HOT_WALLET_PRIVATE_KEY', '')
        if hot_wallet:
            passed.append("Hot wallet private key configured")
            if hot_wallet.startswith('0x') and len(hot_wallet) == 66:
                passed.append("Hot wallet key format looks valid")
            else:
                warnings.append("Hot wallet key format may be incorrect")
        else:
            warnings.append("HOT_WALLET_PRIVATE_KEY not set - withdrawals won't work")

        deposit_address = os.environ.get('DEPOSIT_WALLET_ADDRESS', '')
        if deposit_address:
            passed.append("Deposit wallet address configured")
        else:
            warnings.append("DEPOSIT_WALLET_ADDRESS not set")

        # ==========================================
        # CORS / CSRF CHECKS
        # ==========================================

        cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        if cors_origins:
            passed.append(f"CORS configured ({len(cors_origins)} origins)")
        else:
            warnings.append("CORS_ALLOWED_ORIGINS is empty")

        csrf_trusted = getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])
        if csrf_trusted:
            passed.append(f"CSRF trusted origins configured ({len(csrf_trusted)})")
        else:
            warnings.append("CSRF_TRUSTED_ORIGINS is empty")

        # ==========================================
        # EMAIL CHECKS
        # ==========================================

        email_host = os.environ.get('EMAIL_HOST_USER', '')
        if email_host:
            passed.append("Email host user configured")
        else:
            warnings.append("EMAIL_HOST_USER not set - emails won't work")

        # ==========================================
        # PRODUCTION MODE CHECKS
        # ==========================================

        demo_mode = os.environ.get('DEMO_MODE', 'true').lower()
        if demo_mode == 'false':
            passed.append("DEMO_MODE is disabled (production mode)")
        else:
            warnings.append("DEMO_MODE is enabled - set to 'false' for real transactions")

        # ==========================================
        # ERROR TRACKING
        # ==========================================

        sentry_dsn = os.environ.get('SENTRY_DSN', '')
        if sentry_dsn:
            passed.append("Sentry error tracking configured")
        else:
            warnings.append("SENTRY_DSN not set - consider adding error tracking")

        # ==========================================
        # PRINT RESULTS
        # ==========================================

        if issues:
            self.stdout.write("")
            self.stdout.write(self.style.ERROR(f"❌ CRITICAL ISSUES ({len(issues)}):"))
            self.stdout.write("-" * 40)
            for issue in issues:
                self.stdout.write(self.style.ERROR(f"   • {issue}"))

        if warnings:
            self.stdout.write("")
            self.stdout.write(self.style.WARNING(f"⚠️  WARNINGS ({len(warnings)}):"))
            self.stdout.write("-" * 40)
            for warning in warnings:
                self.stdout.write(self.style.WARNING(f"   • {warning}"))

        if passed:
            self.stdout.write("")
            self.stdout.write(self.style.SUCCESS(f"✅ PASSED ({len(passed)}):"))
            self.stdout.write("-" * 40)
            for p in passed:
                self.stdout.write(self.style.SUCCESS(f"   • {p}"))

        # ==========================================
        # SUMMARY
        # ==========================================

        self.stdout.write("")
        self.stdout.write("=" * 60)

        if issues:
            self.stdout.write(self.style.ERROR(
                f"AUDIT FAILED - {len(issues)} critical issues must be fixed!"
            ))
            self.stdout.write(self.style.ERROR(
                "DO NOT DEPLOY until all critical issues are resolved."
            ))
        elif warnings:
            self.stdout.write(self.style.WARNING(
                f"AUDIT PASSED WITH {len(warnings)} WARNINGS"
            ))
            self.stdout.write(self.style.WARNING(
                "Review warnings before deploying to production."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                "✅ AUDIT PASSED - Ready for production deployment!"
            ))

        self.stdout.write("=" * 60)