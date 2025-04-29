from django.db import models

# Create your models here.
class Question(models.Model):
    text = models.CharField(max_length=500)
    category    = models.CharField(max_length=50)

    def __str__(self):
        return self.text

class Option(models.Model):
    question    = models.ForeignKey(Question, related_name='options', on_delete=models.CASCADE)
    text        = models.CharField(max_length=300)
    score       = models.IntegerField()
    extra = models.CharField(max_length=300, blank=True, null=True)
    improvement = models.CharField(max_length=300, blank=True, null=True)


    def __str__(self):
        return f"{self.question.id} – {self.text[:30]}"
    
class UserScore(models.Model):
    name = models.CharField(max_length=100)
    total_score = models.IntegerField()
    include_in_leaderboard = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.name} - {self.total_score}'