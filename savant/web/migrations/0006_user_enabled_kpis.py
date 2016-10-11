# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('web', '0005_kpi'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='enabled_kpis',
            field=models.ManyToManyField(to='web.Kpi', blank=True),
        ),
    ]
