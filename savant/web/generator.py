"""Generate initial data for testing"""

import datetime
import django
import os
import sys
import string
import random
from django.db import transaction
from os.path import abspath, dirname, join

path = abspath(join(dirname(abspath(__file__)), ".."))
sys.path.append(path)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "savant.settings.development")
django.setup()
from web import models


class Generator:
    """
    Generate 5 clients
    Each client has 5 chains
    Each chain has 5 sites
    Each site has 5 zones
    Create 3 sub-users for client01
    """

    chains = [
        (1, 'UAE'),
        (2, 'Kuwait'),
        (3, 'Bahrain'),
        (4, 'Quatar'),
        (5, 'KSA')
    ]

    def randstring(self, len):
        s = string.ascii_lowercase
        return ''.join(random.sample(s, len))

    def create_clients(self):
        for i in range(1, 6):
            c = models.User(username='client{}'.format(str(i).zfill(2)))
            c.set_password('111')
            c.save()
        print('clients have been created')

    def create_chains(self):
        l = []
        clients = models.User.objects.filter(username__startswith='client')
        for c in clients:
            for id, name in self.chains:
                chain = models.Chain(name=name)
                chain.client = c
                chain.chain_id = id
                l.append(chain)
        models.Chain.objects.bulk_create(l)
        print('chains have been created')

    def create_sites(self):
        l = []
        count = 0
        q = models.Chain.objects.all()
        for chain in q:
            for i in range(1, 6):
                count += 1
                site = models.Site(name=self.randstring(10).title())
                site.site_id = count
                site.chain_id = chain.id
                site.client_id = chain.client_id
                l.append(site)
        models.Site.objects.bulk_create(l)
        print('sites have been created')

    def create_zones(self):
        l = []
        count = 0
        q = models.Site.objects.all()
        for site in q:
            for i in range(1, 6):
                count += 1
                zone = models.Zone(name=self.randstring(5).title())
                zone.zone_id = count
                zone.site_id = site.id
                zone.client_id = site.client_id
                l.append(zone)

        models.Zone.objects.bulk_create(l)
        print('zones have been created')

    def create_subusers(self):
        user = models.User.objects.get(username='client01')
        for i in range(1, 4):
            sub = models.User(username='subuser{}'.format(str(i).zfill(2)))
            sub.parent = user
            sub.save()

    @transaction.atomic
    def create_m2m(self):
        q = models.Chain.objects.all()
        for chain in q:
            user = chain.client
            user.chain.add(chain)
            user.save()

        q = models.Site.objects.all()
        for site in q:
            user = site.client
            user.site.add(site)
            user.save()

        q = models.Zone.objects.all()
        for zone in q:
            user = zone.client
            user.zone.add(zone)
            user.save()
        print('m2m created')

    @transaction.atomic
    def create_reports(self):
        """
        Creates 10 000 Reports for client01 from csv file
        chains, zones and sites are from client (not csv)
        """
        user = models.User.objects.get(username='client01')
        chains = list(models.Chain.objects.filter(client_id=user.id))
        for chain in chains:
            sites = list(models.Site.objects.filter(chain_id=chain.id))
            for site in sites:
                zones = list(models.Zone.objects.filter(site_id=site.id))
                site.zones = zones
            chain.sites = sites

        models.Report.objects.filter(client_id=user.id).delete()

        count = 0
        with open('data.csv') as f:
            for line in f:
                line = line.strip()
                count += 1
                if count == 1:
                    continue

                if count > 10000:
                    return

                l = line.split(',')
                r = models.Report(client_id=user.id)

                chain = random.choice(chains)
                r.chain_id = chain.id
                r.chain_name = chain.name

                site = random.choice(chain.sites)
                r.site_id = site.id
                r.site_name = site.name

                zone = random.choice(site.zones)
                r.zone_id = zone.id
                r.zone_name = zone.name
                r.day = l[6][:10]
                r.datetime = l[6][:19]
                r.visitors_in = l[7]
                r.visitors_out = l[8]
                r.sales = l[9]
                r.transactions = l[10]
                r.associates = l[11]
                r.items = l[12]

                r.save()

    def create_warning_periods(self):
        w = models.WarningPeriod(days=1)
        w.message = 'You have 1 day left to upgrade your service,\
            please contact administartor'
        w.save()

        w = models.WarningPeriod(days=3)
        w.message = 'You have 3 days left to upgrade your service,\
            please contact administartor'
        w.save()

        w = models.WarningPeriod(days=30)
        w.message = 'You have 30 days left to upgrade your service,\
            please contact administartor'
        w.save()

        w = models.WarningPeriod(days=60)
        w.message = 'You have 60 days left to upgrade your service,\
            please contact administartor'
        w.save()

    def create_trial_periods(self):
        t = models.TrialPeriod(name='1 year', value=1)
        t.type_period = models.TrialPeriod.YEARS
        t.save()

        t = models.TrialPeriod(name='60 days', value=60)
        t.type_period = models.TrialPeriod.DAYS
        t.save()

        t = models.TrialPeriod(name='30 days', value=30)
        t.type_period = models.TrialPeriod.DAYS
        t.save()

    def create_client_management(self):
        for i in range(10, 16):
            self.client_management('client{}'.format(i))

    def client_management(self, name):
        """
        Create user for client management testing
        """
        start = datetime.datetime.strptime('01012015', '%d%m%Y').date()
        end = datetime.datetime.strptime('01012016', '%d%m%Y').date()

        # 1 year trial period
        tp = models.TrialPeriod.objects.get(id=1)

        u = models.User(username=name)
        u.set_password('111')
        u.start_date = start
        u.end_date = end
        u.trial_period = tp
        u.save()

        wp1 = models.WarningPeriod.objects.get(days=1)
        wp3 = models.WarningPeriod.objects.get(days=3)
        wp30 = models.WarningPeriod.objects.get(days=30)
        wp60 = models.WarningPeriod.objects.get(days=60)

        w = models.Warning()
        w.client_id = u.id
        w.period_id = wp1.id
        w.client_viewed = False
        w.dt_created = end - datetime.timedelta(days=1)
        w.save()

        w = models.Warning()
        w.client_id = u.id
        w.period_id = wp3.id
        w.client_viewed = True
        w.dt_viewed = end - datetime.timedelta(days=3)
        w.save()
        w.dt_created = w.dt_viewed
        w.save()

        w = models.Warning()
        w.client_id = u.id
        w.period_id = wp30.id
        w.client_viewed = True
        w.dt_viewed = end - datetime.timedelta(days=30)
        w.save()
        w.dt_created = w.dt_viewed
        w.save()

        w = models.Warning()
        w.client_id = u.id
        w.period_id = wp60.id
        w.client_viewed = True
        w.dt_viewed = end - datetime.timedelta(days=60)
        w.save()
        w.dt_created = w.dt_viewed
        w.save()

    def create_warning_email(self):
        s = models.Setting()
        s.code = 'warning_email'
        s.value = 'vladigris@gmail.com'
        s.info = 'Admin email for receiving warning messages.'
        s.type = 1
        s.save()


if __name__ == '__main__':
    g = Generator()
    # g.create_clients()
    # g.create_chains()
    # g.create_sites()
    # g.create_zones()
    # g.create_subusers()
    # g.create_m2m()
    # g.create_reports()
    # g.create_warning_periods()
    # g.create_trial_periods()
    # g.create_client_management()
    # g.create_warning_email()
