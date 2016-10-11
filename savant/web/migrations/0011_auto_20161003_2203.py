# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import django.contrib.postgres.fields


class Migration(migrations.Migration):

    dependencies = [
        ('web', '0010_auto_20160522_2323'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='enabled_reports',
            field=django.contrib.postgres.fields.ArrayField(default=['performancecalendar', 'executivesummary', 'hourlyperformance', 'dailyretailtrendanalysis', 'performancecomparison', 'performancetrendanalysis'], size=None, base_field=models.CharField(max_length=200)),
        )
    ]
