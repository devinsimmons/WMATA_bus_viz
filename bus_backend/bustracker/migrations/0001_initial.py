# Generated by Django 3.0.6 on 2020-09-12 18:01

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='BusPositions',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_time', models.DateTimeField()),
                ('deviation', models.IntegerField()),
                ('lat', models.DecimalField(decimal_places=6, max_digits=9)),
                ('lon', models.DecimalField(decimal_places=6, max_digits=9)),
                ('route_id', models.CharField(max_length=8)),
                ('end_time', models.DateTimeField()),
                ('start_time', models.DateTimeField()),
                ('trip_id', models.CharField(max_length=10)),
                ('vehicle_id', models.CharField(max_length=4)),
            ],
        ),
        migrations.CreateModel(
            name='Schedules',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('direction_num', models.IntegerField()),
                ('end_time', models.DateTimeField()),
                ('route_id', models.CharField(max_length=8)),
                ('start_time', models.DateTimeField()),
                ('trip_direction_text', models.CharField(max_length=5)),
                ('trip_headsign', models.CharField(max_length=50)),
                ('trip_id', models.CharField(max_length=10)),
            ],
        ),
    ]
