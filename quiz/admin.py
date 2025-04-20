from django.contrib import admin
from .models import Question, Option

class OptionInline(admin.TabularInline):  # oder StackedInline
    model = Option
    extra = 1  # wie viele leere Optionen beim Erstellen

class QuestionAdmin(admin.ModelAdmin):
    inlines = [OptionInline]

admin.site.register(Question, QuestionAdmin)
