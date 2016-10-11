# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('web', '0002_auto_20160219_0652'),
    ]

    operations = [
        migrations.AddField(
            model_name='setting',
            name='user',
            field=models.ForeignKey(null=True, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='zone',
            name='site',
            field=models.ForeignKey(to='web.Site', null=True, related_name='zone'),
        ),
        migrations.AlterUniqueTogether(
            name='setting',
            unique_together=set([('code', 'user')]),
        ),
    ]
