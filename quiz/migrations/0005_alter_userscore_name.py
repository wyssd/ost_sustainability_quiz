# Generated by Django 5.2 on 2025-04-22 23:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz', '0004_userscore'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userscore',
            name='name',
            field=models.CharField(default='Unbekannt', max_length=100),
        ),
    ]
