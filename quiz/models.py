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