# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, verbose_name='last login', null=True)),
                ('username', models.SlugField(unique=True)),
                ('email', models.EmailField(blank=True, max_length=255, unique=True, null=True, default=None)),
                ('first_name', models.CharField(blank=True, max_length=50, default='')),
                ('last_name', models.CharField(blank=True, max_length=50, default='')),
                ('company', models.CharField(blank=True, max_length=255, default='')),
                ('phone', models.CharField(blank=True, max_length=50, default='')),
                ('skype', models.CharField(blank=True, max_length=50, default='')),
                ('num_subusers', models.SmallIntegerField(default=0)),
                ('is_active', models.BooleanField(verbose_name='active', default=True)),
                ('is_admin', models.BooleanField(verbose_name='admin', default=False)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('type_period', models.CharField(blank=True, max_length=10, choices=[('days', 'days'), ('years', 'years')], verbose_name='type of custom period', help_text='Set it only if you want to set custom trial period')),
                ('trial_period_custom', models.PositiveSmallIntegerField(blank=True, verbose_name='custom trial period', null=True, help_text='If you set custom period, it will override selected period')),
                ('has_trial', models.BooleanField(default=False)),
            ],
            options={
                'ordering': ['username'],
                'verbose_name_plural': 'Clients',
            },
        ),
        migrations.CreateModel(
            name='Chain',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('name', models.CharField(max_length=200, default='')),
                ('chain_id', models.IntegerField()),
                ('client', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='user_chain')),
            ],
        ),
        migrations.CreateModel(
            name='Emailer',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('email_to', models.EmailField(max_length=100)),
                ('email_from', models.EmailField(max_length=100)),
                ('subject', models.CharField(max_length=255)),
                ('body', models.TextField()),
                ('type', models.CharField(max_length=4, choices=[('text', 'text'), ('html', 'html')], default='text')),
                ('report', models.TextField(default='')),
                ('sent', models.BooleanField(default=False)),
                ('result', models.BooleanField(default=False)),
                ('dt_created', models.DateTimeField(auto_now_add=True)),
                ('dt_sent', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'ordering': ['-dt_created'],
                'verbose_name_plural': 'Emails',
                'verbose_name': 'Email',
            },
        ),
        migrations.CreateModel(
            name='Logging',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('http_code', models.CharField(max_length=10, default='')),
                ('level', models.CharField(max_length=8, default='')),
                ('logger_name', models.CharField(max_length=20, default='')),
                ('module', models.CharField(max_length=100, default='')),
                ('thread', models.CharField(max_length=50, default='')),
                ('thread_name', models.CharField(max_length=100, default='')),
                ('exc_info', models.CharField(max_length=255, default='')),
                ('stack_info', models.TextField(default='')),
                ('message', models.TextField(default='')),
                ('dt', models.DateTimeField(auto_now_add=True, verbose_name='date')),
            ],
            options={
                'ordering': ['-dt'],
                'verbose_name_plural': 'logging',
                'verbose_name': 'logging',
            },
        ),
        migrations.CreateModel(
            name='Report',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('day', models.DateField(null=True)),
                ('datetime', models.DateTimeField(null=True)),
                ('visitors_in', models.IntegerField(null=True)),
                ('visitors_out', models.IntegerField(null=True)),
                ('occupancy', models.IntegerField(null=True)),
                ('sales', models.FloatField(null=True, default=0)),
                ('transactions', models.IntegerField(null=True, default=0)),
                ('associates', models.IntegerField(null=True, default=0)),
                ('items', models.IntegerField(null=True, default=0)),
                ('zone_name', models.CharField(max_length=100, default='')),
                ('site_name', models.CharField(max_length=100, default='')),
                ('chain_name', models.CharField(max_length=100, default='')),
                ('chain', models.ForeignKey(to='web.Chain', related_name='chain_report')),
                ('client', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='user_report')),
            ],
        ),
        migrations.CreateModel(
            name='Setting',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('code', models.CharField(max_length=50)),
                ('value', models.CharField(blank=True, max_length=255, default='')),
                ('info', models.CharField(blank=True, max_length=255, default='')),
                ('type', models.SmallIntegerField(blank=True, choices=[(1, 'str'), (2, 'int')], default=1)),
            ],
        ),
        migrations.CreateModel(
            name='Site',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('name', models.CharField(max_length=200, default='')),
                ('site_id', models.IntegerField()),
                ('chain', models.ForeignKey(to='web.Chain', related_name='site', null=True)),
                ('client', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='user_site')),
            ],
        ),
        migrations.CreateModel(
            name='TrialPeriod',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('name', models.CharField(max_length=20)),
                ('value', models.SmallIntegerField()),
                ('type_period', models.CharField(max_length=10, choices=[('days', 'days'), ('years', 'years')])),
            ],
            options={
                'ordering': ('value',),
            },
        ),
        migrations.CreateModel(
            name='Warning',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('client_viewed', models.BooleanField(default=False)),
                ('dt_created', models.DateTimeField(auto_now_add=True)),
                ('dt_viewed', models.DateTimeField(blank=True, null=True)),
                ('email', models.CharField(blank=True, max_length=100, default='')),
                ('client', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ('dt_created',),
            },
        ),
        migrations.CreateModel(
            name='WarningPeriod',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('days', models.SmallIntegerField()),
                ('message', models.CharField(max_length=255)),
            ],
            options={
                'ordering': ('-days',),
            },
        ),
        migrations.CreateModel(
            name='Zone',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', primary_key=True, auto_created=True)),
                ('name', models.CharField(max_length=200, default='')),
                ('zone_id', models.IntegerField()),
                ('client', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='user_zone')),
                ('site', models.ForeignKey(to='web.Site', related_name='site', null=True)),
            ],
        ),
        migrations.AddField(
            model_name='warning',
            name='period',
            field=models.ForeignKey(to='web.WarningPeriod'),
        ),
        migrations.AddField(
            model_name='report',
            name='site',
            field=models.ForeignKey(to='web.Site', related_name='site_report'),
        ),
        migrations.AddField(
            model_name='report',
            name='zone',
            field=models.ForeignKey(to='web.Zone', related_name='zone_report'),
        ),
        migrations.AddField(
            model_name='user',
            name='chain',
            field=models.ManyToManyField(blank=True, to='web.Chain'),
        ),
        migrations.AddField(
            model_name='user',
            name='parent',
            field=models.ForeignKey(blank=True, to=settings.AUTH_USER_MODEL, related_name='children', null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='site',
            field=models.ManyToManyField(blank=True, to='web.Site'),
        ),
        migrations.AddField(
            model_name='user',
            name='trial_period',
            field=models.ForeignKey(blank=True, to='web.TrialPeriod', on_delete=django.db.models.deletion.SET_NULL, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='zone',
            field=models.ManyToManyField(blank=True, to='web.Zone'),
        ),
        migrations.CreateModel(
            name='ClientManagement',
            fields=[
            ],
            options={
                'proxy': True,
            },
            bases=('web.user',),
        ),
    ]
