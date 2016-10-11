from django.contrib import messages
from os.path import abspath, join, dirname, pardir

BASE_DIR = abspath(join(dirname(abspath(__file__)), '..', '..', '..'))

# True on server, False on local machine
# client's local machine
IS_SERVER = True

ALLOWED_HOSTS = ['sav.blao.ru']
SECRET_KEY = 'Uhrty5674Tgrt-UjfhGtyr675889-LKjhkmnbcsdghk-(*&976348763'
DB_NAME = 'savant'
DB_USER = 'usavant'
DB_PASSWORD = '999'
HOST_IP = ''

AUTH_USER_MODEL = 'web.User'
LOGIN_URL = '/login/'


# email settings
DEFAULT_FROM_EMAIL = 'noreply@blao.ru'
EMAIL_HOST = 'localhost'
EMAIL_HOST_PASSWORD = ''
EMAIL_HOST_USER = ''
EMAIL_PORT = 25
EMAIL_USE_TLS = False

INSTALLED_APPS = (
    'django_admin_bootstrapped',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # 'debug_toolbar',
    'django_extensions',
    'rest_framework',
    'corsheaders',
    'web',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'web.middleware.ActiveUserMiddleware',
    'web.middleware.WarningMessageMiddleware'
)

ROOT_URLCONF = 'savant.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [join(dirname(abspath(__file__)), pardir, pardir, 'templates')],
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                "django.template.context_processors.media",
                'django.contrib.messages.context_processors.messages',
                'web.context_processors.settings_context',
            ],
            'loaders': [
                'apptemplates.Loader',
                'django.template.loaders.filesystem.Loader',
                'django.template.loaders.app_directories.Loader',
            ]
        },
    },
]

WSGI_APPLICATION = 'savant.wsgi.application'

# On server
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql_psycopg2',
#         'NAME': 'savant',
#         'USER': 'usavant',
#         'PASSWORD': 'krpk715',
#         'HOST': '45.33.74.179',
#         'PORT': '5432',
#     }
# }

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Dubai'
USE_I18N = True
USE_L10N = True
USE_TZ = True

MEDIA_ROOT = BASE_DIR + '/media/'
STATIC_URL = '/static/'
MEDIA_URL = '/media/'

FILE_UPLOAD_HANDLERS = (
    'django.core.files.uploadhandler.MemoryFileUploadHandler',
    'django.core.files.uploadhandler.TemporaryFileUploadHandler',
)

FILE_UPLOAD_TEMP_DIR = MEDIA_ROOT + 'tmp/'
REPORTS_STORE_DIR = MEDIA_ROOT + 'reports/'

STATICFILES_DIRS = [join(BASE_DIR, "static/static")]

STATICFILES_FINDERS = (
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
)

COMPANY_NAME = "Savant Data System"

if IS_SERVER:
    # Celery
    BROKER_URL = 'redis://127.0.0.1:6379/0'
    CELERY_ACCEPT_CONTENT = ['json']
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_RESULT_SERIALIZER = 'json'


# django-admin-bootstrapped
MESSAGE_TAGS = {
    messages.SUCCESS: 'alert-success success',
    messages.WARNING: 'alert-warning warning',
    messages.ERROR: 'alert-danger error'
}

WKHTMLTOPDF_BIN = b"/opt/wkhtmltox/bin/wkhtmltopdf"

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,

    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse'
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue'
        }
    },

    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(module)s %(process)d \
            %(thread)d %(message)s'
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
    },

    'handlers': {
        'console': {
            'filters': ['require_debug_true'],
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
        'db': {
            'class': 'savant.loggers.MyDbLogHandler',
            'formatter': 'verbose'
        }
    },

    'loggers': {
        # 'django': {
        #     'level': 'INFO',
        #     'handlers': ['console'],
        #     'propagate': True,
        # },

        'django.request': {
            'handlers': ['db', 'console'],
            'level': 'ERROR',
            'propagate': False,
        },

        'app': {
            'level': 'DEBUG',
            'handlers': ['console', 'db'],
            'propagate': False,
        }
    }
}
