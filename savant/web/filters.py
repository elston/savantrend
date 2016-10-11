from django.contrib import admin
from django.db.models import Q
from django.utils.translation import ugettext_lazy as _
from django.utils.encoding import force_text
from .models import Warning, WarningPeriod


class SubuserFilter(admin.SimpleListFilter):
    title = _('Sub-users')
    parameter_name = 'subuser'

    def lookups(self, request, model_admin):
        return (
            ('false', _('No')),
            ('true', _('Yes')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'true':
            return queryset.filter(~Q(parent_id=None))

        if self.value() == 'false':
            return queryset.filter(parent_id=None)

    def choices(self, changelist):
        """
        Copied from Django source code.
        To substitude 'All' on '---'.
        All doesn't have sense in these situation.
        """
        yield {
            'selected': self.value() is None,
            'query_string': changelist.get_query_string({}, [self.parameter_name]),
            'display': _('---'),
        }
        for lookup, title in self.lookup_choices:
            yield {
                'selected': self.value() == force_text(lookup),
                'query_string': changelist.get_query_string(
                    {self.parameter_name: lookup}, []),
                'display': title,
            }


class WarningFilter(admin.SimpleListFilter):
    title = _('Warnings')
    parameter_name = 'warning'
    all_param_value = 'all'

    def lookups(self, request, model_admin):
        tups = []
        for wp in list(WarningPeriod.objects.all()):
            tups.append((str(wp.id), _(wp.name)))
        return tups

    def queryset(self, request, queryset):
        wp_id = self.value()
        if wp_id is None:
            return queryset.all()

        q = Warning.objects.filter(
            period_id=wp_id).values_list('client_id', flat=True)
        client_ids = list(q)
        return queryset.filter(id__in=client_ids)
