from django.contrib import admin
from .models import Question, Option, Tip, Praise, UserScore

class OptionInline(admin.TabularInline):  # oder StackedInline
    model = Option
    extra = 4  # wie viele leere Optionen beim Erstellen

class QuestionAdmin(admin.ModelAdmin):
    inlines = [OptionInline]

class TipAdmin(admin.ModelAdmin):
    list_display = ('category', 'text')  # Zeigt die Kategorie und den Text der Tipps
    search_fields = ('category', 'text')  # Ermöglicht die Suche nach Kategorie und Text
    list_filter = ('category',)  # Ermöglicht das Filtern der Tipps nach Kategorie


class PraiseAdmin(admin.ModelAdmin):
    list_display = ('category', 'text')  # Zeigt die Kategorie und den Text des Lobs
    search_fields = ('category', 'text')  # Ermöglicht die Suche nach Kategorie und Text
    list_filter = ('category',)  # Ermöglicht das Filtern des Lobs nach Kategorie

@admin.register(UserScore)    
class UserScoreAdmin(admin.ModelAdmin):
    list_display = ('name', 'total_score', 'include_in_leaderboard')
    search_fields = ('name',)
    
# Registrierung der Modelle im Admin
admin.site.register(Question, QuestionAdmin)
admin.site.register(Tip, TipAdmin)
admin.site.register(Praise, PraiseAdmin)