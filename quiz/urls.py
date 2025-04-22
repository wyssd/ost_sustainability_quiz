from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name="index"),
    path('poll', views.poll, name="poll"),
    path('api/questions/', views.get_questions, name='get_questions'),
    path('results/', views.results, name="results"),
    path('api/results/', views.get_results, name='results_api'),
    path('api/save-answers/', views.save_answers, name="save_answers"),
    path('get_feedback/', views.get_feedback, name='get_feedback'),

]