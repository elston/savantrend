from django.conf.urls import url
from django.conf import settings
from django.conf.urls.static import static
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required

from .import views as v
from . import reports_views as reports
from . import scheduler_views as scheduler

urlpatterns = [
    url(r'^$', v.root, name='root'),
    url(r'^login/$', v.login_view, name='login'),
    url(r'^logout/$', v.logout_view, name='logout'),
    url(
        r'^confirm_delete_user/(?P<pk>\d+)/$',
        v.delete_user, name='confirm_delete_user'),
    url(r'^add_user/$', v.add_user, name='add_user'),
    url(r'^dashboard/$', v.menu_1, name='dashboard'),
    url(r'^format-date/$', v.format_date, name='format_date'),

    # Reports
    url(r'^reports/$',
        login_required(reports.ReportsListView.as_view()), name='reports'),
    url(r'^reports/empty$',
        login_required(reports.BaseReportView.as_view()),
        name='na-report'),
]
# dynamically construct urls from list of known reports
for rklass in reports.get_known_reports():
    rpid = rklass.get_reportid()
    rpurl = url(r'^reports/%s$' % rpid,
                login_required(rklass.as_view()),
                name=reports.get_report_url_name(rpid))
    urlpatterns += [rpurl]

urlpatterns += [
    url(r'^settings/$', login_required(v.SettingsView.as_view()), name='settings'),

    # Scheduler
    url(r'^scheduler/$', login_required(scheduler.ReportsListView.as_view()), name='scheduler'),
    url(r'^scheduler/$', login_required(scheduler.ReportsListView.as_view()), name='scheduler_reports'),
    url(r'^scheduler/$', login_required(scheduler.ReportsListView.as_view()), name='reportlog-delete-all'),
    url(r'^scheduler/tasks$', login_required(scheduler.ScheduledTasksListView.as_view()), name='scheduler_tasks'),
    url(r'^scheduler/task/add$', login_required(scheduler.ScheduledTaskEditView.as_view()), name='scheduler_task_add'),
    url(r'^scheduler/task/(?P<pk>\d+)/edit$',
        login_required(scheduler.ScheduledTaskEditView.as_view()), name='scheduler_task_edit'),
    url(r'^scheduler/task/(?P<pk>\d+)/details$',
        login_required(scheduler.ScheduledTaskEditView.as_view()), name='scheduler_task_details'),

    url(r'^manage_access/$', v.manage_access, name='manage_access'),
    # for select2 multiple queries
    url(r'^get_form/$', csrf_exempt(v.ShowForm.as_view()), name='show_form'),
    url(
        r'^useraccess/(?P<pk>\d+)/edit/$',
        login_required(v.ChangeUserAccess.as_view()), name='change_useraccess'),
    url(
        r'^user/(?P<pk>\d+)/edit/$',
        login_required(v.ChangeUser.as_view()), name='change_user'),
    url(
        r'^user/(?P<pk>\d+)/profile/edit/$',
        login_required(v.ChangeOwnProfile.as_view()), name='change_own_profile'),
    url(
        r'^chain/(?P<pk>\d+)/edit/$',
        login_required(v.ChangeChain.as_view()), name='change_chain'),
    url(
        r'^site/(?P<pk>\d+)/edit/$',
        login_required(v.ChangeSite.as_view()), name='change_site'),
    url(
        r'^zone/(?P<pk>\d+)/edit/$',
        login_required(v.ChangeZone.as_view()), name='change_zone'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
