"""
Core Admin
==========
Admin configuration for core app
"""
from django.contrib import admin

# Core app doesn't have models, but we can customize admin site here

admin.site.site_header = 'CryptoExchange Admin'
admin.site.site_title = 'CryptoExchange'
admin.site.index_title = 'Administration'