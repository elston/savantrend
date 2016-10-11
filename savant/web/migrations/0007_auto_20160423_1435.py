# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('web', '0006_user_enabled_kpis'),
    ]

    operations = [
        migrations.AlterField(
            model_name='setting',
            name='code',
            field=models.CharField(max_length=50, choices=[('label1', 'label1'), ('label2', 'label2'), ('label3', 'label3'), ('label4', 'label4'), ('label5', 'label5'), ('label6', 'label6'), ('VISITORS', 'VISITORS'), ('SALES', 'SALES'), ('TRANS', 'TRANS'), ('UNITS', 'UNITS'), ('STAFF', 'STAFF'), ('%CONV', '%CONV'), ('ATV', 'ATV'), ('UPT', 'UPT'), ('ACV', 'ACV'), ('CTSR', 'CTSR'), ('UPC', 'UPC'), ('SPS', 'SPS'), ('CUPT', 'CUPT'), ('CCTSR', 'CCTSR'), ('CUPC', 'CUPC'), ('background', 'background'), ('performancecomparison', 'performancecomparison'), ('dailyretailtrendanalysis', 'dailyretailtrendanalysis'), ('executivesummary', 'executivesummary'), ('hourlyperformance', 'hourlyperformance'), ('performancecalendar', 'performancecalendar'), ('performancetrendanalysis', 'performancetrendanalysis')]),
        ),
    ]
