from django.conf import settings
from .models import Emailer


def queue_email(**kw):
    """
    First, adds email to "Emailer" model.
    Then it will be send by celery task.
    type: text/html
    """
    if not settings.IS_SERVER:
        return

    req_fields = ('to', 'from', 'subject', 'body', 'type')
    for k, v in kw.items():
        if k not in req_fields:
            raise ValueError('Please provide correct data.')

    e = Emailer()
    e.email_to = kw['to']
    e.email_from = kw['from']
    e.subject = kw['subject']
    e.body = kw['body']
    e.type = kw['type']
    e.save()
