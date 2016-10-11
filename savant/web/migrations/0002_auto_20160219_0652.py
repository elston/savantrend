# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('web', '0001_initial'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='chain',
            unique_together=set([('client', 'chain_id')]),
        ),
        migrations.AlterUniqueTogether(
            name='site',
            unique_together=set([('client', 'site_id')]),
        ),
        migrations.AlterUniqueTogether(
            name='zone',
            unique_together=set([('client', 'zone_id')]),
        ),
    ]
