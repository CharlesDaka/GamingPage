from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):

    def __str__(self):
        return f'{self.username}'


class Game(models.Model):
    title = models.CharField(max_length=200)
    platform = models.CharField(max_length=100)
    thumbnail = models.URLField()
    short_description = models.TextField()
    game_url = models.URLField()
    genre = models.CharField(max_length=100)
    publisher = models.CharField(max_length=100)
    developer = models.CharField(max_length=100)
    release_date = models.DateField()

    def __str__(self):
        return self.title
    