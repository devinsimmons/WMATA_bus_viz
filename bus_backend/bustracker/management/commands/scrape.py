from django.core.management.base import BaseCommand, CommandError
from django.utils.timezone import make_aware

from bustracker.models import Schedules, BusPositions
import http.client, urllib.request, urllib.parse, urllib.error, base64
import ast
import pytz
import datetime


API_KEY = '6351dad7ec9d4c4f9f03bab9b5180c38';


#this class scrapes data from the bus postions wmata API
#and posts it to the db
class Command(BaseCommand):

    def handle(self, *args, **options):
        headers = {
            # Request headers
            'api_key': API_KEY,
        }
        try:
            conn = http.client.HTTPSConnection('api.wmata.com')
            conn.request(
                "GET", 
                "/Bus.svc/json/jBusPositions?", 
                "{body}", 
                headers)
            response = conn.getresponse()
            data = response.read().decode('UTF-8')
            bus_positions = ast.literal_eval(data)['BusPositions']
            
            for i in bus_positions:
                print(i['TripID'])
                BusPositions.objects.create(
                    date_time = convert_datetime(i['DateTime']),
                    deviation = i['Deviation'],
                    lat = i['Lat'],
                    lon = i['Lon'],
                    route_id = i['RouteID'],
                    end_time = convert_datetime(i['TripEndTime']),
                    start_time = convert_datetime(i['TripStartTime']),
                    trip_id = i['TripID'],
                    vehicle_id = i['VehicleID']
                )
                
            conn.close()
        except Exception as e:
            print("[Errno {0}] {1}".format(e.errno, e.strerror))


#function to deal with annoying datetime conversion stuff. it takes the datetime
#string from the json, properly formats it, and adds an EST timezone so that the 
#datetime can be correctly passed to the database
def convert_datetime(time_obj):
    date_format = '%Y-%m-%d %H:%M:%S'
    time_list = time_obj.split('T')
    time_obj = (' ').join(time_list)

    unaware_time = datetime.datetime.strptime(time_obj, date_format)
    aware_time = pytz.timezone('America/New_York').localize(unaware_time)
    
    return aware_time
