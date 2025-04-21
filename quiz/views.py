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
     #Antworten holen – z. B. aus session
    answers = request.session.get('pollAnswers')
    if not answers:
        return redirect('index')  # oder poll

    questions = list(Question.objects.prefetch_related('options').all())
    
    #Punkte pro Kategorie sammeln
    scores_by_category = {}

    for q, answer_index in zip(questions, answers):
        options = list(q.options.all())
        if answer_index is None or answer_index >= len(options):
            continue
        selected = options[answer_index]
        cat = selected.category
        scores_by_category[cat] = scores_by_category.get(cat, 0) + selected.score

    if not scores_by_category:
        return render(request, "quiz/results.html", { 'error': 'Keine gültigen Antworten erhalten.' })

    #Beste & schlechteste Kategorie
    best = max(scores_by_category.items(), key=lambda x: x[1])[0]
    worst = min(scores_by_category.items(), key=lambda x: x[1])[0]

    #Feedback laden
    praise = Praise.objects.filter(category=best).order_by('?').first()
    tip = Tip.objects.filter(category=worst).order_by('?').first()

    context = {
        'best_category': best,
        'worst_category': worst,
        'praise': praise.text if praise else f"Toll gemacht in der Kategorie {best}!",
        'tip': tip.text if tip else f"Schau dir doch mal Tipps für {worst} an!"
    }

    return render(request, 'quiz/results.html', context)

@csrf_exempt
def save_answers(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        answers = data.get('answers', [])
        request.session['pollAnswers'] = answers  # Antworten in der Session speichern
        return JsonResponse({'status': 'ok'})
    return JsonResponse({'error': 'Invalid request'}, status=400)

