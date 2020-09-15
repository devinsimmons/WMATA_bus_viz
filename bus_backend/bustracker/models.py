from django.db import models

class BusPositions(models.Model):
    date_time = models.DateTimeField()
    deviation = models.IntegerField()
    lat = models.DecimalField(max_digits = 9, decimal_places = 6)
    lon = models.DecimalField(max_digits = 9, decimal_places = 6)
    route_id = models.CharField(max_length = 8)
    end_time = models.DateTimeField()
    start_time = models.DateTimeField()
    trip_id = models.CharField(max_length = 10)
    vehicle_id = models.CharField(max_length = 4)


class Schedules(models.Model):
    direction_num = models.IntegerField()
    end_time = models.DateTimeField()
    route_id = models.CharField(max_length = 8)
    start_time = models.DateTimeField()
    trip_direction_text = models.CharField(max_length = 5)
    trip_headsign = models.CharField(max_length = 50)
    trip_id = models.CharField(max_length = 10)

