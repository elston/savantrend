from .base import *
from os.path import join
import os

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'savant',
        'USER': 'savant',
        'PASSWORD': 'AWCvTqs425MM671',
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}
if os.name=='nt':
    WKHTMLTOPDF_BIN = b"C:/Program Files (x86)/wkhtmltopdf/bin/wkhtmltopdf.exe"

DEFAULT_FROM_EMAIL = 'sdswarningemails@gmail.com'
EMAIL_HOST_PASSWORD = 'Sds@12345'
EMAIL_HOST_USER = 'sdswarningemails@gmail.com'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
