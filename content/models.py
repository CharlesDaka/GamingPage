from django.db import models

class Content(models.Model):
    title = models.CharField(max_length=255, blank=False)
    thumbnail = models.URLField()
    article_url = models.URLField()
    Category = models.ForeignKey('Categories', on_delete=models.CASCADE, related_name='contents', blank=True, null=True)
    date_posted = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.id} - Title: {self.title}"

    class Meta:
        ordering = ['-date_posted']


class Categories(models.Model):
    name = models.CharField(max_length=255, blank=False)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.id} - {self.name}"

    class Meta:
        ordering = ['name']
