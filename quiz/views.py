from urllib.error import HTTPError

from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Question


# Create your views here.

def index(request):
    template = loader.get_template('quiz/index.html')
    return HttpResponse(template.render({}, request))

def poll(request):
    if request.method != "POST":
        return redirect(index)

    participant_name = request.POST.get('participantName', 'naughty user') # if user tries to get around the client side validation just display this funny username on leaderboard
    leaderboard_choice = request.POST.get('leaderboardChoice', 'no')  # Default to 'no' if not selected

    context = {
        'participant_name': participant_name,
        'show_on_leaderboard': leaderboard_choice == 'yes'
    }

    template = loader.get_template('quiz/poll.html')
    return HttpResponse(template.render(context, request))

def get_questions(request):
    data = []
    for q in Question.objects.prefetch_related('options').all():
        data.append({
            'text': q.text,
            'options': [
                {
                    'text': o.text,
                    'score': o.score,
                    'category': o.category,
                    'socialBonus': o.socialBonus
                } for o in q.options.all()
            ]
        })
    # Optional: Tips aus Settings oder ebenfalls als Model
    tips = {
        'transport': ['Nutze das Fahrrad oder gehe zu Fuss🚲🚶', 'Bilde Fahrgemeinschaften🚗', '🚋 Öffis bevorzugen!'],
        'materials': ['Verwende PDF-Reader mit Notizfunktion statt auszudrucken.', 'Scanne handschriftliche Notizen und speichere sie digital.', 'Tausche Materialien online mit anderen Studierenden aus.'],
        'food': ['Bereite Mahlzeiten zu Hause vor – günstig und nachhaltig.', 'Wähle vegetarische oder vegane Optionen in der Mensa.', 'Vermeide Verpackungsmüll durch eigene Brotboxen.'],
        
        # …
    }
    return JsonResponse({'questions': data, 'tips': tips})

def results(request):
    template = loader.get_template('quiz/results.html')
    return HttpResponse(template.render({}, request))
