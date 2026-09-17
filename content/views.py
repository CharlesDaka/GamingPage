from django.shortcuts import render

from .models import Content

def index(request):
    all_contents = Content.objects.all()
    contents = all_contents.order_by('-date_posted')[:10]
    next_contents = all_contents.order_by('-date_posted')[10:20]
    return render(request, 'content/index.html', {'contents': contents, 'next_contents': next_contents})
