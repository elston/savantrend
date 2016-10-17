import datetime

from django.core.urlresolvers import reverse, reverse_lazy
from django.conf.urls import patterns, url
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group
from django.shortcuts import render

from .models import (
    Kpi, Chain, Site, Zone, Report, User, TrialPeriod, WarningPeriod,
    Warning, Emailer, Logging, Setting, ClientManagement)
from .forms import (
    UserCreationForm, UserChangeForm, SiteAdminForm, ZoneAdminForm)
from .filters import SubuserFilter, WarningFilter
from .import views_admin

admin.site.unregister(Group)


class PopupMixin:
    def get_popup(self, url, name, width, height):
        opt = 'left=300, top=200, resizable=0, location=0, scrollbars=0,'
        opt += 'width={}, height={}'.format(width, height)
        popup = 'window.open("{}", "{}", "{}")'.format(url, name, opt)
        return popup


@admin.register(User)
class MyUserAdmin(PopupMixin, UserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (
            'Info',
            {'fields':
                (
                    'email',
                    'first_name',
                    'last_name',
                    'phone',
                    'company',
                    'skype',
                    'is_active',
                    'is_admin',
                    # 'is_superadmin',
                    'parent',
                    'logo')}
        ),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username',
                'password1',
                'password2',
                'trial_period',
                'trial_period_custom',
                'type_period',
            )}),
    )

    empty_value_display = ''
    list_display = ('id', 'username')  # overrides in changelist_view
    list_filter = ()  # overrides in changelist_view
    list_display_links = ('id',)
    search_fields = ('first_name', 'last_name', 'email', 'username')
    ordering = ('username',)
    filter_horizontal = ()

    def user_actions(self, obj):
        s = '<a href="/admin/web/chain/?client=%d">Chains</a> | ' % obj.id
        s += '<a href="/admin/web/site/?client=%d">Sites</a> | ' % obj.id
        s += '<a href="/admin/web/zone/?client=%d">Zones</a> | <br/>' % obj.id
        s += '<a href="/admin/web/report/?client=%d">Raw Data</a> | ' % obj.id
        s += '<a href="/admin/web/custom/enable_integration/%d">Enable Integration</a> | ' % obj.id
        s += '<a href="/admin/web/custom/enable_reports/%d">Enable Reports</a>' % obj.id
        return s

    user_actions.short_description = 'Actions'
    user_actions.allow_tags = True

    def user_subusers(self, obj):
        url = '/admin/web/custom/add_subuser/{}/'.format(obj.id)
        addurl = '<small><a href="%s">Add subuser</a></small>' % url
        cnt_txt = "%s" % obj.num_subusers
        if obj.num_subusers > 0:
            cnt_txt = '<a href="/admin/web/user/?subuser=true&parent_id={}">{}</a>'
            cnt_txt = cnt_txt.format(obj.id, obj.num_subusers)
        return cnt_txt + " | " + addurl

    user_subusers.short_description = 'Sub-users'
    user_subusers.allow_tags = True

    def settings(self, obj):
        tracker = ""
        tracker += '<a href="/admin/web/custom/scheduler/?userid=%d">Scheduler</a> | <br/>' % (obj.id)
        if obj.is_client or obj.allow_settings:
            tracker += '<a href="/admin/web/custom/settings/?userid=%d">Customize</a><br/>' % (obj.id)
        else:
            tracker += 'No Access to Customize<br>'
        return tracker

    settings.short_description = 'Tracker'
    settings.allow_tags = True

    def show_chains(self, obj):
        """
        Show chains in subusers list_display
        """
        s = ''
        for chain in obj.chain.all():
            s += '{}<br />'.format(chain.name)
        return s

    show_chains.short_description = 'Chains'
    show_chains.allow_tags = True

    def show_sites(self, obj):
        """
        Show sites in subusers list_display
        """
        s = ''
        for chain in obj.chain.all():
            s += '<b style="text-align:center">:: {} ::</b><br />'\
                .format(chain.name)
            for site in obj.site.filter(chain=chain):
                s += '{}<br />'.format(site.name)
        return s

    show_sites.short_description = 'Sites'
    show_sites.allow_tags = True

    def show_zones(self, obj):
        """
        Show zones in subusers list_display
        """
        s = ''
        for site in obj.site.all().order_by('chain'):
            s += '<b>{} :: {}</b><br />'.format(site.chain.name, site.name)
            for zone in site.zone.all():
                s += '{}<br />'.format(zone.name)
        return s

    show_zones.short_description = 'Zones'
    show_zones.allow_tags = True

    def show_kpis(self, obj):
        url = '/admin/web/custom/enable_integration/{}/'.format(obj.id)
        onclick = "onclick='return {}'".format(
            self.get_popup(url, 'Enable Integration', 500, 560))
        s = '<a {} style="cursor:pointer;">Enable Integration</a>'.format(onclick)
        return s

    show_kpis.short_description = "Enabled KPIs"
    show_kpis.allow_tags = True

    def add_subuser(self, obj):
        """
        Add subuser with additional functionality: chains, sites, zones
        """
        url = '/admin/web/custom/add_subuser/{}/'.format(obj.id)
        return '<a href="%s">Add subuser</a>' % url
        onclick = "onclick='return {}'".format(
            self.get_popup(url, 'Add subuser', 800, 600))
        s = '<a {} style="cursor:pointer;">add</a>'.format(onclick)
        return s

    add_subuser.short_description = 'Add subuser'
    add_subuser.allow_tags = True

    def change_subuser(self, obj):
        """
        Change subuser with additional functionality: chains, sites, zones
        """
        url = '/admin/web/custom/change_subuser/{}/'.format(obj.id)
        return '%s <br/><a href="%s">Change subuser</a>' % (obj.username, url)
        onclick = "onclick='return {}'".format(
            self.get_popup(url, 'Change subuser', 800, 600))
        style = ' style="cursor:pointer;text-decoration:underline;"'
        s = '<a {} {}>{}</a>'.format(onclick, style, obj.username)
        return s

    change_subuser.short_description = 'Username'
    change_subuser.allow_tags = True

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """
        Show in parent select only parent=None users
        """
        if db_field.name == 'parent':
            kwargs['queryset'] = User.objects.filter(parent_id=None)
            return db_field.formfield(**kwargs)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def changelist_view(self, request, extra_context=None):
        if request.GET.get('parent_id'):
            self.list_display = (
                'id',
                'parent',
                'change_subuser',
                'show_chains',
                'show_sites',
                'show_zones',
                'settings'
            )
            self.list_filter = (SubuserFilter, )
        else:
            self.list_display = (
                'id',
                'company',
                'username',
                'email',
                'user_actions',
                'settings',
                'user_subusers',
                # 'add_subuser',
                'is_active',
                'is_admin'
            )
            self.list_filter = ('is_admin', 'is_active', SubuserFilter)

        # show only clients (not sub-users) by default
        if 'subuser' not in request.GET:
            q = request.GET.copy()
            q['subuser'] = 'false'
            request.GET = q
            request.META['QUERY_STRING'] = request.GET.urlencode()

        return super().changelist_view(request, extra_context)


