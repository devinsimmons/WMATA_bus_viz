from django.contrib import admin
from bustracker.models import BusPositions, Schedules


admin.site.register(BusPositions)
admin.site.register(Schedules)