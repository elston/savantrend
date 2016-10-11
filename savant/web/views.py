import logging

from base64 import b64decode
from dateutil import parser as dateutil_parser
import datetime as dt
import json

from django.core.exceptions import PermissionDenied
from django.core.urlresolvers import reverse, reverse_lazy
from django.core.files.base import ContentFile
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, render_to_response
from django.http import (
    HttpResponse, HttpResponseRedirect, HttpResponseNotAllowed,
    JsonResponse
)
from django.template import RequestContext
from django.contrib.auth import authenticate, login, logout
from django.views.generic import TemplateView, UpdateView, ListView
from django.utils.decorators import method_decorator

from .import forms
# from datetime import datetime

from .import models
from . import utils
from .serializers import ReportSerializer
from .reports_views import get_reports_list
from .constants import (SETTINGS_DEFAULTS, DEC_FORMATS,
                        FONT_TYPES_NORMAL, FONT_SIZES_NORMAL, FONT_NAMES_NORMAL,
                        FONT_TYPES_GOOGLE, FONT_SIZES_GOOGLE, FONT_NAMES_GOOGLE,
                        )

logger = logging.getLogger('app')


def root(request):
    context = RequestContext(request)
    if request.user.is_authenticated():
        return HttpResponseRedirect(reverse('dashboard'))
    return HttpResponseRedirect(reverse('login'))
    # return render_to_response('web/root.html', {}, context)


@login_required
def menu_1(request):
    context = RequestContext(request, {})
    context['is_dashboard'] = True
    context['settings'] = json.dumps(request.user.get_all_settings_dict())
    context['defaults'] = json.dumps(SETTINGS_DEFAULTS)
    return render_to_response('web/menu_1.html', {}, context)


@login_required
def manage_access(request):
    user = request.user
    if not user.can_manage_subusers:
        return HttpResponse(
            'You do not have authorization to access this page.')

    users = user.get_sub_users()
    ctx = {'users': users}
    return render(request, 'web/manage_access.html', ctx)


@login_required
def add_user(request):
    if not request.user.can_manage_subusers:
        return HttpResponse(
            'You do not have authorization to perform that action.')

    if request.method == 'POST':
        user_form = forms.UserForm(request.POST)

        profile_form = forms.UserAccessForm(
            data=request.POST, user=request.user)

        if user_form.is_valid() and profile_form.is_valid():
            # Have the same model for two different forms
            # therefore getting data and save manually
            data = {}
            data.update(user_form.cleaned_data)
            data.update(profile_form.cleaned_data)

            subuser = models.User()
            subuser.parent_id = request.user.id
            subuser.username = data['username']
            subuser.set_password(data['password'])
            subuser.save()

            subuser.chain.add(*list(data['chain']))
            subuser.site.add(*list(data['site']))
            subuser.zone.add(*list(data['zone']))
            subuser.save()

            return HttpResponseRedirect(reverse('manage_access'))

    else:
        user_form = forms.UserForm()
        profile_form = forms.UserAccessForm(user=request.user)

    ctx = {'user_form': user_form, 'profile_form': profile_form}
    return render(request, 'web/add_user.html', ctx)


class ShowForm(TemplateView):
    """
    Frontend and Backend (admin).
    It is used for select2 multiselect (chains, sites, zones).

    Frontend - get client from request.user.
    Backend admin - get client from request.POST['client_id']
    """

    template_name = 'blocks/profile_form.html'

    def post(self, request, *args, **kwargs):
        user = request.user
        client_id = request.POST.get('client_id')
        if client_id:
            user = models.User.objects.get(id=client_id)

        context = self.get_context_data(**kwargs)
        context['profile_form'] = forms.UserAccessForm(
            initial=request.POST,
            user=user)
        return self.render_to_response(context)


