import re
import csv
from io import StringIO as Stream

from .constants import DEC_FORMATS, FONT_TYPES


def formatkpi(value, kpiformat):
    if not value:
        value = 0
    if kpiformat not in DEC_FORMATS:
        value = "%s" % value
    value = DEC_FORMATS[kpiformat][1].format(value)
    return value


def list2csv(datalist):
    stream = Stream()
    writer = csv.writer(stream)
    for row in datalist:
        writer.writerow(row)
    retdata = stream.getvalue()
    return retdata


def get_fonts(userdata):
    fonts = {}
    for ft in FONT_TYPES:
        ftname = 'fontnorm_%s'
        if userdata['font_%s_type' % ft] == 'google':
            ftname = 'fontgoogle_%s'
        ftname = ftname % ft
        fonts[ft] = {
            'family': userdata[ftname],
            'size': userdata['%s_size' % ftname],
            'weight': userdata['%s_weight' % ftname],
            'style': userdata['%s_style' % ftname],
        }
    return fonts


def parse_email_recipients(rawstr):
    return ','.join(map(str.strip, rawstr.split(',')))

KNOWN_DATE_PLACEHOLDERS = [
    'd', 'j', '-j', 'a', 'A', '-m', 'm', 'b', 'B', 'y', 'Y', 'H', '-H', 'I', '-I', 'M', '-M', 'S', '-S',
    'c', 'w', 'd', '-d', 'p', 'f', 'z', 'Z', 'U', 'W', 'x', 'X', '%'
]

DATE_FORMAT_VALIDATION_EXPR = re.compile(
    r'(?:\%(?:{}))|(?P<invalid>\%.?)'
    .format('|'.join(KNOWN_DATE_PLACEHOLDERS))
)


def validate_date_format(string):
    match = DATE_FORMAT_VALIDATION_EXPR.findall(string)
    return not any(match)


def replace_date_placeholders(string, date):
    for ph in KNOWN_DATE_PLACEHOLDERS:
        rph = '%' + ph
        if rph in string:
            try:
                string = string.replace(rph, date.strftime(rph))
            except:
                pass
    return string
