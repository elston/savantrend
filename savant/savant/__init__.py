import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'savant.settings.production')

from django.conf import settings
if settings.IS_SERVER:
    from .celeryp import app as celery_app
