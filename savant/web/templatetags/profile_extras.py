from django import template

register = template.Library()


@register.filter
def in_chain(things, chain):
    return things.filter(chain=chain)


@register.filter
def in_site(things, site):
    return things.filter(site=site)
