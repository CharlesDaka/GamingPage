import json
from urllib.parse import urlencode

from django.http import JsonResponse, HttpResponse
import requests
from django.shortcuts import redirect, render
from django.core.cache import cache

from GamePulse.settings import RAWG_KEY
from .models import Game

def health_check(request):
    return HttpResponse("Healthy! OK", status=200)
    

def normalize_game(game):
    genres = game.get('genres') or []
    developers = game.get('developers') or []
    publishers = game.get('publishers') or []

    return {
        **game,
        'name': game.get('name') or game.get('title'),
        'background_image': game.get('background_image') or game.get('thumbnail'),
        'released': game.get('released') or game.get('release_date'),
        'rating': game.get('rating') or 0,
        'screenshots': game.get('screenshots') or [],
        'platforms': game.get('platforms') or [],
        'description': game.get('description') or game.get('short_description') or '',
        'genre': game.get('genre') or ', '.join(item.get('name', '') for item in genres),
        'developer': game.get('developer') or ', '.join(item.get('name', '') for item in developers),
        'publisher': game.get('publisher') or ', '.join(item.get('name', '') for item in publishers),
        'status': game.get('status') or ('released' if game.get('released') else 'unknown'),
        'game_url': game.get('game_url') or game.get('website'),
    }


def homepage(request):
    return render(request, 'games/index.html')


def games_page(request, platform='All'):
    query = request.GET.get('q', '').strip()
    sort_by = request.GET.get('sort_by', '-rating')
    try:
        page = max(int(request.GET.get('page', 1)), 1)
    except (TypeError, ValueError):
        page = 1
    url = f'https://api.rawg.io/api/games'
    
    platform_mapping = {
        'All': ('4,187,18,16,186,1,14,7,3,21,5,6', 'fa fa-gear'),
        'PC': ('4', 'fab fa-windows'),
        'PlayStation': ('187,18,16', 'fab fa-playstation'),
        'Xbox': ('186,1,14', 'fab fa-xbox'),
        'Nintendo': ('7', 'bi bi-nintendo-switch'),
        'iOS': ('3', 'fab fa-apple'),
        'Android': ('21', 'fab fa-android'),
        'macOS': ('5', 'fab fa-apple'),
        'Linux': ('6', 'fab fa-linux'),
    }

    if platform in platform_mapping:
        platform_id, classForPlatform = platform_mapping[platform]
        err_message = None
    else:
        platform_id, classForPlatform = platform_mapping['All']
        err_message = f"Invalid platform: \"{platform}\". Showing games for all platforms."

    cache_key = f'rawg_games_{platform_id}_{query}_{sort_by}_{page}_adultfilter_v2'

    cached_data = cache.get(cache_key)

    if cached_data is not None:
        return JsonResponse({
            **cached_data,
            'message': err_message,
            'classForPlatform': classForPlatform,
            'query': query or None,
            'from_cache': True,
        })

    params = {
        'key': RAWG_KEY,
        'page_size': '40',
        'page': page,
        'platforms': platform_id,
        'ordering': sort_by
    }
    
    if query:
        params['search'] = query

    try:
        r = requests.get(url, params=params)
        r.raise_for_status()
        data = r.json()

        adult_tags = {
            'mature', 'adult only', 'sexual content', 'nudity', 'violence',
            'gore', 'hentai', 'clicker', 'idler', 'хентай', 'idle-игра'
        }

        for game in data.get('results', []):
            game['tags'] = [tag['name'] for tag in game.get('tags', [])]
            game['isAdult'] = any(tag.casefold() in adult_tags for tag in game['tags'])

        data['results'] = [game for game in data.get('results', []) if not game['isAdult']]

        # Define a function to generate the URL for the next and previous pages
        def page_url(page_number):
            query_params = {
                'sort_by': sort_by,
                'page': page_number,
            }
            if query:
                query_params['q'] = query
            return f'{request.path}?{urlencode(query_params)}'

        data_to_cache = {
            'games': data.get('results', []),
            'nextPage': page_url(page + 1) if data.get('next') else None,
            'prevPage': page_url(page - 1) if page > 1 and data.get('previous') else None,
            'currentPage': page,
            'totalCount': data.get('count', 0),
        }
        cache.set(cache_key, data_to_cache, timeout=43200)

    except (requests.exceptions.RequestException, ValueError):
        freetogame_url = 'https://www.freetogame.com/api/games'
        ftg_params = {
            'platform': 'windows'
        }

        r = requests.get(freetogame_url, params=ftg_params)
        r.raise_for_status()
        games = r.json()
        if query:
            games = [game for game in games if query.lower() in game.get('title', '').lower()]
                
        data_to_cache ={
            'games': games,
            'nextPage' : None,
            'prevPage' : None,
            'currentPage': page,
            'totalCount': len(games),
        }
        cache.set(cache_key, data_to_cache, timeout=43200)
        err_message = "The main database is temporarily unavailable. Using Secondary games."
        
    return JsonResponse({
        **data_to_cache,
        'message': err_message,
        'classForPlatform': classForPlatform,
        'query': query or None,
    })


