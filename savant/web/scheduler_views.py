
import datetime
import json
from collections import defaultdict

from django.core.exceptions import PermissionDenied
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.views.generic import TemplateView
from django.http import HttpResponse, Http404
from django.views.generic.list import ListView
from django.shortcuts import redirect, render_to_response
from django.views.generic.edit import ModelFormMixin, ProcessFormView
from django.views.generic.detail import DetailView, SingleObjectTemplateResponseMixin, BaseDetailView
from django.utils import timezone
from django.conf import settings
from django.template.context import RequestContext
from django.db.models import BooleanField, Case, Value as V, When

from . import models
from . import tasks
from .reports_views import EMAIL_EXTRACT_REX, REPORT_FILTERS, get_report_url, get_report_url_name


class ObjectListBaseView(ListView):
    template_name = 'xxx/list.html'
    content_template_name = 'xxx/list_content.html'
    model = None
    FILTER_FIELDS = [('name', 'Name'), ]

    def dispatch(self, request, *args, **kwargs):
        self._args = args
        self._kwargs = kwargs
        self._user = self.request.user
        if self.request.user.is_admin:
            if self.request.method == 'GET':
                userid = self.request.GET.get('userid')
            elif self.request.method == 'POST':
                userid = self.request.POST.get('userid')
            if userid:
                self._user = models.User.objects.get(pk=userid)
        return super().dispatch(request, *args, **kwargs)

    def filter_value(self, qset, fname, fdname, fvalue):
        if fdname.endswith('?'):
            fvalue = True if fvalue == 'True' else False
            fd = {"%s" % fname: fvalue}
            qset = qset.filter(**fd)
        else:
            fd = {"%s__iexact" % fname: fvalue}
            qset = qset.filter(**fd)
        return qset

    def get_pagination_page(self, page=1, maxitems=20, filters=None, sortfield=None, sortasc='1'):
        items = self.get_queryset()
        if filters:
            for ff in filters:
                ffs = ff.split('*', 1)
                if len(ffs) > 1:
                    fname, fvalue = ffs
                    for ffield, ffname in self.FILTER_FIELDS:
                        if ffield == fname:
                            items = self.filter_value(items, fname, ffname, fvalue)
        if sortfield:
            if sortasc == '0':
                items = items.order_by("-%s" % sortfield)
            else:
                items = items.order_by("%s" % sortfield)
        paginator = Paginator(items, maxitems)
        try:
            page = int(page)
        except ValueError:
            page = 1

        try:
            items = paginator.page(page)
        except (EmptyPage, InvalidPage):
            items = paginator.page(paginator.num_pages)

        return items

    def get_context_data(self, **kwargs):
        context = {}
        # context = super().get_context_data()
        page = kwargs.pop('page', 1)
        maxitems = kwargs.pop('maxitems', 20)
        filters = kwargs.pop('filters', [])
        sortfield = kwargs.pop('sortfield', '')
        sortasc = kwargs.pop('sortasc', '')
        if not self.request.is_ajax():
            lfilter = self.get_filter_vals()
            context['filters'] = lfilter
        context['items'] = self.get_pagination_page(page, maxitems, filters=filters,
                                                    sortfield=sortfield, sortasc=sortasc)
        context['prelast'] = context['items'].paginator.num_pages - 1
        context['sortfield'] = sortfield
        context['is_admin_view'] = self._user != self.request.user
        context['base_template'] = 'web/base.html'
        context['otheruser'] = ''
        if context['is_admin_view']:
            context['curuser'] = '%s' % self._user.id
            context['otheruser'] = "?userid=%s" % self._user.id
            context['base_template'] = 'scheduler/scheduler_adminbase.html'
            context.update({
                'has_permission': True,
                'site_title': 'Savantrend',
                'site_header': 'Savantrend',
                'title': 'Scheduler for user %s' % self._user.get_short_name(),
                'app_label': 'Scheduler for user %s' % self._user.get_short_name(),
            })
        return RequestContext(self.request, context)

    def get_queryset(self):
        return self.model.objects.all()

    def get_filter_vals(self):
        def get_val(vv):
            if vv is None:
                return ''
            return str(vv)

        retval = []
        for fld, fname in self.FILTER_FIELDS:
            retval.append((fname, fld, sorted(get_val(v)
                                              for v in set(self.get_queryset().values_list(fld, flat=True)))))
        return retval

    def get(self, request):
        if not request.is_ajax():
            return super().get(request)
        page = request.GET.get('page', 1)
        filters = request.GET.getlist('filters[]', [])
        maxitems = request.GET.get('maxitems', 20)
        sortfield = request.GET.get('sort', 'created_at')
        sortasc = str(request.GET.get('sortasc', '1'))
        context = self.get_context_data(page=page, maxitems=maxitems,
                                        filters=filters, sortfield=sortfield, sortasc=sortasc)
        return render_to_response(self.content_template_name, context)


