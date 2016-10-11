# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('web', '0003_auto_20160416_2036'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='logo',
            field=models.ImageField(null=True, upload_to='logos', blank=True),
        ),
    ]
