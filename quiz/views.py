from urllib.error import HTTPError

from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Question, Tip, Praise
import json


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
    questions_data = [
        {
            'text': q.text,
            'options': [
                {
                    'text': opt.text,
                    'score': opt.score,
                    'category': opt.category,
                    'socialBonus': opt.socialBonus
                } for opt in q.options.all()
            ]
        } for q in Question.objects.prefetch_related('options')
    ]
    # Tipps werden sowieso nun als eigenes Modell verwaltet – optional ganz weglassen hier
    return JsonResponse({'questions': questions_data})

def results(request):
    return render(request, 'quiz/results.html') 

def get_results(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Nur GET erlaubt'}, status=405)

    # Alle Fragen & Optionen (für eventuelles Mapping im JS)
    questions_data = [
        {
            'id': q.id,
            'text': q.text,
            'options': [
                {
                    'text': opt.text,
                    'score': opt.score,
                    'category': opt.category,
                    'socialBonus': opt.socialBonus
                } for opt in q.options.all()
            ]
        } for q in Question.objects.prefetch_related('options')
    ]

    # Tipps & Lob vorab mitliefern (Frontend filtert)
    tips_data = [
        {'category': tip.category, 'text': tip.text}
        for tip in Tip.objects.all()
    ]

    praise_data = [
        {'category': praise.category, 'text': praise.text}
        for praise in Praise.objects.all()
    ]

    return JsonResponse({
        'questions': questions_data,
        'tips': tips_data,
        'praises': praise_data,
    })

@csrf_exempt
def save_answers(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  # Versuchen, die Daten zu laden
            # Poll-Antworten in der Session speichern
            request.session['pollAnswers'] = data.get('answers', [])
            return JsonResponse({'status': 'ok'})  # Erfolgreiche Antwort
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)  # Fehler bei JSON-Parsing
    return JsonResponse({'error': 'Invalid request'}, status=400)  # Fehler, wenn keine POST-Anfrage

@csrf_exempt
def get_feedback(request):
    if request.method != "POST":
        return JsonResponse({'error': 'Invalid request'}, status=400)

    data = json.loads(request.body)
    best = data.get('bestCategory')
    worst = data.get('worstCategory')

    praise = Praise.objects.filter(category=best).order_by('?').first()
    tip = Tip.objects.filter(category=worst).order_by('?').first()

    praise_text = praise.text if praise else f"Toll gemacht in der Kategorie {best}!"
    tip_text = tip.text if tip else f"Schau dir doch mal Tipps für {worst} an!"

    return JsonResponse({
        'praise': praise_text,
        'tip': tip_text
    })



