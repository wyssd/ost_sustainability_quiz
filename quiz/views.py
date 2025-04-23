from urllib.error import HTTPError

from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest
from django.template import loader
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Question, Tip, Praise, UserScore
import json


# Create your views here.

def index(request):
    template = loader.get_template('quiz/index.html')
    return HttpResponse(template.render({}, request))

from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import UserScore

def poll(request):
    if request.method == 'GET':
        # Setze den Namen und den Leaderboard-Wunsch nur einmal, falls noch nicht gesetzt
        if 'participantName' not in request.session:
            participant_name = request.GET.get('participantName', 'naughty user')  # Vom GET erhalten
            request.session['participantName'] = participant_name

        if 'includeInLeaderboard' not in request.session:
            leaderboard_choice = request.GET.get('leaderboardChoice', 'no')  # Vom GET erhalten
            request.session['includeInLeaderboard'] = leaderboard_choice

        participant_name = request.session.get('participantName', 'naughty user')
        leaderboard_choice = request.session.get('includeInLeaderboard', 'no')
        total_score = request.session.get('total_score', 0)

        poll_answers = request.session.get('pollAnswers')
        if not poll_answers:
            return redirect('no_answers')  # Optional: Fehlerseite anzeigen

        context = {
            'participant_name': participant_name,
            'show_on_leaderboard': leaderboard_choice == 'yes',
            'total_score': total_score
        }

        return render(request, 'quiz/poll.html', context)

    elif request.method == 'POST':
        # Nutze den Namen und das Leaderboard, die in der Session gespeichert sind
        participant_name = request.session.get('participantName', 'naughty user')
        leaderboard_choice = request.session.get('includeInLeaderboard', 'no')

        poll_answers = request.session.get('pollAnswers')
        total_score = request.session.get('total_score', 0)

        if not poll_answers:
            return redirect('no_answers')  # Optional: eigene Fehlerseite

        # Erstelle den Score in der Datenbank
        UserScore.objects.create(
            name=participant_name,
            total_score=total_score,
            include_in_leaderboard=(leaderboard_choice == 'yes')
        )

        print(f"Antworten: {poll_answers}, Gesamtpunktzahl: {total_score}")
        
        context = {
            'participant_name': participant_name,
            'show_on_leaderboard': leaderboard_choice == 'yes',
            'total_score': total_score
        }

        return render(request, 'quiz/poll.html', context)

    return JsonResponse({'error': 'Invalid request method'}, status=400)



def get_questions(request):
    try:
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
    except Question.DoesNotExist:
        return JsonResponse({'error': 'Fragen nicht gefunden'}, status=404)

    return JsonResponse({'questions': questions_data})

def results(request):
    leaderboard = UserScore.objects.all().order_by('-total_score')  # Sortiere nach der Gesamtpunktzahl, absteigend
    context = {
        'leaderboard': leaderboard
    }
    return render(request, 'quiz/results.html', context) 

def get_results(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Nur GET erlaubt'}, status=405)

    try:
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
        
        tips_data = [
            {'category': tip.category, 'text': tip.text}
            for tip in Tip.objects.all()
        ]
        
        praise_data = [
            {'category': praise.category, 'text': praise.text}
            for praise in Praise.objects.all()
        ]
    except Exception as e:
        return JsonResponse({'error': 'Fehler beim Abrufen der Daten: ' + str(e)}, status=500)

    return JsonResponse({
        'questions': questions_data,
        'tips': tips_data,
        'praises': praise_data,
    })

# In your views.py
@csrf_exempt
def save_answers(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            name = data.get("participantName", "Unbekannt")
            score = data.get("total_score", 0)
            include_in_leaderboard = data.get("include_in_leaderboard", True)

            print(f"Name: {name}, Score: {score}, Leaderboard: {include_in_leaderboard}")

            UserScore.objects.create(
                name=name,
                total_score=score,
                include_in_leaderboard=include_in_leaderboard
            )

            return JsonResponse({'message': 'Erfolg'}, status=200)

        except Exception as e:
            print(f"Fehler beim Speichern: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    
    # Wenn kein POST-Request
    return HttpResponseBadRequest("Nur POST-Requests erlaubt.")

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

def get_leaderboard(request):
    leaderboard_data = UserScore.objects.all().order_by('-total_score')[:20]
    leaderboard = []

    for entry in leaderboard_data:
        display_name = entry.name if entry.include_in_leaderboard else "Anonymer Teilnehmer"
        leaderboard.append({
            "name": display_name,
            "total_score": entry.total_score
        })

    return JsonResponse({"leaderboard": leaderboard})


