sc stop postgresql-9.4
timeout 7
sc start postgresql-9.4
timeout 7
cd /d "C:\Program Files (x86)\PostgreSQL\9.4\bin\"
psql.exe --host 127.0.0.1 --username "postgres" --no-password --file "%1\config\postgres\init.sql"

C:\Python34\python.exe %1\savant\manage.py migrate
C:\Python34\python.exe %1\savant\manage.py loaddata %1\savant\web\fixtures\kpis.json %1\savant\web\fixtures\settings.json
C:\Python34\python.exe %1\savant\manage.py createsuperuser --username admin
timeout 3