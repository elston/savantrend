# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('web', '0004_user_logo'),
    ]

    operations = [
        migrations.CreateModel(
            name='Kpi',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=16)),
                ('displayname', models.CharField(max_length=64)),
                ('color', models.CharField(max_length=16)),
            ],
            options={
                'ordering': ('id',),
            },
        ),
    ]