@admin.register(ClientManagement)
class ClientManagementAdmin(PopupMixin, UserAdmin):
    actions = None
    list_display = (
        'username',
        'full_name',
        'start_date',
        'end_date',
        'warnings',
        'trial_control',
        'is_active'
    )
    empty_value_display = '-'
    list_display_links = None
    list_editable = ('is_active',)
    list_filter = ('has_trial', WarningFilter)
    filter_horizontal = ()

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.filter(parent=None)

    def has_add_permission(self, request):
        return False

    def warnings(self, obj):
        s = ''
        for w in Warning.objects.filter(client_id=obj.id):
            color = 'green' if w.client_viewed else 'red'
            if w.client_viewed:
                url = '/admin/web/warning/print/{}/'.format(w.id)
                onclick = "onclick='return {}'".format(
                    self.get_popup(url, 'Print', 500, 350))
            else:
                onclick = ''
            s += '<p style="color:{};cursor:pointer;" {}>'\
                .format(color, onclick)
            s += '{}-day warning {}</p>'.format(
                w.period.days, w.dt_created.strftime('%Y-%m-%d'))
            s += '</p>'
        return s

    warnings.short_description = 'Warnings'
    warnings.allow_tags = True

    def full_name(self, obj):
        return obj.get_full_name()

    full_name.short_description = 'Name'

    def trial_control(self, obj):
        url = '/admin/web/custom/trial_control/{}/'\
            .format(obj.id)
        return '<a href="%s">Trial Control</a>' % url
        onclick = "onclick='return {}'".format(
            self.get_popup(url, 'Trial control', 700, 650))

        s = '<a href="#" {}>Trial control</a>'.format(onclick)
        return s

    trial_control.short_description = 'Trial control'
    trial_control.allow_tags = True


