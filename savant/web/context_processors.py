
from django.conf import settings

from .models import Kpi
from .utils import get_fonts


def settings_context(request):
    context = {}
    context['company'] = settings.COMPANY_NAME
    if not request.user.is_authenticated():
        return context
    userdata = request.user.get_all_settings_dict()
    context['userdata'] = userdata
    context['all_kpis'] = Kpi.objects.all()
    context['fonts'] = get_fonts(userdata)
    return context
