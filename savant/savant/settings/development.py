from .base import *
from os.path import join
import os

DEBUG = True

# On local
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'savant',
        'USER': 'usavant',
        'PASSWORD': '999',
        'HOST': '127.0.0.1',
        'PORT': '5433',
    }
}

WKHTMLTOPDF_BIN = b"/usr/bin/wkhtmltopdf"
if os.name=='nt':
    WKHTMLTOPDF_BIN = b"C:/Program Files (x86)/wkhtmltopdf/bin/wkhtmltopdf.exe"

# INSTALLED_APPS += ('debug_toolbar', )

DEBUG_TOOLBAR_PANELS = [
    # 'ddt_request_history.panels.request_history.RequestHistoryPanel',  # Here it is
    'debug_toolbar.panels.versions.VersionsPanel',
    'debug_toolbar.panels.timer.TimerPanel',
    'debug_toolbar.panels.settings.SettingsPanel',
    'debug_toolbar.panels.headers.HeadersPanel',
    'debug_toolbar.panels.request.RequestPanel',
    'debug_toolbar.panels.sql.SQLPanel',
    'debug_toolbar.panels.templates.TemplatesPanel',
    'debug_toolbar.panels.staticfiles.StaticFilesPanel',
    'debug_toolbar.panels.cache.CachePanel',
    'debug_toolbar.panels.signals.SignalsPanel',
    'debug_toolbar.panels.logging.LoggingPanel',
    'debug_toolbar.panels.redirects.RedirectsPanel',
    'debug_toolbar.panels.profiling.ProfilingPanel',
]

# DEBUG_TOOLBAR_CONFIG = {
#     'SHOW_TOOLBAR_CALLBACK': 'ddt_request_history.panels.request_history.allow_ajax',
# }

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
