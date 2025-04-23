from django.db import models

# Create your models here.
class Question(models.Model):
    text = models.CharField(max_length=500)

    def __str__(self):
        return self.text

class Option(models.Model):
    question    = models.ForeignKey(Question, related_name='options', on_delete=models.CASCADE)
    text        = models.CharField(max_length=300)
    score       = models.IntegerField()
    category    = models.CharField(max_length=50)
    socialBonus = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.question.id} – {self.text[:30]}"
    
class Tip(models.Model):
    category = models.CharField(max_length=100)
    text = models.TextField()

    def __str__(self):
        return f"Tip for {self.category}: {self.text}"
    
class Praise(models.Model):
    category = models.CharField(max_length=100)
    text = models.TextField()

    def __str__(self):
        return f"Praise for {self.category}: {self.text}"
    
class UserScore(models.Model):
    name = models.CharField(max_length=100)
    total_score = models.IntegerField()
    include_in_leaderboard = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.name} - {self.total_score}'