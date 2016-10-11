
import os
import time
import json
from celery.decorators import periodic_task
from celery.task.schedules import crontab
from celery import shared_task
import datetime
from django.utils import timezone
from django.core.mail import EmailMessage
from django.core.mail.backends.smtp import EmailBackend
from django.test import RequestFactory
from django.contrib.sessions.middleware import SessionMiddleware

from .models import Emailer, Logging, User, Warning, WarningPeriod, ScheduledReport, ReportLog


@periodic_task(run_every=crontab())
def send_email():
    """
    Runs every minute.
    Checks emails that haven't been sent - and send them.
    """
    q = Emailer.objects.filter(sent=False)
    for e in q:
        mail = EmailMessage()
        mail.to = e.get_recipients_list(kind='to')
        mail.cc = e.get_recipients_list(kind='cc')
        mail.bcc = e.get_recipients_list(kind='bcc')
        mail.from_email = e.email_from
        mail.subject = e.subject
        mail.body = e.body

        if e.type == Emailer.HTML:
            mail.content_subtype = 'html'

        # attachments are passed as list of dict (has 'datafile' item as path to the file on disk)
        files2delete = []
        atts_p = e.get_attachment_pathes()
        if atts_p:
            for att_file in atts_p:
                datafile = att_file.get('datafile')
                if not datafile:
                    continue
                filename = att_file.get('filename') or datafile.split('/')[-1]
                mimetype = 'application/octet'
                fileformat = att_file.get('format')
                read_mode = 'rb'
                if fileformat == 'csv':
                    mimetype = 'text/csv'
                    read_mode = 'r'
                elif fileformat == 'xls':
                    mimetype = 'application/vnd.ms-excel'
                elif fileformat == 'pdf':
                    mimetype = 'application/pdf'
                with open(datafile, read_mode) as f:
                    content = f.read()
                    mail.attach(filename, content, mimetype)
                files2delete.append(datafile)

        try:
            e.result = True
            e.report = 'OK'
            fallbacksend = True
            if e.is_report():
                # a bit dirty
                user = e.related_report.first().user
                usersettings = user.get_all_settings_dict()
                if all(usersettings[k] for k in ('email_from', 'email_host', 'email_port', 'email_user', 'email_pass')):
                    with EmailBackend(
                        host=usersettings['email_host'],
                        port=usersettings['email_port'],
                        username=usersettings['email_user'],
                        password=usersettings['email_pass'],
                        use_tls=usersettings['email_tls'].lower() == 'true',
                        use_ssl=usersettings['email_ssl'].lower() == 'true'
                        ) as connection:
                        mail.connection = connection
                        mail.from_email = usersettings['email_from']
                        try:
                            mail.send()
                            print("Sent email with custom SMTP %s for user %s" %
                                  (usersettings['email_host'], user.username))
                            fallbacksend = False
                        except Exception as msexc:
                            print("Error sending mail using custom SMTP settings: %s: %s" % (type(msexc), str(msexc)))
            if fallbacksend:
                # try backup way - use default sender
                mail.send()
                print("Sent email using default email settings")
            if files2delete:
                delete_files.apply_async(kwargs={'files_list': files2delete})
                e.attachment_pathes = ''
        except Exception as exc:
            print("Error sending mail: %s: %s" % (type(exc), str(exc)))
            e.result = False
            e.report = str(exc)

        e.dt_sent = timezone.now()
        e.sent = True
        e.save()

        time.sleep(3)


@periodic_task(run_every=crontab(minute='*/15', hour='*'))
def run_scheduled_reports():
    schtasks = ScheduledReport.objects.filter(deleted=False, active=True)
    schtasks = schtasks.filter(next_run_time__lt=timezone.now())
    schtasks = schtasks.filter(user__is_active=True)
    for stask in schtasks:
        tkwargs = {
            'schr_id': stask.id,
        }
        create_send_report.apply_async(kwargs=tkwargs)


