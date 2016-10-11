from rest_framework import serializers

from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = (
            'id', 'chain', 'site', 'zone', 'day', 'datetime',
            'visitors_in', 'visitors_out', 'occupancy', 'sales',
            'transactions', 'associates', 'items', 'date_time', 'chain_name',
            'zone_name', 'site_name')