class ChangeUser(UpdateView):
    """
    Client changes subuser on "manage_access" page
    """
    model = models.User
    form_class = forms.UserForm
    success_url = reverse_lazy('manage_access')
    template_name = 'web/change_user.html'

    def get_object(self, qs=None):
        obj = super().get_object(qs)
        if not obj.parent == self.request.user:
            raise PermissionDenied("Not allowed")
        return obj

    def get_initial(self):
        initial = super().get_initial()
        initial['user'] = self.request.user
        return initial


class ChangeOwnProfile(UpdateView):
    model = models.User
    form_class = forms.UserProfileForm
    success_url = reverse_lazy('login')
    template_name = 'web/change_own_profile.html'

    def get_object(self, qs=None):
        obj = super().get_object(qs)
        if not obj.id == self.request.user.id:
            raise PermissionDenied("Not allowed")
        return obj


class ChangeChain(UpdateView):
    model = models.Chain
    form_class = forms.ChainForm
    success_url = reverse_lazy('manage_access')
    template_name = 'web/change_chain.html'


class ChangeSite(UpdateView):
    model = models.Site
    form_class = forms.SiteForm
    success_url = reverse_lazy('manage_access')
    template_name = 'web/change_site.html'


class ChangeZone(UpdateView):
    model = models.Zone
    form_class = forms.ZoneForm
    success_url = reverse_lazy('manage_access')
    template_name = 'web/change_zone.html'


class ChangeUserAccess(UpdateView):
    model = models.User
    form_class = forms.UserAccessForm
    success_url = reverse_lazy('manage_access')
    template_name = 'web/change_useraccess.html'

    def get_object(self, qs=None):
        obj = super().get_object(qs)
        if not obj.parent == self.request.user:
            raise PermissionDenied("Not allowed")
        return obj

    def get_initial(self):
        initial = super().get_initial()
        initial['user'] = self.request.user
        return initial


@login_required
def delete_user(request, pk):
    perm_msg = 'You do not have authorization to perform that action.'
    target = models.User.objects.get(pk=pk)

    if not request.user.can_manage_subusers:
        return HttpResponse(perm_msg)

    if not request.user.get_sub_users().filter(id=pk).exists():
        return HttpResponse(perm_msg)

    if request.method == 'POST':
        target.delete()
        return HttpResponseRedirect(reverse('manage_access'))

    ctx = {'target': target}
    return render(request, 'web/confirm_delete.html', ctx)


def login_view(request):
    if request.method != 'POST':
        return render(request, 'web/login.html')

    username = request.POST['username']
    password = request.POST['password']

    try:
        models.User.objects.get(username=username)
    except models.User.DoesNotExist:
        return HttpResponse('Invalid username')

    user = authenticate(username=username, password=password)
    if user is None:
        return HttpResponse('Invalid password')

    if not user.is_active:
        return HttpResponse('Your account is disabled.')

    login(request, user)
    return HttpResponseRedirect(reverse('dashboard'))


@login_required
def logout_view(request):
    logout(request)
    return HttpResponseRedirect('/')


def change_data_dict(data):
    change_dict = {
        'chain': 'Chain_Id',
        'site': 'Site_Id',
        'zone': 'Zone_Id',
        'visitors_in': 'Visitors_In',
        'visitors_out': 'Visitors_Out',
        'sales': 'Sales',
        'transactions': 'Transactions',
        'associates': 'Associates',
        'items': 'Items',
        'date_time': 'Date_Time',
        'chain_name': 'Chain_Name',
        'site_name': 'Site_Name',
        'zone_name': "Zone_Name",
        'id': 'id',
    }

    lines = []
    for lin in data:
        line = {}
        for key in lin.keys():
            if key in change_dict:
                line[change_dict[key]] = lin[key]

        lines.append(line)
    return lines


@login_required
def api_test(request):
    user = request.user

    chains = user.get_all_chains().values_list('id', flat=True)
    sites = user.get_all_sites().values_list('id', flat=True)
    zones = user.get_all_zones().values_list('id', flat=True)
    total_reports = user.get_all_reports().count()

    ctx = {
        'user': user,
        'chains': chains,
        'sites': sites,
        'zones': zones,
        'total_reports': total_reports
    }
    return render(request, 'web/api_test.html', ctx)


