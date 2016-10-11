# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('web', '0009_auto_20160519_0131'),
    ]

    operations = [
        migrations.CreateModel(
            name='ScheduledReport',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, verbose_name='ID', auto_created=True)),
                ('report_id', models.CharField(max_length=32)),
                ('name', models.CharField(max_length=64)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('is_pdf', models.BooleanField(default=False)),
                ('is_csv', models.BooleanField(default=False)),
                ('is_xls', models.BooleanField(default=False)),
                ('parameters', models.TextField(blank=True)),
                ('active', models.BooleanField(default=True)),
                ('deleted', models.BooleanField(default=False)),
                ('email_to', models.CharField(max_length=512, null=True, blank=True)),
                ('email_cc', models.CharField(max_length=512, null=True, blank=True)),
                ('email_bcc', models.CharField(max_length=512, null=True, blank=True)),
                ('email_from', models.EmailField(max_length=100)),
                ('email_subject', models.CharField(max_length=255)),
                ('email_body', models.TextField()),
                ('day_offset', models.IntegerField(default=3)),
                ('firstday', models.DateField()),
                ('delivery_hour', models.IntegerField()),
                ('delivery_hourmin', models.IntegerField()),
                ('delivery_period_type', models.CharField(max_length=8, choices=[('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('yearly', 'Yearly')], default='weekly')),
                ('daily_wday1', models.BooleanField(verbose_name='Monday', default=False)),
                ('daily_wday2', models.BooleanField(verbose_name='Tuesday', default=False)),
                ('daily_wday3', models.BooleanField(verbose_name='Wednesday', default=False)),
                ('daily_wday4', models.BooleanField(verbose_name='Thursday', default=False)),
                ('daily_wday5', models.BooleanField(verbose_name='Friday', default=False)),
                ('daily_wday6', models.BooleanField(verbose_name='Saturday', default=False)),
                ('daily_wday7', models.BooleanField(verbose_name='Sunday', default=False)),
                ('next_run_time', models.DateTimeField()),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterField(
            model_name='reportlog',
            name='is_csv',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='reportlog',
            name='is_pdf',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='reportlog',
            name='is_xls',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='reportlog',
            name='scheduled',
            field=models.ForeignKey(to='web.ScheduledReport', null=True, blank=True),
        ),
    ]
