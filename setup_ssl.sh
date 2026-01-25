#!/bin/bash

# SSL Certificate Setup with Let's Encrypt
# Run this on your server (if self-hosting)

# Install certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal cron job (certbot adds this automatically)
# To test renewal: sudo certbot renew --dry-run

echo "SSL certificates installed!"
echo "Certificates will auto-renew before expiration."
