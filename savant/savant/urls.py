from django.conf.urls import patterns, include, url
from django.contrib import admin
# import web

urlpatterns = patterns(
    '',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^', include('web.urls')),
)

admin.site.site_header = 'Savantrend'
admin.site.site_title = 'Savantrend'
