# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('web', '0012_auto_20161012_1305'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_superadmin',
            field=models.BooleanField(default=False, verbose_name='superadmin'),
        ),
    ]
