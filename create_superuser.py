import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Admin credentials
ADMIN_EMAIL = 'admin@tokenly.net.in'
ADMIN_PASSWORD = 'TokenlyAdmin@2026'

# Delete existing admin if exists
User.objects.filter(email=ADMIN_EMAIL).delete()

# Create new admin user
user = User(
    email=ADMIN_EMAIL,
    username='admin',
    is_staff=True,
    is_superuser=True,
    is_active=True,
    is_email_verified=True
)
user.set_password(ADMIN_PASSWORD)
user.save()

print(f'Superuser {ADMIN_EMAIL} created successfully!')
