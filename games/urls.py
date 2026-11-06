from django.urls import path

from . import views

app_name = 'games_homepage'

urlpatterns = [
    path('', views.homepage, name='homepage'),
    path('game/<int:game_id>', views.game_details, name='game_details'),
    path('game/<int:game_id>/trailers', views.game_trailers, name='game_trailers'),
    path('games/<str:platform>', views.games_page, name='games_page'),
    path('health-check', views.health_check)
]