@shared_task
def create_send_report(schr_id):
    stask = ScheduledReport.objects.get(pk=schr_id)
    if stask.deleted or not stask.active:  # double-check in addition to previously done
        return False
    from .reports_views import get_known_reports_dict, get_report_url_name, get_report_url, REPORT_FILTERS
    report_class = get_known_reports_dict()[stask.report_id]
    rqfactory = RequestFactory()
    # request object
    reporturl = get_report_url(get_report_url_name(stask.report_id))
    rq = rqfactory.post(reporturl)
    middleware = SessionMiddleware()
    middleware.process_request(rq)
    rq.user = stask.user
    rq.META['HTTP_X_REQUESTED_WITH'] = 'XMLHttpRequest'  # simulate AJAX request
    rq.POST['emailreport'] = 'auto'
    rq.POST['emailto'] = stask.email_to
    rq.POST['emailcc'] = stask.email_cc
    rq.POST['emailbcc'] = stask.email_bcc
    rq.POST['emailsubject'] = stask.email_subject
    rq.POST['emailbody'] = stask.email_body
    rq.POST.setlist('formats[]', stask.get_format_list())
    rq.POST['reporturl'] = reporturl  # actually should be full url
    rparams = json.loads(stask.parameters or '{}')
    for pr in REPORT_FILTERS:
        if pr.endswith('[]'):
            value = rparams.get(pr[:-2])
        else:
            value = rparams.get(pr)
        if pr == 'date' and value:
            day = stask.next_run_time.date()
            day = day - timezone.timedelta(days=stask.day_offset)
            value = day.strftime("%m/%d/%Y")
        elif pr == 'daterange' and value:
            dstart, dend = value.split(' - ')
            dstart = timezone.make_aware(datetime.datetime.strptime(dstart, "%m/%d/%Y"))
            dend = timezone.make_aware(datetime.datetime.strptime(dend, "%m/%d/%Y"))
            daterange = dend - dstart
            tdend = stask.next_run_time.date() - timezone.timedelta(days=stask.day_offset)
            tdstart = tdend - daterange
            value = "%s - %s" % (tdstart.strftime("%m/%d/%Y"), tdend.strftime("%m/%d/%Y"))
        if pr.endswith('[]'):
            rq.POST.setlist(pr, value)
        else:
            rq.POST[pr] = value

    # send request
    response = report_class.as_view()(rq)
    if response.status_code != 200 or response.content.decode() != 'OK':
        print("ERROR! code %s, message: %s" % (response.status_code, response.content.decode()[:50]))

    # re-schedule
    stask.next_run_time = stask.get_next_run_time(stask.next_run_time + timezone.timedelta(hours=6))
    stask.save()
    return True


@periodic_task(run_every=crontab(minute='*/5', hour='*'))
def client_management():
    """
    Runs every hour.
    Places warning messages to client accounts.
    """
    # Getting warning periods
    periods = WarningPeriod.objects.all()

    q = User.objects.filter(has_trial=True)
    for client in q:
        # process warnings
        for period in periods:
            process_client_period(client, period)

        # disable expired accounts
        process_deactivation(client)


@periodic_task(run_every=crontab(minute=0, hour=0))
def clear_old_logs():
    """
    Removes old rows from Log
    """
    Logging.objects.filter(
        dt__lt=timezone.now() - datetime.timedelta(days=15)).delete()


def process_client_period(client, period):
    """
    Checks that client should get warning for period.
    If it hasn't got it yet.
    """
    end_date = client.end_date
    if not end_date:
        return

    delta = end_date - datetime.date.today()
    days = delta.days
    if period.days == days:
        # insert warning if client hasn't got it yet
        q = Warning.objects.filter(client_id=client.id, period_id=period.id)
        if not q.exists():
            w = Warning(client_id=client.id, period_id=period.id)
            if client.email:
                w.email = client.email
            w.save()


def process_deactivation(client):
    """
    Set is_active=False if client's end_date is expired.
    """
    end_date = client.end_date
    if not end_date:
        return

    delta = end_date - datetime.date.today()
    days = delta.days
    if days < 0:
        client.is_active = False
        client.save()


@shared_task(name="delete_files")
def delete_files(files_list):
    for fpath in files_list:
        try:
            if os.path.exists(fpath):
                os.unlink(fpath)
        except:
            pass
