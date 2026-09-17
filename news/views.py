import requests
from django.core.cache import cache
from django.http.response import JsonResponse, HttpResponse
from django.shortcuts import render
from newsdataapi import NewsDataApiClient, NewsdataNetworkError, NewsdataAPIError, NewsdataRateLimitError, NewsdataServerError

from GamePulse.settings import NEWSDATA_API_KEY


def gaming_news(request):
    cache_key = f'gamepulse_news_cr7_sui_1x3cf2ghvb'
    cached_data = cache.get(cache_key)

    if cached_data is not None:
        return render(request, 'news/news.html', {
            **cached_data,
            'cached': True
        })
    
    try:
        params = {
            'apikey': NEWSDATA_API_KEY,
            'q': 'gaming PC games',
            'language': 'en',
            'size': 10,
        }

        api = NewsDataApiClient(apikey=NEWSDATA_API_KEY)
        r = api.latest_api(q=params['q'], language=params['language'], size=params['size'])
        data_to_cache = {
            'data': r['results']
        }
        cache.set(cache_key, data_to_cache, timeout=43200)

    except (requests.exceptions.RequestException, ValueError):
        return render(request, 'news/news.html', {'error': 'Database is temporarily down, please try again later'})
    except (NewsdataNetworkError, NewsdataAPIError, NewsdataRateLimitError, NewsdataServerError):
        return HttpResponse('Please check your internet connection and try again!')

    return render(request, 'news/news.html', {**data_to_cache, 'cached': False})


