# GamePulse

GamePulse is a Django-based gaming discovery and editorial web app that combines game listings, search, filters, detailed pages, and gaming news into one user experience. It pulls content from external APIs, normalizes the responses, and renders them in a responsive frontend built with HTML, CSS, JavaScript, and Django templates.

## Overview

The project allows users to:

- browse games from RAWG
- filter by platform
- search by title
- sort results by rating, name, or release date
- paginate results while preserving filters and sort state
- view detailed game information, screenshots, stores, trailers, and requirements
- read gaming news from NewsData
- browse editorial content stored in the local database

This is a full-stack project that demonstrates API integration, frontend interactivity, Django models, and deployment-ready configuration patterns.

## Tech Stack

- Python 3.11+
- Django 5+
- PostgreSQL (recommended for production)
- SQLite (default for local development)
- JavaScript
- HTML/CSS
- RAWG API
- NewsData API
- FreeToGame fallback

## Project Structure

- `GamePulse/` — project settings and Django config
- `games/` — game browsing, filtering, search, sorts, and detailed game views
- `news/` — news fetching and rendering
- `content/` — local database-backed article content
- `templates/` — shared layout and base HTML
- `static/` — CSS, JS, images, and service worker
- `manage.py` — Django project entry point
- `.env` — local environment secrets (not committed)
- `.env.example` — example environment template
- `requirements.txt` — Python dependencies

## Features

- platform-based filtering for PC, PlayStation, Xbox, Nintendo, mobile, and Linux
- shared navigation search across pages
- sorting and pagination with state retention
- dynamic game cards rendered in JavaScript
- detailed game page with metadata and media
- external API fallback when RAWG fails
- news section powered by NewsData
- admin-managed editorial content
- responsive layout for desktop and mobile screens

## Local Development Setup

1. Clone the repository.
2. Create and activate a virtual environment:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

3. Install dependencies:

```powershell
pip install -r requirements.txt
```

4. Create a `.env` file in the project root using the example template:

```env
DJANGO_SECRET_KEY=your-secret-key
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

RAWG_KEY=your-rawg-key
NEWSDATA_API_KEY=your-newsdata-key

DB_ENGINE=sqlite3
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
```

5. Apply migrations:

```powershell
python manage.py migrate
```

6. Create an admin user if needed:

```powershell
python manage.py createsuperuser
```

7. Start the server:

```powershell
python manage.py runserver
```

Open http://127.0.0.1:8000/ in your browser.

## Environment Variables

The app reads configuration from environment variables instead of hardcoding secrets. Required values include:

- `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS`
- `RAWG_KEY`
- `NEWSDATA_API_KEY`
- `DB_ENGINE`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`

Keep `.env` local and never commit it to version control.

## Production Deployment Checklist

Before deploying, complete the following:

1. Set `DEBUG = False` inside the Django settings.
2. Replace localhost-only hosts with your real production domain(s).
3. Use PostgreSQL instead of SQLite for production.
4. Generate a strong `DJANGO_SECRET_KEY`.
5. Add your domain to `DJANGO_ALLOWED_HOSTS`.
6. Configure HTTPS and set secure cookies.
7. Ensure static files are collected and served correctly.
8. Run database migrations on the production server.
9. Create a production admin account.
10. Test the game search, sorting, filtering, and pagination flows with live API keys.
11. Confirm that `.env` is not included in the deployment artifact.
12. Set up monitoring and logs for errors and API failures.
13. Test the app on a live HTTPS URL before announcing the site.

## Recommended Deployment Options

You can deploy this app on any platform that supports Django:

- Render
- Railway
- Fly.io
- Heroku
- DigitalOcean App Platform
- Azure App Service
- VPS with Nginx + Gunicorn

For a basic production setup, use:

- PostgreSQL database
- Gunicorn or similar WSGI server
- static file serving via WhiteNoise or a CDN
- environment variables for all secrets

## Production Server Commands

When deploying, the usual production flow is:

```powershell
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check
```

Then start the server with a production WSGI application, for example:

```powershell
gunicorn GamePulse.wsgi:application
```

## Testing

Run the app checks locally before deployment:

```powershell
python manage.py check
python manage.py test
```

If you change API logic or the frontend filtering behavior, test the live flows with valid keys to ensure the app still works in production.

## Notes

- The app depends on external API availability.
- API keys should be rotated if exposed in any public repository or deployment log.
- The project should be treated as a production-ready Django app only after security settings are hardened.

## License

This project is for learning and personal use unless stated otherwise by the owner.
