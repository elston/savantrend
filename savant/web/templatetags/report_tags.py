from django import template

from ..utils import formatkpi as kpiformat_func

register = template.Library()


@register.filter
def getdefdict(src, key):
    if not src:
        return {}
    return src.get(key, {})


@register.filter
def formatkpi(value, kpi):
    return kpiformat_func(value, kpi)


@register.filter
def getkpi(src, kpi):
    value = src.get(kpi) or 0
    return value


@register.filter
def addint(base, value):
    return base + value
