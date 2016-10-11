
from django.conf import settings

from collections import OrderedDict


KNOWN_REPORTS = [  # order matters!
    'performancecalendar',
    'executivesummary',
    'hourlyperformance',
    'dailyretailtrendanalysis',
    'performancecomparison',
    'performancetrendanalysis'
]

SETTINGS_DEFAULTS = OrderedDict([
    # labels
    ('label1', 'CHAIN'), ('label2', 'SITE'), ('label3', 'ZONE'),
    ('label4', 'DATE'), ('label5', 'HOUR'), ('label6', 'KPI'),
    # colors
    ('FOOTFALL', '#ADD9FE'), ('SALES', '#FFCCFF'), ('TRANS', '#529A86'), ('UNITS', '#B39EB5'), ('STAFF', '#F7BB80'),
    ('%CONV', '#77DD77'), ('ATV', '#CFCFC4'), ('UPT', '#FF6961'), ('ACV', '#FDFD96'), ('CTSR', '#C4CAFF'),
    ('UPC', '#C4D99C'), ('SPS', '#DEFFE9'),
    # decimalDefault
    ('CUPT', 'true'), ('CCTSR', 'true'), ('CUPC', 'true'),
    # report names
    ('performancecomparison', 'Performance Comparison'),
    ('dailyretailtrendanalysis', 'Daily Retail Trend Analysis'),
    ('executivesummary', 'Executive Summary'),
    ('hourlyperformance', 'Hourly Performance'),
    ('performancecalendar', 'Performance Calendar'),
    ('performancetrendanalysis', 'Performance Trend Analysis'),
    # report headers/footers
    ('performancecomparison_header', ''), ('performancecomparison_footer', ''),
    ('dailyretailtrendanalysis_header', ''), ('dailyretailtrendanalysis_footer', ''),
    ('executivesummary_header', ''), ('executivesummary_footer', ''),
    ('hourlyperformance_header', ''), ('hourlyperformance_footer', ''),
    ('performancecalendar_header', ''), ('performancecalendar_footer', ''),
    ('performancetrendanalysis_header', ''), ('performancetrendanalysis_footer', ''),
    # report date format
    ('performancecomparison_date_format', ''),
    ('dailyretailtrendanalysis_date_format', ''),
    ('executivesummary_date_format', ''),
    ('hourlyperformance_date_format', ''),
    ('performancecalendar_date_format', ''),
    ('performancetrendanalysis_date_format', ''),
    # site name
    ('sitename', 'Savantrend'),
    # background color
    ('background', '#fff'),
    ('dbbackground', '#fff'),  # dashboard
    # Navbar background/foreground color
    ('navbarbg', '#f7f7f7'),
    ('navbarbgactive', '#e7e7e7'),
    ('navbarfg', '#777'),
    ('navbarfgactive', '#777'),
    # KPI names
    ('kpinameFOOTFALL', 'FOOTFALL'),
    ('kpinameSALES', 'SALES'),
    ('kpinameTRANS', 'TRANS'),
    ('kpinameUNITS', 'UNITS'),
    ('kpinameSTAFF', 'STAFF'),
    ('kpinameCONV', '%CONV'),
    ('kpinameATV', 'ATV'),
    ('kpinameUPT', 'UPT'),
    ('kpinameACV', 'ACV'),
    ('kpinameCTSR', 'CTSR'),
    ('kpinameUPC', 'UPC'),
    ('kpinameSPS', 'SPS'),
    # KPI formats
    ('kpiformatFOOTFALL', 'format1'),
    ('kpiformatSALES', 'format2'),
    ('kpiformatTRANS', 'format1'),
    ('kpiformatUNITS', 'format1'),
    ('kpiformatSTAFF', 'format1'),
    ('kpiformatCONV', 'format3'),
    ('kpiformatATV', 'format1'),
    ('kpiformatUPT', 'format2'),
    ('kpiformatACV', 'format2'),
    ('kpiformatCTSR', 'format2'),
    ('kpiformatUPC', 'format2'),
    ('kpiformatSPS', 'format2'),
    # Used fonts
    ('font_reportheader_type', 'google'),
    ('font_filters_type', 'google'),
    ('font_summary_type', 'google'),
    ('font_tblheaders_type', 'google'),
    ('font_others_type', 'google'),
    # normal fonts
    ('fontnorm_reportheader', '"Helvetica Neue",Helvetica,Arial,sans-serif'),
    ('fontnorm_reportheader_size', '20'),
    ('fontnorm_reportheader_weight', 'normal'),
    ('fontnorm_reportheader_style', 'normal'),

    ('fontnorm_filters', '"Helvetica Neue",Helvetica,Arial,sans-serif'),
    ('fontnorm_filters_size', '16'),
    ('fontnorm_filters_weight', 'normal'),
    ('fontnorm_filters_style', 'normal'),

    ('fontnorm_summary', '"Helvetica Neue",Helvetica,Arial,sans-serif'),
    ('fontnorm_summary_size', '18'),
    ('fontnorm_summary_weight', 'bold'),
    ('fontnorm_summary_style', 'normal'),

    ('fontnorm_tblheaders', '"Helvetica Neue",Helvetica,Arial,sans-serif'),
    ('fontnorm_tblheaders_size', '16'),
    ('fontnorm_tblheaders_weight', 'normal'),
    ('fontnorm_tblheaders_style', 'normal'),

    ('fontnorm_others', '"Helvetica Neue",Helvetica,Arial,sans-serif'),
    ('fontnorm_others_size', '16'),
    ('fontnorm_others_weight', 'normal'),
    ('fontnorm_others_style', 'normal'),
    # google fonts
    ('fontgoogle_reportheader', 'Roboto'),
    ('fontgoogle_reportheader_name', 'Roboto Bold 700'),
    ('fontgoogle_reportheader_size', '20'),
    ('fontgoogle_reportheader_weight', '700'),
    ('fontgoogle_reportheader_style', 'normal'),

    ('fontgoogle_filters', 'Roboto'),
    ('fontgoogle_filters_name', 'Roboto Medium 500'),
    ('fontgoogle_filters_size', '16'),
    ('fontgoogle_filters_weight', '300'),
    ('fontgoogle_filters_style', 'normal'),

    ('fontgoogle_summary', 'Roboto'),
    ('fontgoogle_summary_name', 'Roboto Medium 500'),
    ('fontgoogle_summary_size', '18'),
    ('fontgoogle_summary_weight', '300'),
    ('fontgoogle_summary_style', 'normal'),

    ('fontgoogle_tblheaders', 'Roboto'),
    ('fontgoogle_tblheaders_name', 'Roboto Medium 500'),
    ('fontgoogle_tblheaders_size', '16'),
    ('fontgoogle_tblheaders_weight', '300'),
    ('fontgoogle_tblheaders_style', 'normal'),

    ('fontgoogle_others', 'Roboto'),
    ('fontgoogle_others_name', 'Roboto Normal 400'),
    ('fontgoogle_others_size', '16'),
    ('fontgoogle_others_weight', '400'),
    ('fontgoogle_others_style', 'normal'),
    # Email Settings
    ('email_from', ''),
    ('email_host', ''),
    ('email_port', ''),
    ('email_user', ''),
    ('email_pass', ''),
    ('email_tls', ''),
    ('email_ssl', ''),
])

