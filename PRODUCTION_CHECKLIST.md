# Production Deployment Checklist

## Before Deployment

### Environment Variables
- [ ] SECRET_KEY - Generate with: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
- [ ] DEBUG=False
- [ ] DATABASE_URL configured
- [ ] REDIS_URL configured
- [ ] RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (live keys)
- [ ] RAZORPAY_WEBHOOK_SECRET
- [ ] ALCHEMY_API_KEY
- [ ] HOT_WALLET_PRIVATE_KEY (secure storage!)
- [ ] DEPOSIT_WALLET_ADDRESS
- [ ] SENTRY_DSN (optional but recommended)
- [ ] EMAIL_HOST_USER and EMAIL_HOST_PASSWORD

### Domain & SSL
- [ ] Custom domain purchased
- [ ] DNS configured for Railway/Render
- [ ] SSL certificate active
- [ ] HTTPS redirect enabled

### Security
- [ ] Run `python manage.py security_audit`
- [ ] All security middleware enabled
- [ ] Rate limiting configured
- [ ] CORS properly restricted
- [ ] Admin URL changed from default

### KYC/Compliance
- [ ] KYC levels configured
- [ ] Document upload working
- [ ] Admin review process tested
- [ ] Legal pages (Terms, Privacy) reviewed

### Payments
- [ ] Razorpay webhook URL configured
- [ ] Test deposit/withdrawal flow
- [ ] Hot wallet funded with gas
- [ ] Withdrawal approval process tested

### Monitoring
- [ ] Sentry configured
- [ ] Logging enabled
- [ ] Health check endpoint working

## Post Deployment

- [ ] Test user registration
- [ ] Test KYC flow
- [ ] Test deposit (small amount)
- [ ] Test trading
- [ ] Test withdrawal (small amount)
- [ ] Monitor logs for errors
- [ ] Set up uptime monitoring

## Emergency Contacts

- Technical Lead: _______________
- Legal/Compliance: _______________
- Payment Provider Support: _______________
