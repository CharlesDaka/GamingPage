import json
from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from django.urls import reverse
from django.test import RequestFactory

from .views import games_page, normalize_game


class NormalizeGameTests(SimpleTestCase):
    def test_normalizes_freetogame_data_to_rawg_shape(self):
        game = {
            'title': 'Portal 2',
            'thumbnail': 'https://example.com/thumb.jpg',
            'short_description': 'A puzzle game',
            'game_url': 'https://example.com',
            'genre': 'Puzzle',
            'publisher': 'Valve',
            'developer': 'Valve',
            'release_date': '2024-01-01',
        }

        normalized = normalize_game(game)

        self.assertEqual(normalized['name'], 'Portal 2')
        self.assertEqual(normalized['background_image'], 'https://example.com/thumb.jpg')
        self.assertEqual(normalized['released'], '2024-01-01')
        self.assertEqual(normalized['rating'], 0)


class GamesPageTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_homepage_renders(self):
        response = self.client.get(reverse('games_homepage:homepage'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'games/index.html')

    @patch('games.views.cache.set')
    @patch('games.views.cache.get', return_value=None)
    @patch('games.views.requests.get')
    def test_search_requests_supported_page_and_preserves_pagination(self, mock_get, mock_cache_get, mock_cache_set):
        api_response = Mock()
        api_response.json.return_value = {
            'count': 81,
            'results': [{'id': 1, 'name': 'Portal 2'}],
            'next': 'https://api.rawg.io/api/games?page=3',
            'previous': 'https://api.rawg.io/api/games?page=1',
        }
        mock_get.return_value = api_response
        request = self.factory.get(
            '/games/PC',
            {'q': 'portal', 'sort_by': 'name', 'page': '2'},
        )

        response = games_page(request, platform='PC')
        payload = json.loads(response.content)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload['currentPage'], 2)
        self.assertEqual(payload['totalCount'], 81)
        self.assertIn('q=portal', payload['nextPage'])
        self.assertIn('sort_by=name', payload['nextPage'])
        self.assertIn('page=3', payload['nextPage'])
        self.assertEqual(mock_get.call_args.kwargs['params']['page_size'], '40')
        self.assertEqual(mock_get.call_args.kwargs['params']['page'], 2)
        self.assertEqual(mock_get.call_args.kwargs['params']['search'], 'portal')
        mock_cache_set.assert_called_once()

    @patch('games.views.cache.set')
    @patch('games.views.cache.get', return_value=None)
    @patch('games.views.requests.get')
    def test_filters_adult_tagged_games_regardless_of_last_result(self, mock_get, mock_cache_get, mock_cache_set):
        api_response = Mock()
        api_response.json.return_value = {
            'count': 3,
            'results': [
                {'id': 1, 'name': 'Portal 2', 'tags': []},
                {'id': 2, 'name': 'Adult game', 'tags': [{'name': 'Adult Only'}]},
                {'id': 3, 'name': 'Another game', 'tags': []},
            ],
        }
        mock_get.return_value = api_response
        request = self.factory.get('/games/All')

        response = games_page(request, platform='All')
        payload = json.loads(response.content)

        self.assertEqual([game['id'] for game in payload['games']], [1, 3])

    @patch('games.views.requests.get')
    @patch('games.views.cache.get')
    def test_cached_page_skips_api_request(self, mock_cache_get, mock_get):
        mock_cache_get.return_value = {
            'games': [{'id': 1, 'name': 'Portal 2'}],
            'nextPage': None,
            'prevPage': None,
            'currentPage': 1,
            'totalCount': 1,
        }
        request = self.factory.get('/games/All')

        response = games_page(request, platform='All')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(json.loads(response.content)['from_cache'])
        mock_get.assert_not_called()