def game_details(request, game_id):
    cache_key = f'rawg_game_details_{game_id}_at_loadoutdaily_siu'

    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return JsonResponse({
            **cached_data,
            'detailsFrom': 'rawg',
            'fromCache': True,
        })

    try:
        url = f'https://api.rawg.io/api/games/{game_id}'
        screenshots_url = f'https://api.rawg.io/api/games/{game_id}/screenshots'
        additions_url = f'https://api.rawg.io/api/games/{game_id}/additions'
        stores_url = f'https://api.rawg.io/api/games/{game_id}/stores'

        params = {
            'key': RAWG_KEY,
        }

        r = requests.get(url, params=params)
        s_r = requests.get(screenshots_url, params=params)
        a_r = requests.get(additions_url, params=params)
        st_r = requests.get(stores_url, params=params)

        r.raise_for_status()
        s_r.raise_for_status()
        a_r.raise_for_status()
        st_r.raise_for_status()

        d = normalize_game(r.json())
        screenshots = s_r.json().get('results', [])
        additions = a_r.json().get('results', [])
        stores = st_r.json().get('results', [])

        for store in stores:
            st_d_url = f'https://api.rawg.io/api/stores/{store["store_id"]}'
            st_d_r = requests.get(st_d_url, params=params)
            st_d_r.raise_for_status()
            store_name = st_d_r.json().get('name')
            store['storeName'] = store_name

            if store['storeName'] == 'Steam':
                store['className'] = 'fab fa-steam'
            elif store['storeName'] == 'Epic Games':
                store['className'] = 'fa-brands fa-unreal-engine'
            elif store['storeName'] == 'GOG':
                store['className'] = 'fa-solid fa-store'
            elif store['storeName'] == 'Xbox Store' or store['storeName'] == 'Xbox 360 Store':
                store['className'] = 'fab fa-xbox'
            elif store['storeName'] == 'PlayStation Store':
                store['className'] = 'fab fa-playstation'
            else:
                store['className'] = 'fa-solid fa-cart-plus'

        details_from = 'rawg'
        details_to_cache = {
                'gameDetails': d,
                'screenshots': screenshots,
                'additions': additions,
                'stores': stores,
                'storeName': store['storeName'] if stores else None,
                'storeClassName': store['className'] if stores else None,
                'detailsFrom': details_from
            }
        cache.set(cache_key, details_to_cache, timeout=43200)

    except (requests.exceptions.HTTPError, requests.exceptions.RequestException) as error:
        if error.response is not None and error.response.status_code == 404:
            return JsonResponse({'message': 'This game was not found.'}, status=404)
        d = None
        screenshots = []
        additions = []
        stores = []
        details_from = 'freetogame'

    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout, ValueError):
        d = None
        screenshots = []
        additions = []
        stores = []
        details_from = 'freetogame'

    if d is None:
        freetogame_url = 'https://www.freetogame.com/api/games'
        r = requests.get(freetogame_url)
        r.raise_for_status()
        games_list = r.json()

        if d is None:
            return JsonResponse({'message': 'Game not found. Please try another game.'}, status=404)
        d = normalize_game(d)
        details_to_cache = {
            'gameDetails': d,
            'screenshots': [],
            'additions': [],
            'stores': [],
            'storeName': None,
            'storeClassName': None,
            'detailsFrom': 'freetogame',
        }

    return JsonResponse({
                **details_to_cache,
                'fromcache': False,
            })


def game_trailers(request, game_id):
    try:
        t_url = f'https://api.rawg.io/api/games/{game_id}/movies'
        params = {
            'key': RAWG_KEY,
        }
        t_r = requests.get(t_url, params=params)
        t_r.raise_for_status()
        trailers = t_r.json().get('results', [])
        return JsonResponse({'trailers': trailers})
    except requests.exceptions.HTTPError as error:
        if error.response is not None and error.response.status_code == 404:
            return JsonResponse({'message': 'Trailers for this game were not found.'}, status=404)
        return JsonResponse({'message': 'An error occurred while fetching trailers, Check your internet connection and try again.'}, status=500)
    
