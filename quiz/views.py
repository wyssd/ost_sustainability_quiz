from urllib.error import HTTPError

from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt


# Create your views here.

def index(request):
    template = loader.get_template('quiz/index.html')
    return HttpResponse(template.render({}, request))

def poll(request):
    if request.method != "POST":
        return redirect(index)

    participant_name = request.POST.get('participantName')
    leaderboard_choice = request.POST.get('leaderboardChoice', 'no')  # Default to 'no' if not selected

    context = {
        'participant_name': participant_name,
        'show_on_leaderboard': leaderboard_choice == 'yes'
    }

    template = loader.get_template('quiz/poll.html')
    return HttpResponse(template.render(context, request))
