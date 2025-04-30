from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name="index"),
    path('poll', views.poll, name="poll"),
    path('api/questions/', views.get_questions, name='get_questions'),
    path('results/', views.results, name="results"),
    path('api/save-answers/', views.save_answers, name="save_answers"),
    path('leaderboard/', views.leaderboard, name="leaderboard"),
    
]