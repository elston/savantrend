from django.conf import settings
from django.contrib.auth import logout
from django.http import HttpResponseRedirect
from django.template.loader import render_to_string

from .models import Emailer, Setting, Warning
from .emails import queue_email


class ActiveUserMiddleware:
    def process_request(self, request):
        if request.user.is_authenticated() and not request.user.is_active:
            logout(request)


class WarningMessageMiddleware:
    def process_request(self, request):
        if not request.user.is_authenticated():
            return

        u = request.user

        id = request.GET.get('client_viewed_warning')
        if id is not None and id.isdigit():
            id = int(id)
            try:
                w = Warning.objects.get(id=id, client_id=u.id)
                w.client_viewed = True
                w.save()

                self.send_email_to_admin(request, w)
                self.send_email_to_client(request, w, u.email)

                return HttpResponseRedirect(request.path)
            except Warning.DoesNotExist:
                pass

        request.warning = Warning.objects.filter(
            client_id=u.id, client_viewed=False).first()

    def get_admin_email(self):
        return Setting.get_warning_email()

    def get_body(self, request, warning):
        ctx = {
            'warning': warning,
            'admin_email': self.get_admin_email()
        }
        return render_to_string(
            'admin/warning/print.html', context=ctx, request=request)

    def send_email_to_admin(self, request, warning):
        d = {
            'to': self.get_admin_email(),
            'from': settings.DEFAULT_FROM_EMAIL,
            'subject': 'viewed warning confirmation',
            'body': self.get_body(request, warning),
            'type': Emailer.HTML
        }
        queue_email(**d)

    def send_email_to_client(self, request, warning, client_email):
        """
        Email is not mandatory
        """
        if not client_email:
            return

        d = {
            'to': client_email,
            'from': settings.DEFAULT_FROM_EMAIL,
            'subject': 'viewed warning confirmation',
            'body': self.get_body(request, warning),
            'type': Emailer.HTML
        }
        queue_email(**d)
