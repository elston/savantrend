from django.contrib import messages
from django.shortcuts import render
from django.http import HttpResponseRedirect
from .forms import (
    TrialControlForm, UserForm, UserAccessForm, KPIFeaturesForm,
    ReportsEnabledForm
)
from .models import User
from .views import SettingsView
from .scheduler_views import ScheduledTasksListView

settings_view = SettingsView.as_view()
scheduled_tasks_list_view = ScheduledTasksListView.as_view()


def trial_control(request, user_id=None):
        user = User.objects.get(id=user_id)

        if request.method == 'POST':
            f = TrialControlForm(request.POST)
            if f.is_valid():
                user.clear_trial_period()
                user.save()

                if f.cleaned_data['clear_trial']:
                    messages.success(request, 'Trial period has been cleared.')
                    return HttpResponseRedirect(request.path)

                for k, v in f.cleaned_data.items():
                    setattr(user, k, v)
                user.set_trial_dates()
                user.save()
                messages.success(request, 'Changes have been applied.')
                return HttpResponseRedirect(request.path)
        else:
            f = TrialControlForm(instance=user)

        ctx = {
            'has_permission': True,
            'site_title': 'Savantrend',
            'site_header': 'Savantrend',
            'title': 'Trial Control',
            'app_label': 'Trial Control',
            'user': request.user,
            'f': f, 'site_header': 'Savantrend', 'obj': user
        }
        return render(request, 'admin/custom/trial_control.html', ctx)


def add_subuser(request, user_id=None):
    client = User.objects.get(id=user_id)
    h1 = '{}: add subuser'.format(client.username)

    if request.method == 'POST':
        user_form = UserForm(request.POST)
        profile_form = UserAccessForm(data=request.POST, user=client)

        if user_form.is_valid() and profile_form.is_valid():
            # Have the same model for two different forms
            # therefore getting data and save manually
            data = {}
            data.update(user_form.cleaned_data)
            data.update(profile_form.cleaned_data)

            subuser = User()
            subuser.parent_id = client.id
            subuser.username = data['username']
            subuser.set_password(data['password'])
            subuser.save()

            subuser.chain.add(*list(data['chain']))
            subuser.site.add(*list(data['site']))
            subuser.zone.add(*list(data['zone']))
            subuser.save()

            messages.success(request, 'Subuser has been added.')

            return HttpResponseRedirect(request.path)

    else:
        user_form = UserForm()
        profile_form = UserAccessForm(user=client)

    ctx = {
        'has_permission': True,
        'site_title': 'Savantrend',
        'site_header': 'Savantrend',
        'title': 'Add Subuser',
        'app_label': 'Add Subuser',
        'user': request.user,
        'user_form': user_form,
        'profile_form': profile_form,
        'client': client,
        'action_add': True,
        'h1': h1
    }
    return render(request, 'admin/custom/subuser.html', ctx)


def change_subuser(request, id=None):
    subuser = User.objects.get(id=id)
    client = subuser.parent

    h1 = 'Subuser: "{}" for client "{}"'.format(
        subuser.username, client.username)

    if request.method == 'POST':
        profile_form = UserAccessForm(
            data=request.POST,
            user=client,
            instance=subuser
        )

        if profile_form.is_valid():
            profile_form.save()
            messages.success(request, 'Changes have been applied.')
            return HttpResponseRedirect(request.path)

    else:
        profile_form = UserAccessForm(user=client, instance=subuser)

    ctx = {
        'has_permission': True,
        'site_title': 'Savantrend',
        'site_header': 'Savantrend',
        'title': 'Change Subuser',
        'app_label': 'Change Subuser',
        'user': request.user,
        'profile_form': profile_form,
        'client': client,
        'h1': h1
    }
    return render(request, 'admin/custom/subuser.html', ctx)


def enable_integration(request, id=None):
    user = User.objects.get(id=id)
    if request.method == 'POST':
        form = KPIFeaturesForm(instance=user, data=request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Changes have been applied.')
            return HttpResponseRedirect('/admin/web/user/')
    form = KPIFeaturesForm(instance=user)
    request.current_app = 'Web'
    context = {
        'has_permission': True,
        'site_title': 'Savantrend',
        'site_header': 'Savantrend',
        'title': 'Enable Integration',
        'app_label': 'Enable Integration',
        'form': form, 'user': request.user,
        'obj': user
    }
    return render(request, 'admin/custom/integration.html', context)


def enable_reports(request, id=None):
    user = User.objects.get(id=id)
    if not user.is_client and user.parent is not None:
        available_reports = user.get_available_reports()
    else:
        available_reports = request.user.get_available_reports()

    if request.method == 'POST':
        form = ReportsEnabledForm(
            instance=user,
            data=request.POST,
            available_reports=available_reports
        )
        if form.is_valid():
            form.save()
            messages.success(request, 'Changes have been applied.')
            return HttpResponseRedirect('/admin/web/user/')
    form = ReportsEnabledForm(
        instance=user,
        available_reports=available_reports
    )
    request.current_app = 'Web'
    context = {
        'has_permission': True,
        'site_title': 'Savantrend',
        'site_header': 'Savantrend',
        'title': 'Enable Reports',
        'app_label': 'Enable Reports',
        'form': form, 'user': request.user,
        'obj': user
    }
    return render(request, 'admin/custom/reports.html', context)
