# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('web', '0008_auto_20160508_0058'),
    ]

    operations = [
        migrations.CreateModel(
            name='ReportLog',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', serialize=False, primary_key=True)),
                ('report_id', models.CharField(max_length=32)),
                ('name', models.CharField(max_length=64)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('is_pdf', models.BooleanField()),
                ('is_csv', models.BooleanField()),
                ('is_xls', models.BooleanField()),
                ('parameters', models.TextField(blank=True)),
                ('calendar_date_selected', models.CharField(blank=True, max_length=64)),
                ('is_manual', models.BooleanField()),
                ('is_email', models.BooleanField()),
            ],
        ),
        migrations.AddField(
            model_name='emailer',
            name='attachment_pathes',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='emailer',
            name='email_bcc_many',
            field=models.CharField(blank=True, null=True, max_length=512),
        ),
        migrations.AddField(
            model_name='emailer',
            name='email_cc_many',
            field=models.CharField(blank=True, null=True, max_length=512),
        ),
        migrations.AddField(
            model_name='emailer',
            name='email_to_many',
            field=models.CharField(blank=True, null=True, max_length=512),
        ),
        migrations.AlterField(
            model_name='setting',
            name='code',
            field=models.CharField(max_length=50, choices=[('label1', 'label1'), ('label2', 'label2'), ('label3', 'label3'), ('label4', 'label4'), ('label5', 'label5'), ('label6', 'label6'), ('FOOTFALL', 'FOOTFALL'), ('SALES', 'SALES'), ('TRANS', 'TRANS'), ('UNITS', 'UNITS'), ('STAFF', 'STAFF'), ('%CONV', '%CONV'), ('ATV', 'ATV'), ('UPT', 'UPT'), ('ACV', 'ACV'), ('CTSR', 'CTSR'), ('UPC', 'UPC'), ('SPS', 'SPS'), ('CUPT', 'CUPT'), ('CCTSR', 'CCTSR'), ('CUPC', 'CUPC'), ('performancecomparison', 'performancecomparison'), ('dailyretailtrendanalysis', 'dailyretailtrendanalysis'), ('executivesummary', 'executivesummary'), ('hourlyperformance', 'hourlyperformance'), ('performancecalendar', 'performancecalendar'), ('performancetrendanalysis', 'performancetrendanalysis'), ('performancecomparison_header', 'performancecomparison_header'), ('performancecomparison_footer', 'performancecomparison_footer'), ('dailyretailtrendanalysis_header', 'dailyretailtrendanalysis_header'), ('dailyretailtrendanalysis_footer', 'dailyretailtrendanalysis_footer'), ('executivesummary_header', 'executivesummary_header'), ('executivesummary_footer', 'executivesummary_footer'), ('hourlyperformance_header', 'hourlyperformance_header'), ('hourlyperformance_footer', 'hourlyperformance_footer'), ('performancecalendar_header', 'performancecalendar_header'), ('performancecalendar_footer', 'performancecalendar_footer'), ('performancetrendanalysis_header', 'performancetrendanalysis_header'), ('performancetrendanalysis_footer', 'performancetrendanalysis_footer'), ('sitename', 'sitename'), ('background', 'background'), ('dbbackground', 'dbbackground'), ('navbarbg', 'navbarbg'), ('navbarbgactive', 'navbarbgactive'), ('navbarfg', 'navbarfg'), ('navbarfgactive', 'navbarfgactive'), ('kpinameFOOTFALL', 'kpinameFOOTFALL'), ('kpinameSALES', 'kpinameSALES'), ('kpinameTRANS', 'kpinameTRANS'), ('kpinameUNITS', 'kpinameUNITS'), ('kpinameSTAFF', 'kpinameSTAFF'), ('kpinameCONV', 'kpinameCONV'), ('kpinameATV', 'kpinameATV'), ('kpinameUPT', 'kpinameUPT'), ('kpinameACV', 'kpinameACV'), ('kpinameCTSR', 'kpinameCTSR'), ('kpinameUPC', 'kpinameUPC'), ('kpinameSPS', 'kpinameSPS'), ('kpiformatFOOTFALL', 'kpiformatFOOTFALL'), ('kpiformatSALES', 'kpiformatSALES'), ('kpiformatTRANS', 'kpiformatTRANS'), ('kpiformatUNITS', 'kpiformatUNITS'), ('kpiformatSTAFF', 'kpiformatSTAFF'), ('kpiformatCONV', 'kpiformatCONV'), ('kpiformatATV', 'kpiformatATV'), ('kpiformatUPT', 'kpiformatUPT'), ('kpiformatACV', 'kpiformatACV'), ('kpiformatCTSR', 'kpiformatCTSR'), ('kpiformatUPC', 'kpiformatUPC'), ('kpiformatSPS', 'kpiformatSPS'), ('font_reportheader_type', 'font_reportheader_type'), ('font_filters_type', 'font_filters_type'), ('font_summary_type', 'font_summary_type'), ('font_tblheaders_type', 'font_tblheaders_type'), ('font_others_type', 'font_others_type'), ('fontnorm_reportheader', 'fontnorm_reportheader'), ('fontnorm_reportheader_size', 'fontnorm_reportheader_size'), ('fontnorm_reportheader_weight', 'fontnorm_reportheader_weight'), ('fontnorm_reportheader_style', 'fontnorm_reportheader_style'), ('fontnorm_filters', 'fontnorm_filters'), ('fontnorm_filters_size', 'fontnorm_filters_size'), ('fontnorm_filters_weight', 'fontnorm_filters_weight'), ('fontnorm_filters_style', 'fontnorm_filters_style'), ('fontnorm_summary', 'fontnorm_summary'), ('fontnorm_summary_size', 'fontnorm_summary_size'), ('fontnorm_summary_weight', 'fontnorm_summary_weight'), ('fontnorm_summary_style', 'fontnorm_summary_style'), ('fontnorm_tblheaders', 'fontnorm_tblheaders'), ('fontnorm_tblheaders_size', 'fontnorm_tblheaders_size'), ('fontnorm_tblheaders_weight', 'fontnorm_tblheaders_weight'), ('fontnorm_tblheaders_style', 'fontnorm_tblheaders_style'), ('fontnorm_others', 'fontnorm_others'), ('fontnorm_others_size', 'fontnorm_others_size'), ('fontnorm_others_weight', 'fontnorm_others_weight'), ('fontnorm_others_style', 'fontnorm_others_style'), ('fontgoogle_reportheader', 'fontgoogle_reportheader'), ('fontgoogle_reportheader_name', 'fontgoogle_reportheader_name'), ('fontgoogle_reportheader_size', 'fontgoogle_reportheader_size'), ('fontgoogle_reportheader_weight', 'fontgoogle_reportheader_weight'), ('fontgoogle_reportheader_style', 'fontgoogle_reportheader_style'), ('fontgoogle_filters', 'fontgoogle_filters'), ('fontgoogle_filters_name', 'fontgoogle_filters_name'), ('fontgoogle_filters_size', 'fontgoogle_filters_size'), ('fontgoogle_filters_weight', 'fontgoogle_filters_weight'), ('fontgoogle_filters_style', 'fontgoogle_filters_style'), ('fontgoogle_summary', 'fontgoogle_summary'), ('fontgoogle_summary_name', 'fontgoogle_summary_name'), ('fontgoogle_summary_size', 'fontgoogle_summary_size'), ('fontgoogle_summary_weight', 'fontgoogle_summary_weight'), ('fontgoogle_summary_style', 'fontgoogle_summary_style'), ('fontgoogle_tblheaders', 'fontgoogle_tblheaders'), ('fontgoogle_tblheaders_name', 'fontgoogle_tblheaders_name'), ('fontgoogle_tblheaders_size', 'fontgoogle_tblheaders_size'), ('fontgoogle_tblheaders_weight', 'fontgoogle_tblheaders_weight'), ('fontgoogle_tblheaders_style', 'fontgoogle_tblheaders_style'), ('fontgoogle_others', 'fontgoogle_others'), ('fontgoogle_others_name', 'fontgoogle_others_name'), ('fontgoogle_others_size', 'fontgoogle_others_size'), ('fontgoogle_others_weight', 'fontgoogle_others_weight'), ('fontgoogle_others_style', 'fontgoogle_others_style')]),
        ),
        migrations.AlterField(
            model_name='user',
            name='allow_subusers',
            field=models.BooleanField(verbose_name='Allow Subusers As Client', default=False),
        ),
        migrations.AlterField(
            model_name='user',
            name='company',
            field=models.CharField(blank=True, max_length=255, verbose_name='Client Name', default=''),
        ),
        migrations.AddField(
            model_name='reportlog',
            name='email',
            field=models.ForeignKey(blank=True, related_name='+', on_delete=django.db.models.deletion.SET_NULL, null=True, to='web.Emailer'),
        ),
        migrations.AddField(
            model_name='reportlog',
            name='user',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL),
        ),
    ]