class ClientSelectMixin:
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """
        Show in client select only parent=None users
        """
        if db_field.name == 'client':
            kwargs['queryset'] = User.objects.filter(parent_id=None)
            return db_field.formfield(**kwargs)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(Chain)
class ChainAdmin(ClientSelectMixin, admin.ModelAdmin):
    list_display = ('id', 'chain_id', 'client', 'name')

    def get_model_perms(self, request):
        """
        Hide from index page
        """
        return {}


# @admin.register(Kpi)
# class KpiAdmin(admin.ModelAdmin):
#     pass


@admin.register(Site)
class SiteAdmin(ClientSelectMixin, admin.ModelAdmin):
    form = SiteAdminForm
    list_display = ('id', 'site_id', 'client', 'name', 'chain')

    class Media:
        js = (
            'admin/jscustom/custom_add.js',
            'admin/jscustom/site_add.js',
        )

    def get_model_perms(self, request):
        return {}


@admin.register(Zone)
class ZoneAdmin(ClientSelectMixin, admin.ModelAdmin):
    form = ZoneAdminForm
    list_display = ('id', 'zone_id', 'client', 'name', 'site')

    class Media:
        js = (
            'admin/jscustom/custom_add.js',
            'admin/jscustom/zone_add.js',
        )

    def get_model_perms(self, request):
        return {}


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'client',
        'chain',
        'site',
        'zone',
    )

    def get_model_perms(self, request):
        return {}

    def has_add_permission(self, request):
        return False


@admin.register(Logging)
class LoggingAdmin(admin.ModelAdmin):
    list_display = (
        'dt',
        'level',
        'http_code',
        'logger_name',
        'module',
        'exc_info',
        'message'
    )
    list_filter = ('level', 'logger_name')

    def has_add_permission(self, request, obj=None):
        return False

    def get_model_perms(self, request):
        return {}


class EmailerReportListFilter(admin.SimpleListFilter):
    title = 'Is Report'
    parameter_name = 'report'

    def lookups(self, request, model_admin):
        return (
            ('yes', 'Report'),
            ('no', 'Not Report'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.all()
        if self.value() == 'no':
            return queryset.filter(related_report=None)


@admin.register(Emailer)
class EmailerAdmin(admin.ModelAdmin):
    list_filter = ('result', EmailerReportListFilter)
    list_display = (
        'dt_created',
        'dt_sent',
        'email_to',
        'email_from',
        'subject',
        'type',
        'result',
        'sent'
    )

    def changelist_view(self, request, extra_context=None):
        # Delete rows that older than two weeks
        dt = datetime.date.today() - datetime.timedelta(days=14)

        Emailer.objects.filter(sent=True, dt_sent__lt=dt).delete()
        return super().changelist_view(request, extra_context)

    def has_add_permission(self, request):
        return False


@admin.register(TrialPeriod)
class TrialPeriodAdmin(admin.ModelAdmin):
    list_display = ('name', 'type_period', 'value')


@admin.register(WarningPeriod)
class WarningPeriodAdmin(admin.ModelAdmin):
    list_display = ('days', 'message')


@admin.register(Warning)
class WarningAdmin(admin.ModelAdmin):
    warn_template = 'admin/warning/print.html'
    list_display = ('client', 'period', 'client_viewed')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_urls(self):
        urls = super().get_urls()
        my_urls = patterns(
            '',
            (
                r'print/(?P<id>\d+)/$',
                self.admin_site.admin_view(self.print)),
        )
        return my_urls + urls

    def print(self, request, id=None):
        warning = Warning.objects.get(id=id)
        admin_email = Setting.objects.get(code='warning_email').value
        context = {'warning': warning, 'admin_email': admin_email}
        return render(request, self.warn_template, context)


def create_pattern(view, path, func_name):
    ptn = url(path, admin.site.admin_view(getattr(view, func_name)))
    return patterns('', ptn,)


def get_admin_urls(urls):
    def get_urls():
        my_urls = patterns('')

        tup = (
            User,
            ClientManagement,
        )

        for MyModel in tup:
            for path, view_name in MyModel.get_admin_urls():
                my_urls += create_pattern(views_admin, path, view_name)

        return my_urls + urls
    return get_urls

admin_urls = get_admin_urls(admin.site.get_urls())
admin.site.get_urls = admin_urls