DEC_FORMATS = OrderedDict([
    ('format0', ('<b>123.00</b> for 123', '{:.2f}')),
    ('format1', ('<b>123</b> for 123.4567', '{:.0f}')),
    ('format2', ('<b>123.45</b> for 123.4567', '{:.2f}')),
    ('format3', ('<b>123.45%</b> for 123.4567', '{:.2%}')),
])

FONT_TYPES = ['reportheader', 'filters', 'summary', 'tblheaders', 'others']
FONT_SIZES_NORMAL = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26]
FONT_SIZES_GOOGLE = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26]
FONT_TYPES_NORMAL = [
    ('fontnorm_reportheader', 'Report Header', 'reportheader'),
    ('fontnorm_filters', 'Filters', 'filters'),
    ('fontnorm_summary', 'Summary', 'summary'),
    ('fontnorm_tblheaders', 'Table Headers', 'tblheaders'),
    ('fontnorm_others', 'Rest Of The Report Values', 'others'),
]
FONT_TYPES_GOOGLE = [
    ('fontgoogle_reportheader', 'Report Header', 'reportheader'),
    ('fontgoogle_filters', 'Filters', 'filters'),
    ('fontgoogle_summary', 'Summary', 'summary'),
    ('fontgoogle_tblheaders', 'Table Headers', 'tblheaders'),
    ('fontgoogle_others', 'Rest Of The Report Values', 'others'),
]

FONT_NAMES_NORMAL = [
    '"Helvetica Neue",Helvetica,Arial,sans-serif',
    'Arial,Arial,Helvetica,sans-serif',
    'Arial Black,Arial Black,Gadget,sans-serif',
    'Comic Sans MS,Comic Sans MS,cursive',
    'Courier New,Courier New,Courier,monospace',
    'Georgia,Georgia,serif',
    'Impact,Charcoal,sans-serif',
    'Lucida Console,Monaco,monospace',
    'Lucida Sans Unicode,Lucida Grande,sans-serif',
    'Palatino Linotype,Book Antiqua,Palatino,serif',
    'Tahoma,Geneva,sans-serif',
    'Times New Roman,Times,serif',
    'Trebuchet MS,Helvetica,sans-serif',
    'Verdana,Geneva,sans-serif',
    'Gill Sans,Geneva,sans-serif'
]

FONT_NAMES_GOOGLE = [
    'Roboto Thin 100|Roboto|100|normal',
    'Roboto Thin 100 Italic|Roboto|100|italic',
    'Roboto Light 300|Roboto|300|normal',
    'Roboto Light 300 Italic|Roboto|300|italic',
    'Roboto Normal 400|Roboto|400|normal',
    'Roboto Normal 400 Italic|Roboto|400|italic',
    'Roboto Medium 500|Roboto|500|normal',
    'Roboto Medium 500 Italic|Roboto|500|italic',
    'Roboto Bold 700|Roboto|700|normal',
    'Roboto Bold 700 Italic|Roboto|700|italic',
    'Roboto Ultra-Bold 900|Roboto|900|normal',
    'Roboto Ultra-Bold 900 Italic|Roboto|900|italic',
]