class SettingsView(TemplateView):
    template_name = 'web/settings.html'

    def get_context_data(self):
        context = super().get_context_data()
        user = self.request.user
        userid = user.id
        context['adminuse'] = False
        context['base_template'] = 'web/base.html'
        context['allreports'] = get_reports_list(user)
        if self.request.user.is_admin:
            if self.request.method == 'GET':
                userid = self.request.GET.get('userid')
            elif self.request.method == 'POST':
                userid = self.request.POST.get('userid')
            if userid:
                user = models.User.objects.get(pk=userid)
            userid = user.id
            context['adminuse'] = True
            context.update({
                'has_permission': True,
                'site_title': 'Savantrend',
                'site_header': 'Savantrend',
                'title': 'Settings for user %s' % user.get_short_name(),
                'app_label': 'Settings for user %s' % user.get_short_name(),
            })
            context['base_template'] = 'web/settings_adminbase.html'
        if not self.request.is_ajax():
            context['allkpis'] = models.Kpi.objects.all()
            context['settings'] = json.dumps(user.get_all_settings_dict())
            context['defaults'] = json.dumps(SETTINGS_DEFAULTS)
            context['dec_formats'] = DEC_FORMATS
            context['font_types_normal'] = FONT_TYPES_NORMAL
            context['font_types_normal_json'] = json.dumps(FONT_TYPES_NORMAL)
            context['font_types_google'] = FONT_TYPES_GOOGLE
            context['font_types_google_json'] = json.dumps(FONT_TYPES_GOOGLE)
            context['font_sizes_normal'] = FONT_SIZES_NORMAL
            context['font_sizes_google'] = FONT_SIZES_GOOGLE
            context['font_names_normal'] = json.dumps(FONT_NAMES_NORMAL)
            context['font_names_google'] = json.dumps(FONT_NAMES_GOOGLE)
            context['logo_maxwidth'] = 100
            context['logo_maxheight'] = 100
            context['userobject'] = user
            context['userid'] = user.id
            context['logo_url'] = ""
            if user.logo.name:
                context['logo_url'] = user.logo.url
        return context

    def get(self, request):
        if not self.request.user.can_customize:
            return PermissionDenied("You cannot do that")
        return super().get(request)

    def post(self, request):
        if not self.request.user.can_customize:
            return PermissionDenied("You cannot do that")
        if not self.request.is_ajax():
            return super().post(request)
        data = json.loads(self.request.POST['data'])
        # print(data)
        if data:
            userid = self.request.user.id
            # for admin user we can trust userid passed in POST
            if self.request.user.is_admin:
                userid = self.request.POST.get('userid', userid)

            for k, value in data.items():
                svalue = str(value)
                if k == 'logo':
                    user = models.User.objects.get(id=userid)
                    if svalue:
                        image_data = b64decode(svalue.split(',')[1])
                        logoname = "logo-%s.png" % (userid)
                        # setattr(user, 'logo', ContentFile(image_data, logoname))
                        user.logo = ContentFile(image_data, logoname)
                    else:
                        user.logo = None
                    user.save()
                else:
                    models.Setting.objects.update_or_create(
                        user_id=userid, code=k, defaults={'value': svalue[:250]}
                    )
        return HttpResponse("OK")


def format_date(request):
    if request.method != 'POST':
        return JsonResponse(status=405, data='', safe=False)
    try:
        data = json.loads(request.body.decode())
        text = data['text']
        if 'time' in data:
            time = dateutil_parser.parse(data['time'])
        else:
            time = dt.datetime.utcnow()
    except (ValueError, KeyError):
        return JsonResponse(status=400, data='', safe=False)

    if not utils.validate_date_format(text):
        return JsonResponse(
            status=400,
            data={'error': ['Invalid date format.']}
        )

    formatted = utils.replace_date_placeholders(text, time)
    return JsonResponse(data=json.dumps(formatted), safe=False)
