from urllib.error import HTTPError
from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
from django.template import loader
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Question, UserScore
import json


# Create your views here.

def index(request):
    template = loader.get_template('quiz/index.html')
    return HttpResponse(template.render({}, request))

def poll(request):
    participant_name = request.session.get('participantName', 'naughty user')
    leaderboard_choice = request.session.get('includeInLeaderboard', 'no')
    total_score = request.session.get('total_score', 0)
    poll_answers = request.session.get('pollAnswers')

    context = {
        'participant_name': participant_name,
        'show_on_leaderboard': leaderboard_choice == 'yes',
        'total_score': total_score
        }

    if request.method == 'GET':
        # Setze den Namen und Leaderboard-Wunsch aus GET-Parametern (z.B. aus Redirect)
        if 'participantName' not in request.session:
            participant_name = request.GET.get('participantName', 'naughty user')
            request.session['participantName'] = participant_name

        if 'includeInLeaderboard' not in request.session:
            leaderboard_choice = request.GET.get('leaderboardChoice', 'no')
            request.session['includeInLeaderboard'] = leaderboard_choice

        return render(request, 'quiz/poll.html', context)

    elif request.method == 'POST':
        # Nur Session-Werte lesen und Ergebnisse anzeigen

        print(f"[Nur anzeigen] Antworten: {poll_answers}, Gesamtpunktzahl: {total_score}")

        return render(request, 'quiz/poll.html', context)

    return JsonResponse({'error': 'Invalid request method'}, status=400)


def get_questions(request):
    questions_data = [
        {
            'text': q.text,
            'category': q.category,
            'options': [
                {
                    'text': opt.text,
                    'score': opt.score,
                    'extra': getattr(opt, 'extra', ''),
                    'improvement': getattr(opt, 'improvement', ''),
                } for opt in q.options.all()
            ]
            } for q in Question.objects.prefetch_related('options')
        ]
    if not questions_data:
        return JsonResponse({'error': 'Keine Fragen gefunden'}, status=404)

    return JsonResponse({'questions': questions_data})

def results(request):
    # Rangliste laden
    leaderboard = UserScore.objects.all().order_by('-total_score')
    
    # Abrufen der Kategorie Scores (z.B. aus der Session oder der Datenbank)
    category_scores = request.session.get('categoryScores', {})

    # Um die beste und schlechteste Kategorie zu berechnen
    sorted_categories = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
    best_category = sorted_categories[0][0] if sorted_categories else None
    worst_category = sorted_categories[-1][0] if sorted_categories else None
    
    # Falls beste und schlechteste Kategorie gleich sind (Gleichstand), wähle eine andere
    if best_category == worst_category and len(sorted_categories) > 1:
        worst_category = sorted_categories[-2][0]
    
    context = {
        'leaderboard': leaderboard,
        'best_category': best_category,
        'worst_category': worst_category,
    }
    
    return render(request, 'quiz/results.html', context)

@csrf_exempt
def save_answers(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            name = data.get("participantName", "Unbekannt")
            score = data.get("total_score", 0)
            include_in_leaderboard = data.get("include_in_leaderboard", True)

            print(f"Name: {name}, Score: {score}, Leaderboard: {include_in_leaderboard}")

            saved_user = UserScore.objects.create(
                name=name,
                total_score=score,
                include_in_leaderboard=include_in_leaderboard
            )
            
            request.session['current_user_pk'] = saved_user.pk

            return JsonResponse({'message': 'Erfolg'}, status=200)

        except Exception as e:
            print(f"Fehler beim Speichern: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    
    return HttpResponseBadRequest("Nur POST-Requests erlaubt.")

def leaderboard(request):
    leaderboard_data = UserScore.objects.filter(include_in_leaderboard=True).order_by('-total_score')
    current_user_pk = request.session.get('current_user_pk')
    
    context = {
        'leaderboard': leaderboard_data,
        'current_user_pk': current_user_pk,
    }
    return render(request, 'quiz/leaderboard.html', context)