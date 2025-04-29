from django.contrib import admin
from .models import Question, Option, UserScore

class OptionInline(admin.TabularInline):  # oder StackedInline
    model = Option
    extra = 1  # wie viele leere Optionen beim Erstellen
    fields = ('text', 'score', 'extra', 'improvement')  # Diese Felder im Inline-Form anzeigen

class QuestionAdmin(admin.ModelAdmin):
    inlines = [OptionInline]

@admin.register(UserScore)    
class UserScoreAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'total_score', 'include_in_leaderboard')
    search_fields = ('name',)
    
# Registrierung der Modelle im Admin
admin.site.register(Question, QuestionAdmin)
