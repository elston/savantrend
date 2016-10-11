C:\Python34\python.exe %1\savant\manage.py migrate
C:\Python34\python.exe %1\savant\manage.py loaddata %1\savant\web\fixtures\kpis.json %1\savant\web\fixtures\settings.json

schtasks /end /tn savant_scheduler
schtasks /end /tn savant_celery
schtasks /end /tn savant_celerybeat

timeout 3

cscript %1\config\customize.vbs %1\config\savant_scheduler.xml **INSTALLDIR** "%1"
cscript %1\config\customize.vbs %1\config\savant_celery.xml **INSTALLDIR** "%1"
cscript %1\config\customize.vbs %1\config\savant_celerybeat.xml **INSTALLDIR** "%1"

schtasks /Delete /F /TN savant_scheduler
schtasks /create /XML %1\config\savant_scheduler.xml /ru SYSTEM /tn savant_scheduler

schtasks /Delete /F /TN savant_celery
schtasks /create /XML %1\config\savant_celery.xml /ru SYSTEM /tn savant_celery

schtasks /Delete /F /TN savant_celerybeat
schtasks /create /XML %1\config\savant_celerybeat.xml /ru SYSTEM /tn savant_celerybeat

timeout 3

schtasks /run /tn savant_scheduler
schtasks /run /tn savant_celery
schtasks /run /tn savant_celerybeat

pause
