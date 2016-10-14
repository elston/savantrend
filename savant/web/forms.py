import json
from .models import User, Chain, Site, Zone, Kpi, Setting
from .constants import KNOWN_REPORTS
from django import forms
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.utils.html import mark_safe


class TrialMixin:
    def clean_trial_period_custom(self):
        value = self.cleaned_data.get('trial_period_custom')
        if value == 0:
            raise forms.ValidationError('0 is not allowed')
        return value

    def clean_type_period(self):
        """
        If trial_period_custom is set, type_period
        must be set also
        """
        tpc = self.cleaned_data.get('trial_period_custom')
        tp = self.cleaned_data.get('type_period')

        if tpc is not None and tpc > 0 and not tp:
            msg = 'You must set type when you set custom period.'
            raise forms.ValidationError(msg)
        return tp


class UserCreationForm(TrialMixin, forms.ModelForm):
    """Back-end"""
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(
        label='Confirm password', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = (
            'username',
            'trial_period',
            'trial_period_custom',
            'type_period')

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError('Passwords do not match')
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    """Back-end"""
    password = ReadOnlyPasswordHashField(
        label=("Password"),
        help_text=("Raw passwords are not stored, so there is no way to see "
                   "this user's password, but you can change the password "
                   "using <a href=\"./password/\">this form</a>."))

    class Meta:
        model = User
        fields = (
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'company',
            'phone',
            'skype',
            'is_active',
            'is_admin'
        )

    def clean_password(self):
        return self.initial['password']


class KPIFeaturesForm(forms.ModelForm):

    class Meta:
        model = User
        fields = ('enabled_kpis', )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # print(self.fields['enabled_kpis'].choices)
        # self.fields['enabled_kpis'].queryset = Kpi.basic_kpis().exclude(name='FOOTFALL')


class ReportsEnabledForm(forms.ModelForm):
    enabled_reports = forms.MultipleChoiceField(
        widget=forms.SelectMultiple()
    )
    class Meta:
        model = User
        fields = ('enabled_reports', )

    def __init__(self, *args, **kwargs):
        available_reports = kwargs.pop('available_reports')

        super().__init__(*args, **kwargs)

        if available_reports is None:
            available_reports = self.instance.get_available_reports()

        settings = self.instance.get_all_settings_dict()
        choices = [
            (reportid, settings.get(reportid, reportid))
            for reportid in available_reports
        ]
        self.fields['enabled_reports'].choices = choices
        self.fields['enabled_reports'].initial = self.instance.enabled_reports


class TrialControlForm(TrialMixin, forms.ModelForm):
    clear_trial = forms.BooleanField(label='Clear trial', required=False)

    class Meta:
        model = User
        fields = (
            'trial_period',
            'trial_period_custom',
            'type_period',
            'clear_trial'
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for fld in self.fields:
            klass = self.fields[fld].widget.attrs.get('class', '')
            self.fields[fld].widget.attrs['class'] = klass + ' form-control'


class SiteAdminForm(forms.ModelForm):
    """
    Back-end. Creates custom field with dictionary.
    (key:client_id, value:list of chain ids)
    These ids will be used in Jquery logic to filter
    particular chains to particular clients onselect
    """
    dictionary = forms.CharField(widget=forms.HiddenInput(), required=False)

    def __init__(self, *args, **kwargs):
        d = {}
        tups = Chain.objects.values_list('client_id', 'id')
        for client_id, id in tups:
            if client_id not in d:
                d[client_id] = [id]
            else:
                d[client_id].append(id)

        super().__init__(*args, **kwargs)
        self.fields['dictionary'].help_text = mark_safe(json.dumps(d))

    class Meta:
        model = Site
        fields = ('client', 'chain', 'site_id', 'name', 'dictionary')


class ZoneAdminForm(forms.ModelForm):
    """
    Back-end. Creates custom field with dictionary.
    (key:client_id, value:list of site ids)
    These ids will be used in Jquery logic to filter
    particular sites to particular clients onselect
    """
    dictionary = forms.CharField(widget=forms.HiddenInput(), required=False)

    def __init__(self, *args, **kwargs):
        d = {}
        tups = Site.objects.values_list('client_id', 'id')
        for client_id, id in tups:
            if client_id not in d:
                d[client_id] = [id]
            else:
                d[client_id].append(id)

        super().__init__(*args, **kwargs)
        self.fields['dictionary'].help_text = mark_safe(json.dumps(d))

    class Meta:
        model = Zone
        fields = ('client', 'site', 'zone_id', 'name', 'dictionary')


class UserForm(forms.ModelForm):
    """Front-end"""
    password = forms.CharField(widget=forms.PasswordInput())

    class Meta:
        model = User
        fields = ('username', 'password')

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password'])
        if commit:
            user.save()
        return user


class UserProfileForm(forms.ModelForm):
    """
    Frontend and Backend(admin).
    """
    password = forms.CharField(widget=forms.PasswordInput())

    class Meta:
        model = User
        fields = ('email', 'password')

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password'])
        if commit:
            user.save()
        return user


class UserAccessForm(forms.ModelForm):
    """
    Frontend and Backend(admin). Grunt access from client to subusers.
    self.user is a client
    """
    enabled_reports = forms.MultipleChoiceField(
        widget=forms.SelectMultiple()
    )

    def __init__(self, *args, **kwargs):
        if kwargs.get('user'):
            self.user = kwargs.pop('user')
        elif kwargs.get('initial', {}).get('user'):
            self.user = kwargs.get('initial', {}).get('user')
        else:
            raise Exception('"user" instance should be in initial or kwargs')

        super().__init__(*args, **kwargs)

        settings = self.user.get_all_settings_dict()
        choices = [
            (reportid, settings.get(reportid, reportid))
            for reportid in self.user.get_available_reports()
        ]
        self.fields['enabled_reports'].choices = choices
        self.fields['enabled_reports'].initial = self.instance.enabled_reports

        userdata = self.user.get_all_settings_dict()
        self.fields['chain'].label = userdata['label1']
        self.fields['site'].label = userdata['label2']
        self.fields['zone'].label = userdata['label3']

        # print(self.fields['enabled_kpis']._choices)
        self.fields['enabled_kpis'].label_from_instance = lambda obj: userdata["kpiname%s" % obj.nameclean]

        # data=request.POST or request.POST
        # anyway: kwargs = request.POST
        kwargs = kwargs.get('data', {})
        if len(kwargs.keys()) < 2 and args:
            kwargs = args[0]

        chainset = dict(Chain.objects.filter(client_id=self.user.id).values_list('id', 'name'))

        self.fields['chain'].queryset = Chain.objects.filter(client_id=self.user.id)

        chain = kwargs.getlist('chain') if kwargs.get('chain') else self.initial.get('chain')
        site = kwargs.getlist('site') if kwargs.get('site') else self.initial.get('site')

        if chain is not None:
            sites = Site.objects.filter(chain__in=chain)
            siteset = {}
            for ob in sites:
                siteset[ob.id] = chainset[ob.chain_id] + ' - ' + ob.name
            self.fields['site'].choices = self.get_sites(chain, chainset)
        else:
            self.fields['site'].choices = []
            site = None

        if site is not None:
            # self.fields['zone'].queryset = Zone.objects.filter(site__in=site)
            self.fields['zone'].choices = self.get_zones(site, siteset)
        else:
            self.fields['zone'].choices = []

    def get_sites(self, chain, chset):
        sites = Site.objects.filter(chain__in=chain)
        sites_data = []
        for ch in chain:
            sites = Site.objects.filter(chain_id=ch)
            new_sites_data = []
            sb_sites_data = []
            for ste in sites:
                sb_sites_data.append([str(ste.id), ste.name])

            new_sites_data = [':: ' + chset[int(ch)] + ' ::', sb_sites_data]
            sites_data.append(new_sites_data)
        return sites_data

    def get_zones(self, site, siteset):
        # zones = Zone.objects.filter(site__in=site)
        zones_data = []
        for st in site:
            zones_tmp = Zone.objects.filter(site_id=st)
            new_zone_data = []
            sb_zone_data = []
            for zn in zones_tmp:
                sb_zone_data.append([zn.id, zn.name])

            new_zone_data = [':: ' + siteset[int(st)] + ' ::', sb_zone_data]
            zones_data.append(new_zone_data)

        return zones_data

    def clean_chain(self):
        """
        Validates list of chains. Client should choose at least one.
        """
        chain = self.cleaned_data['chain']
        if not chain:
            raise forms.ValidationError('Please select chain.')
        return chain

    def clean_site(self):
        """
        Validates list of sites. Client should choose at least one.
        """
        site = self.cleaned_data['site']
        if not site:
            raise forms.ValidationError('Please select site.')
        return site

    def clean_zone(self):
        """
        Validates list of zones. Client should choose at least one.
        """
        zone = self.cleaned_data['zone']
        if not zone:
            raise forms.ValidationError('Please select zone.')
        return zone

    class Meta:
        model = User
        fields = ('chain', 'site', 'zone', 'enabled_kpis', 'enabled_reports',
                  'allow_subusers', 'allow_settings')
        widgets = {
            'chain': forms.SelectMultiple(
                attrs={
                    'class': 'select2',
                    'placeholder': 'chain',
                    'style': 'width:100%'}),
            'site': forms.SelectMultiple(
                attrs={
                    'class': 'select2',
                    'placeholder': 'site',
                    'style': 'width:100%'}),
            'zone': forms.SelectMultiple(
                attrs={
                    'class': 'select2',
                    'placeholder': 'zone',
                    'style': 'width:100%'}),
            'enabled_kpis': forms.SelectMultiple(
                attrs={
                    'class': 'select2',
                    'placeholder': 'enabled_kpis',
                    'style': 'width:100%'}),
            'enabled_reports': forms.SelectMultiple(
                attrs={
                    'class': 'select2',
                    'placeholder': 'enabled_reports',
                    'style': 'width:100%'}),
        }


class ReportForm(UserAccessForm):
    """
    Used in old project.
    """
    start = forms.CharField(widget=forms.TextInput(
        attrs={'class': 'input-sm form-control'}))
    end = forms.CharField(widget=forms.TextInput(
        attrs={'class': 'input-sm form-control'}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['site'].queryset = self.user.site.all()
        self.fields['chain'].queryset = self.user.chain.all()
        self.fields['zone'].queryset = self.user.zone.all()


class ChainForm(forms.ModelForm):
    class Meta:
        model = Chain
        fields = ('name',)


class SiteForm(forms.ModelForm):
    class Meta:
        model = Site
        fields = ('name',)


class ZoneForm(forms.ModelForm):
    class Meta:
        model = Zone
        fields = ('name',)
