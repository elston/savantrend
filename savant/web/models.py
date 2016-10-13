
import json
import datetime

from django.core.urlresolvers import reverse
from django.core.files.base import ContentFile
from django.db import models
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone
from django.contrib.humanize.templatetags.humanize import ordinal
from django.contrib.postgres.fields import ArrayField

from dateutil.relativedelta import relativedelta

from .constants import SETTINGS_DEFAULTS, KNOWN_REPORTS
from .utils import parse_email_recipients


class UserManager(BaseUserManager):
    def create_user(self, username, password):
        if not username:
            raise ValueError('Please input username.')
        user = self.model(username=username)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password):
        user = self.create_user(username, password=password)
        user.is_admin = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    DAYS = 'days'
    YEARS = 'years'
    PERIOD_CHOICES = ((DAYS, 'days'), (YEARS, 'years'))

    username = models.SlugField(max_length=50, unique=True, db_index=True)
    email = models.EmailField(
        max_length=255, blank=True, null=True, unique=True, default=None)
    first_name = models.CharField(max_length=50, blank=True, default='')
    last_name = models.CharField(max_length=50, blank=True, default='')
    company = models.CharField("Client Name", max_length=255, blank=True, default='')
    phone = models.CharField(max_length=50, default='', blank=True)
    skype = models.CharField(max_length=50, default='', blank=True)
    num_subusers = models.SmallIntegerField(default=0)
    is_active = models.BooleanField(default=True, verbose_name='active')
    allow_settings = models.BooleanField(default=False, verbose_name='Allow Customize Access')
    allow_subusers = models.BooleanField(default=False, verbose_name='Allow Subusers As Client')
    is_admin = models.BooleanField(default=False, verbose_name='admin')
    is_superadmin = models.BooleanField(default=False, verbose_name='superadmin')    
    parent = models.ForeignKey(
        'self', null=True, blank=True, related_name='children',
        on_delete=models.CASCADE)
    chain = models.ManyToManyField('Chain', blank=True)
    site = models.ManyToManyField('Site', blank=True)
    zone = models.ManyToManyField('Zone', blank=True)
    enabled_kpis = models.ManyToManyField('Kpi', blank=True)
    enabled_reports = ArrayField(
        models.CharField(max_length=200),
        default=KNOWN_REPORTS
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    type_period = models.CharField(
        verbose_name='type of custom period',
        max_length=10, choices=PERIOD_CHOICES, blank=True,
        help_text='Set it only if you want to set custom trial period')
    trial_period = models.ForeignKey(
        'TrialPeriod', null=True, blank=True, on_delete=models.SET_NULL)
    trial_period_custom = models.PositiveSmallIntegerField(
        verbose_name='custom trial period', null=True, blank=True,
        help_text='If you set custom period, it will override selected period')
    has_trial = models.BooleanField(default=False)
    logo = models.ImageField(blank=True, null=True, upload_to="logos")

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name_plural = 'Clients'
        ordering = ['username']
        app_label = 'web'

    def __str__(self):
        return self.username

    def get_full_name(self):
        return self.first_name + ' ' + self.last_name

    def get_short_name(self):
        return self.username

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    @property
    def is_staff(self):
        return self.is_admin

    @property
    def can_customize(self):
        return self.is_admin or self.is_client or self.allow_settings

    def get_available_reports(self):
        if self.is_admin:
            return KNOWN_REPORTS
        elif self.is_client:
            return self.enabled_reports
        else:
            return self.parent.enabled_reports

    @property
    def can_manage_subusers(self):
        return self.is_admin or self.is_client or self.allow_subusers

    @property
    def is_client(self):
        """
        Client has option to create sub-users
        that will have parent client
        """
        return self.parent is None

    def get_change_url(self):
        return reverse('change_useraccess', kwargs={'pk': self.id})

    def get_all_chains(self, subset=None):
        qset = self.chain.all()
        if self.is_client:
            qset = Chain.objects.filter(client_id=self.id)
        if subset:
            qset = qset.filter(id__in=subset)
        return qset

    def get_all_sites(self, subset=None):
        qset = self.site.all()
        if self.is_client:
            qset = Site.objects.filter(client_id=self.id)
        if subset:
            qset = qset.filter(id__in=subset)
        return qset

    def get_all_zones(self, subset=None):
        qset = self.zone.all()
        if self.is_client:
            qset = Zone.objects.filter(client_id=self.id)
        if subset:
            qset = qset.filter(id__in=subset)
        return qset

    def get_all_reports(self):
        if self.is_client:
            return Report.objects.filter(client_id=self.id)

        reports = Report.objects.filter(client_id=self.parent_id)
        if self.zone:
            reports = reports.filter(zone__in=self.zone.all())
        elif self.site:
            reports = reports.filter(site__in=self.site.all())
        elif self.chain:
            reports = reports.filter(chain__in=self.chain.all())
        return reports

    def get_all_settings(self):
        if self.can_customize:
            usettings = Setting.objects.filter(user_id=self.id)
        else:  # for sub-users who do not have access to customization - all goes from parent
            usettings = Setting.objects.filter(user_id=self.parent_id)
        return usettings

    def get_all_settings_dict(self):
        settings_dict = dict((s['code'], s['value'])
                             for s in self.get_all_settings().values('code', 'value'))
        settings_new = Setting.get_defaults()
        settings_new.update(settings_dict)
        return settings_new

    def copy_settings_from_parent(self):
        if not self.parent:
            return
        mysettings = self.parent.get_all_settings_dict()
        for key, value in mysettings.items():
            Setting.objects.update_or_create(user=self, code=key, defaults={'value': value})
        if self.parent.logo.name:
            new_logo = ContentFile(self.parent.logo.read())
            new_logo.name = self.parent.logo.name
            self.logo = new_logo
        else:
            self.logo = None

    def get_logo(self):
        if not self.can_customize:
            return self.parent.get_logo()
        return self.logo

    def get_kpis(self):
        if not self.is_client:
            return self.parent.get_kpis()

        default_enable_all = False  # Enable this if by default all enabled (otherwise - only VISITORS)
        kpinames = list(self.enabled_kpis.values_list('name', flat=True))
        if default_enable_all and not kpinames:
            kpinames = list(Kpi.objects.all().values_list('name', flat=True))
        if 'FOOTFALL' not in kpinames:
            kpinames = ['FOOTFALL'] + kpinames  # VISITORS always enabled
        allowed_names = []
        for bn in Kpi.basic_kpis().values_list('name', flat=True):  # non-calculatable
            if bn in kpinames:
                allowed_names.append(bn)
        for kn, depks in Kpi.DEPENDENCIES.items():
            # allow dependent items only if all dependencies are enabled
            for dn in depks:
                if dn not in allowed_names:
                    break
            else:
                allowed_names.append(kn)
        kpis = Kpi.objects.filter(name__in=allowed_names)
        return kpis

    @staticmethod
    def get_admin_urls():
        sp = []
        from .views import SettingsView
        sp.append(
            (
                r'^web/custom/add_subuser/(?P<user_id>\d+)/$',
                'add_subuser'))
        sp.append(
            (
                r'^web/custom/change_subuser/(?P<id>\d+)/$',
                'change_subuser'))
        sp.append(
            (
                r'^web/custom/enable_integration/(?P<id>\d+)/$',
                'enable_integration'))
        sp.append(
            (
                r'^web/custom/enable_reports/(?P<id>\d+)/$',
                'enable_reports'))
        sp.append(
            (
                r'^web/custom/settings/$',
                'settings_view'))
        sp.append(
            (
                r'^web/custom/scheduler/$',
                'scheduled_tasks_list_view'))
        return sp

    def get_sub_users(self):
        return User.objects.filter(parent_id=self.id)

    def get_trial_period(self):
        """
        Custom trial period is primary, if it is set.
        Getting trial in days
        """
        koeff = 1 if self.type_period == self.DAYS else 365

        if self.trial_period_custom:
            return self.trial_period_custom * koeff

        if self.trial_period is None:
            return 0

        tp = TrialPeriod.objects.get(id=self.trial_period.id)
        return tp.get_trial_period()

    def clear_trial_period(self):
        self.trial_period = None
        self.trial_period_custom = None
        self.type_period = ''
        self.start_date = None
        self.end_date = None
        Warning.objects.filter(client_id=self.id).delete()

    def activate_subusers(self):
        """
        When client active - all subusers should be active also
        """
        q = User.objects.filter(parent_id=self.id)
        for su in q:
            if not su.is_active:
                su.is_active = True
                su.save()

    def deactivate_subusers(self):
        """
        When client is not active - all subusers should be not active also
        """
        q = User.objects.filter(parent_id=self.id)
        for su in q:
            if su.is_active:
                su.is_active = False
                su.save()

    def set_trial_dates(self):
        days = self.get_trial_period()
        if days == 0:
            return

        self.start_date = datetime.date.today()
        delta = datetime.timedelta(days=days)
        self.end_date = self.start_date + delta

    def save(self, *args, **kwargs):
        if self.email is not None and self.email.strip() == "":
            self.email = None

        # Indexing has_trial onsave
        tp = self.get_trial_period()
        self.has_trial = True if tp > 0 else False

        # When user created, we should set dates
        created = True if not self.pk else False

        access_changed = False
        if not created:
            saved_instance = User.objects.get(pk=self.pk)
            if self.can_customize and not saved_instance.can_customize:
                access_changed = True

        super().save(*args, **kwargs)

        if self.is_active:
            self.activate_subusers()
        else:
            self.deactivate_subusers()

        if created or access_changed:
            self.copy_settings_from_parent()
        if created:
            self.set_trial_dates()
        if created or access_changed:
            self.save()


@receiver(post_save, sender=User)
def reindex_subusers(sender, instance, **kwargs):
    """
    Reindex the number of subusers to 'num_subusers' field
    """
    if instance.parent is not None:
        user = instance.parent
        count = User.objects.filter(parent_id=user.id).count()
        if count != user.num_subusers:
            user.num_subusers = count
            user.save()


@receiver(post_delete, sender=User)
def reindex_subusers_ondelete(sender, instance, **kwargs):
    """
    Reindex the number of subusers to 'num_subusers' field.
    When we delete client with all subusers catch error
    and pass reindexing
    """
    try:
        reindex_subusers(sender, instance, **kwargs)
    except User.DoesNotExist:
        pass


class ClientManagement(User):
    class Meta:
        proxy = True
        app_label = 'web'

    @staticmethod
    def get_admin_urls():
        sp = []
        sp.append(
            (
                r'^web/custom/trial_control/(?P<user_id>\d+)/$',
                'trial_control'
            )
        )
        return sp


class Kpi(models.Model):
    """ Dictionary """
    name = models.CharField(max_length=16, null=False, blank=False)
    displayname = models.CharField(max_length=64, null=False, blank=False)
    color = models.CharField(max_length=16, null=False, blank=False)

    BASIC_KPIS = ['FOOTFALL', 'SALES', 'TRANS', 'UNITS', 'STAFF']
    DEPENDENCIES = {
        '%CONV': ('TRANS', 'FOOTFALL'),
        'ATV': ('SALES', 'TRANS'),
        'UPT': ('UNITS', 'TRANS'),
        'ACV': ('SALES', 'FOOTFALL'),
        'CTSR': ('FOOTFALL', 'STAFF'),
        'UPC': ('UNITS', 'FOOTFALL'),
        'SPS': ('SALES', 'STAFF'),
    }

    class Meta:
        ordering = ('id', )

    @classmethod
    def basic_kpis(cls):
        return cls.objects.all().exclude(name__in=cls.DEPENDENCIES.keys())

    @property
    def nameclean(self):
        return self.name.replace('%', '')

    @property
    def css(self):
        return self.name.replace('%', '').lower()

    def __str__(self):
        return "%s" % (self.name)


class Chain(models.Model):
    name = models.CharField(max_length=200, default='')
    client = models.ForeignKey(
        User, related_name='user_chain', on_delete=models.CASCADE)
    chain_id = models.IntegerField(null=False)

    class Meta:
        unique_together = ('client', 'chain_id')
        app_label = 'web'
        ordering = ('name', )

    def __str__(self):
        return self.name


class Site(models.Model):
    name = models.CharField(max_length=200, default='')
    chain = models.ForeignKey(
        Chain, related_name='site', null=True, on_delete=models.CASCADE)
    client = models.ForeignKey(
        User, related_name='user_site', on_delete=models.CASCADE)
    site_id = models.IntegerField(null=False)

    class Meta:
        unique_together = ('client', 'site_id')
        app_label = 'web'
        ordering = ('chain_id', 'name')

    def __str__(self):
        return '{} ({})'.format(self.name, self.chain.name)


class Zone(models.Model):
    name = models.CharField(max_length=200, default='')
    site = models.ForeignKey(
        Site, related_name='zone', null=True, on_delete=models.CASCADE)
    client = models.ForeignKey(
        User, related_name='user_zone', on_delete=models.CASCADE)
    zone_id = models.IntegerField(null=False)

    class Meta:
        unique_together = ('client', 'zone_id')
        app_label = 'web'
        ordering = ('site_id', 'name')

    def __str__(self):
        return self.name


class Report(models.Model):
    chain = models.ForeignKey(
        Chain, related_name='chain_report', on_delete=models.CASCADE)
    site = models.ForeignKey(
        Site, related_name='site_report', on_delete=models.CASCADE)
    zone = models.ForeignKey(
        Zone, related_name='zone_report', on_delete=models.CASCADE)
    day = models.DateField(null=True)
    datetime = models.DateTimeField(null=True)
    visitors_in = models.IntegerField(null=True)
    visitors_out = models.IntegerField(null=True)
    occupancy = models.IntegerField(null=True)
    sales = models.FloatField(null=True, default=0)
    transactions = models.IntegerField(null=True, default=0)
    associates = models.IntegerField(null=True, default=0)
    items = models.IntegerField(null=True, default=0)
    zone_name = models.CharField(max_length=100, default='')
    site_name = models.CharField(max_length=100, default='')
    chain_name = models.CharField(max_length=100, default='')
    client = models.ForeignKey(
        User, related_name='user_report', on_delete=models.CASCADE)

    class Meta:
        app_label = 'web'

    @property
    def date_time(self):
        return "%s%s" % (self.datetime.strftime("%Y-%m-%d %H:%M"), ':00.000')


class TrialPeriod(models.Model):
    DAYS = 'days'
    YEARS = 'years'
    PERIOD_CHOICES = ((DAYS, 'days'), (YEARS, 'years'))

    name = models.CharField(max_length=20)
    value = models.SmallIntegerField()
    type_period = models.CharField(max_length=10, choices=PERIOD_CHOICES)

    class Meta:
        app_label = 'web'
        ordering = ('value',)

    def __str__(self):
        return self.name

    def get_trial_period(self):
        """Getting days"""
        koeff = 1 if self.type_period == self.DAYS else 365
        return self.value * koeff


class WarningPeriod(models.Model):
    days = models.SmallIntegerField()
    message = models.CharField(max_length=255)

    class Meta:
        app_label = 'web'
        ordering = ('-days',)

    def __str__(self):
        return str(self.days)

    @property
    def name(self):
        s = 'day' if self.days == 1 else 'days'
        return '{} {}'.format(self.days, s)


class Warning(models.Model):
    """
    As email is not manadatory, we need email field to know about
    does client have email in particular day.
    """
    client = models.ForeignKey(User, on_delete=models.CASCADE)
    period = models.ForeignKey(WarningPeriod, on_delete=models.CASCADE)
    client_viewed = models.BooleanField(default=False)
    dt_created = models.DateTimeField(auto_now_add=True)
    dt_viewed = models.DateTimeField(null=True, blank=True)
    email = models.CharField(max_length=100, blank=True, default='')

    class Meta:
        app_label = 'web'
        ordering = ('dt_created',)

    def __str__(self):
        return str(self.id)

    @property
    def has_email(self):
        if self.email:
            return True
        return False


class Emailer(models.Model):
    TEXT = 'text'
    HTML = 'html'
    TYPES = [(TEXT, 'text'), (HTML, 'html')]

    email_to = models.EmailField(max_length=100)
    email_to_many = models.CharField(max_length=512, blank=True, null=True)  # comma-separated expected
    email_cc_many = models.CharField(max_length=512, blank=True, null=True)  # comma-separated expected
    email_bcc_many = models.CharField(max_length=512, blank=True, null=True)  # comma-separated expected
    email_from = models.EmailField(max_length=100)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    type = models.CharField(max_length=4, choices=TYPES, default=TEXT)
    report = models.TextField(default='')
    sent = models.BooleanField(default=False)
    result = models.BooleanField(default=False)
    dt_created = models.DateTimeField(auto_now_add=True)
    dt_sent = models.DateTimeField(null=True, blank=True)
    attachment_pathes = models.TextField(blank=True, null=True)  # JSON-packed list of dicts

    def __str__(self):
        return str(self.id)

    class Meta:
        verbose_name = 'Email'
        verbose_name_plural = 'Emails'
        ordering = ['-dt_created']

    def get_attachment_pathes(self):
        if not self.attachment_pathes:
            return []
        return json.loads(self.attachment_pathes or '[]')

    def set_attachment_pathes(self, value):
        if isinstance(value, list):
            self.attachment_pathes = json.dumps(value)
        else:
            self.attachment_pathes = ''

    @property
    def recipients(self):
        # for 'to' field only!
        rcpts = []
        if self.email_to:
            rcpts.append(self.email_to.strip())
        if self.email_to_many:
            rcpts.extend(map(str.strip, self.email_to_many.split(',')))
        return ', '.join(rcpts)

    @recipients.setter
    def recipients(self, value):
        self.email_to = ''
        self.email_to_many = parse_email_recipients(value)

    def get_recipients_list(self, kind='to'):
        if kind == 'to':
            return (self.recipients or '').split(',')
        elif kind == 'cc':
            return (self.email_cc_many or '').split(',')
        elif kind == 'bcc':
            return (self.email_bcc_many or '').split(',')
        return []

    def set_recipients(self, value, kind='to'):
        raise NotImplementedError()

    def is_report(self):
        return ReportLog.objects.filter(email_id=self.id).exists()


class ReportLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    report_id = models.CharField(max_length=32)
    name = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    is_pdf = models.BooleanField(null=False, blank=True, default=False)
    is_csv = models.BooleanField(null=False, blank=True, default=False)
    is_xls = models.BooleanField(null=False, blank=True, default=False)
    parameters = models.TextField(null=False, blank=True)
    calendar_date_selected = models.CharField(max_length=64, blank=True)
    is_manual = models.BooleanField(null=False, blank=True)
    is_email = models.BooleanField(null=False, blank=True)
    email = models.ForeignKey(Emailer, null=True, blank=True, on_delete=models.SET_NULL, related_name='related_report')
    scheduled = models.ForeignKey('ScheduledReport', null=True, blank=True)

    def report_relfilepath(self):
        return "%s/%s" % (self.user_id, int(self.created_at.timestamp()))


class Logging(models.Model):
    http_code = models.CharField(max_length=10, default='')
    level = models.CharField(max_length=8, default='')
    logger_name = models.CharField(max_length=20, default='')
    module = models.CharField(max_length=100, default='')
    thread = models.CharField(max_length=50, default='')
    thread_name = models.CharField(max_length=100, default='')
    exc_info = models.CharField(max_length=255, default='')
    stack_info = models.TextField(default='')
    message = models.TextField(default='')
    dt = models.DateTimeField(verbose_name='date', auto_now_add=True)

    class Meta:
        app_label = 'web'
        verbose_name = 'logging'
        verbose_name_plural = 'logging'
        ordering = ['-dt']

    def __str__(self):
        return str(self.dt)


def get_setting_codes():
    return [(v, v) for v in SETTINGS_DEFAULTS.keys()]


class Setting(models.Model):
    TYPES = [(1, 'str'), (2, 'int')]

    code = models.CharField(max_length=50, choices=get_setting_codes(), blank=False, null=False)
    value = models.CharField(max_length=255, default='', blank=True)
    info = models.CharField(max_length=255, default='', blank=True)
    type = models.SmallIntegerField(choices=TYPES, default=1, blank=True)
    user = models.ForeignKey(User, null=True)

    class Meta:
        app_label = 'web'
        unique_together = ('code', 'user')

    def __str__(self):
        return self.code

    @staticmethod
    def get_defaults():
        return SETTINGS_DEFAULTS.copy()

    @staticmethod
    def get_warning_email():
        item = Setting.objects.get(code='warning_email', user=None)
        if item:
            return item.value
        return None


class ScheduledReport(models.Model):
    DELIVERY_PERIOD_TYPES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    WEEKDAYS = [
        (7, 'Sun'),
        (1, 'Mon'),
        (2, 'Tue'),
        (3, 'Wed'),
        (4, 'Thu'),
        (5, 'Fri'),
        (6, 'Sat'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    report_id = models.CharField(max_length=32)
    name = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    is_pdf = models.BooleanField(null=False, blank=True, default=False)
    is_csv = models.BooleanField(null=False, blank=True, default=False)
    is_xls = models.BooleanField(null=False, blank=True, default=False)
    parameters = models.TextField(null=False, blank=True)

    active = models.BooleanField(blank=True, default=True)
    deleted = models.BooleanField(blank=True, default=False)

    email_to = models.CharField(max_length=512, blank=True, null=True)  # comma-separated expected
    email_cc = models.CharField(max_length=512, blank=True, null=True)  # comma-separated expected
    email_bcc = models.CharField(max_length=512, blank=True, null=True)  # comma-separated expected
    email_from = models.EmailField(max_length=100)
    email_subject = models.CharField(max_length=255)
    email_body = models.TextField()
    day_offset = models.IntegerField(null=False, blank=False, default=3)
    firstday = models.DateField(null=False, blank=False)
    delivery_hour = models.IntegerField(null=False, blank=False)
    delivery_hourmin = models.IntegerField(null=False, blank=False)
    delivery_period_type = models.CharField(max_length=8, choices=DELIVERY_PERIOD_TYPES,
                                            null=False, blank=False, default='weekly')
    daily_wday1 = models.BooleanField('Monday', null=False, blank=True, default=False)
    daily_wday2 = models.BooleanField('Tuesday', null=False, blank=True, default=False)
    daily_wday3 = models.BooleanField('Wednesday', null=False, blank=True, default=False)
    daily_wday4 = models.BooleanField('Thursday', null=False, blank=True, default=False)
    daily_wday5 = models.BooleanField('Friday', null=False, blank=True, default=False)
    daily_wday6 = models.BooleanField('Saturday', null=False, blank=True, default=False)
    daily_wday7 = models.BooleanField('Sunday', null=False, blank=True, default=False)

    next_run_time = models.DateTimeField(null=False, blank=False)

    def get_allowed_weekdays(self):
        allowed_weekdays = []
        for wd, wdname in self.WEEKDAYS:
            if getattr(self, 'daily_wday%s' % (wd)):
                allowed_weekdays.append(wd)
        return allowed_weekdays

    def get_next_run_time(self, aftertime=None):
        aftertime = aftertime or timezone.now()
        firstday = self.firstday
        allowed_weekdays = self.get_allowed_weekdays()
        onedaystep = timezone.timedelta(days=1)
        if self.delivery_period_type == 'daily':
            # check if 'firstday' corresponds to one of weekdays set (if set)
            weekday = firstday.weekday() + 1
            if allowed_weekdays and weekday not in allowed_weekdays:
                while firstday.weekday() + 1 not in allowed_weekdays:
                    firstday += onedaystep
        # print("Firstday: %s" % (firstday))
        firsttime = timezone.datetime.combine(
            firstday, timezone.datetime.min.time()) + \
            timezone.timedelta(hours=int(self.delivery_hour or 12), minutes=int(self.delivery_hourmin or 0))
        firsttime = timezone.make_aware(firsttime)
        if firsttime > aftertime:
            # print("firsttime (> now): %s" % firsttime)
            return firsttime
        steps = []
        if self.delivery_period_type == 'yearly':
            steps = [relativedelta(years=1)]
        elif self.delivery_period_type == 'monthly':
            steps = [relativedelta(months=1)]
        elif self.delivery_period_type == 'weekly':
            steps = [relativedelta(weeks=1)]
        elif self.delivery_period_type == 'daily':
            # count from now()
            firsttime = timezone.datetime.combine(
                aftertime, timezone.datetime.min.time()) + \
                timezone.timedelta(hours=int(self.delivery_hour or 12), minutes=int(self.delivery_hourmin or 0))
            firsttime = timezone.make_aware(firsttime)
            firsttime += onedaystep  # as now() > firsttime
            if allowed_weekdays and firsttime.weekday() + 1 not in allowed_weekdays:
                while firsttime.weekday() + 1 not in allowed_weekdays:
                    firsttime += onedaystep
        else:
            raise ValueError("Wrong delivery_period_type: %s" % (self.delivery_period_type))

        while firsttime < aftertime:
            for step in steps:
                firsttime += step
                if firsttime > aftertime:
                    break
        # print("firsttime: %s" % firsttime)
        return firsttime

    def get_delivery_period_display(self):
        stime = "%02d:%02d" % (self.delivery_hour, self.delivery_hourmin)
        if self.delivery_period_type == 'yearly':
            return "Every Year on %s %s at %s" % (self.firstday.strftime('%B'), ordinal(self.firstday.day), stime)
        if self.delivery_period_type == 'monthly':
            return "Every Month on %s at %s" % (ordinal(self.firstday.day), stime)
        if self.delivery_period_type == 'weekly':
            return "Every Week by %ss at %s" % (self.firstday.strftime('%A'), stime)
        if self.delivery_period_type == 'daily':
            weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            allowed_weekdays = []
            for wd in list(range(7)):
                if getattr(self, 'daily_wday%s' % (wd + 1)):
                    allowed_weekdays.append(weekdays[wd])
            if not allowed_weekdays:
                allowed_weekdays = ['Day']
            return "Every %s at %s" % (', '.join(allowed_weekdays), stime)
        return "Unknown: invalid format"

    def set_daily_periods(self, values):
        for wd in list(range(7)):
            setattr(self, 'daily_wday%s' % (wd + 1), str(wd + 1) in values)

    def get_format_list(self):
        flist = []
        if self.is_csv:
            flist.append('csv')
        if self.is_xls:
            flist.append('xls')
        if self.is_pdf:
            flist.append('pdf')
        return flist

    def __str__(self):
        active = "active"
        if self.deleted:
            active = "deleted"
        return "%s [%s]: user %s" % (self.id, active, self.user_id)

    def save(self, *args, **kwargs):
        if not self.next_run_time:
            self.next_run_time = self.get_next_run_time()
        return super().save(*args, **kwargs)