class ReportsListView(ObjectListBaseView):
    template_name = 'scheduler/reports_list.html'
    content_template_name = 'scheduler/reports_list_content.html'
    model = models.ReportLog
    FILTER_FIELDS = [('name', 'Name'), ('is_scheduled', 'Scheduled?'), ('is_email', 'Email?')]

    def get_queryset(self):
        qs = self.model.objects.filter(user=self._user)
        return qs.annotate(
            is_scheduled=Case(
                When(is_manual=True, then=V(False)),
                When(is_manual=False, then=V(True)), output_field=BooleanField(),
            )
        )

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        # self.settings = self._user.get_all_settings_dict()
        return context

    def post(self, request):
        if not request.is_ajax():
            return super().get(request)
        if request.POST.get('delete_all_reports'):
            # delete all user's reportlogs
            # self._user
            allreportdates = list(self.get_queryset().values_list('created_at', 'is_csv', 'is_xls', 'is_pdf'))
            allfiles = []
            for rd, is_csv, is_xls, is_pdf in allreportdates:
                fpath = "%s/%s/%s." % (settings.REPORTS_STORE_DIR,
                                       self._user.id,
                                       int(rd.timestamp()))
                if is_csv:
                    allfiles.append(fpath + 'csv')
                if is_xls:
                    allfiles.append(fpath + 'xlsx')
                if is_pdf:
                    allfiles.append(fpath + 'pdf')
            tasks.delete_files.apply_async(kwargs={'files_list': allfiles})
            self.get_queryset().delete()
        return HttpResponse('OK')


class ScheduledTasksListView(ObjectListBaseView):
    template_name = 'scheduler/scheduledtasks_list.html'
    content_template_name = 'scheduler/scheduledtasks_list_content.html'
    model = models.ScheduledReport
    FILTER_FIELDS = [('name', 'Name'), ('active', 'Is Active?'), ]

    def get_queryset(self):
        return self.model.objects.filter(user=self._user, deleted=False)

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        # self.settings = self._user.get_all_settings_dict()
        return context


class ScheduledTaskEditView(SingleObjectTemplateResponseMixin, ModelFormMixin, ProcessFormView):
    model = models.ScheduledReport
    success_url_name = '/'
    template_name = 'scheduler/scheduledtasks_details.html'
    form_class = None
    fields = []

    def dispatch(self, request, *args, **kwargs):
        self._args = args
        self._kwargs = kwargs
        self._user = self.request.user
        if self.request.user.is_admin:
            userid = self.request.GET.get('userid')
            # if self.request.method == 'GET':
            if not userid and self.request.method == 'POST':
                userid = self.request.POST.get('userid')
            if userid:
                self._user = models.User.objects.get(pk=userid)
        return super().dispatch(request, *args, **kwargs)

    def get_object(self, queryset=None):
        obj = None
        try:
            try:
                obj = super().get_object(queryset)
            except AttributeError:
                obj = None
            if obj and obj.user_id and obj.user_id != self._user.id:
                raise PermissionDenied()
            if not obj:
                obj = self.model(user=self._user)
            return obj
        except Http404:
            raise
        return self.model(user=self._user)

    def post(self, request, *args, **kwargs):
        if not self.request.is_ajax():
            return redirect('/')
        # print(self.request.POST)
        context = self.get_context_data()
        usersettings = self._user.get_all_settings_dict()
        self.object = self.get_object()
        if self.request.POST.get('delete_schreport') and self.object.id:
            self.object.deleted = True
            self.object.save()
            return HttpResponse('OK')

        self.object.user = self._user
        if not self.object.id:
            # report parameters edit - only for adding. If need to change - please delete and go create new report
            report_id = self.request.POST.get('report_id')
            self.object.report_id = report_id
            self.object.name = usersettings.get(report_id, 'Report')
            params = {}
            for pr in REPORT_FILTERS:
                if pr.endswith('[]'):
                    params[pr.replace('[]', '')] = self.request.POST.getlist(pr)
                else:
                    params[pr] = self.request.POST.get(pr)
            params['reporturl'] = get_report_url(get_report_url_name(report_id))
            self.object.parameters = json.dumps(params)

        self.object.email_to = ','.join(EMAIL_EXTRACT_REX.findall(self.request.POST.get('emailto')))
        self.object.email_cc = ','.join(EMAIL_EXTRACT_REX.findall(self.request.POST.get('emailcc')))
        self.object.email_bcc = ','.join(EMAIL_EXTRACT_REX.findall(self.request.POST.get('emailbcc')))
        self.object.email_subject = self.request.POST.get('emailsubject') or 'Report'
        self.object.email_body = self.request.POST.get('emailbody') or 'Report'
        if not (self.object.email_to or self.object.email_cc or self.object.email_bcc):
            return HttpResponse("Error: Recipients should be set!")

        self.object.day_offset = self.request.POST.get('dayoffset')
        self.object.firstday = timezone.make_aware(
            datetime.datetime.strptime(self.request.POST.get('firstday'), "%m/%d/%Y"))
        self.object.delivery_hour = self.request.POST.get('deliveryhour')
        self.object.delivery_hourmin = self.request.POST.get('deliveryhourmin')
        self.object.delivery_period_type = self.request.POST.get('schperiod')
        self.object.set_daily_periods(self.request.POST.getlist('schperioddaily[]'))
        formats = self.request.POST.getlist('formats[]')
        self.object.is_csv = 'csv' in formats
        self.object.is_pdf = 'pdf' in formats
        self.object.is_xls = 'xls' in formats

        self.object.next_run_time = self.object.get_next_run_time(self.object.firstday)
        self.object.save()
        return HttpResponse("OK")

    def get_context_data(self, *args, **kwargs):
        self.object = self.get_object()
        context = super().get_context_data(*args, **kwargs)
        if self.request.is_ajax():
            if self.request.method == 'GET':
                context['is_admin_view'] = self._user != self.request.user
                context['otheruser'] = ''
                if context['is_admin_view']:
                    context['otheruser'] = "?userid=%s" % self._user.id
                context['item'] = self.object
                context['hour_min_avail'] = [0, 30]
                context['export_formats'] = ['pdf', 'xls', 'csv']
                context['delivery_period_types'] = models.ScheduledReport.DELIVERY_PERIOD_TYPES
                context['weekdays'] = models.ScheduledReport.WEEKDAYS
        return context
