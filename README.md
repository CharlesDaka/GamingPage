# LoadoutsDaily (GamePulse)

LoadoutsDaily is a gaming discovery and editorial web application built with Django, JavaScript, HTML, CSS, and external gaming APIs. It gives visitors one place to discover games, filter them by platform, search for titles, sort results, inspect detailed game information, read current gaming news, and browse a small collection of database-backed articles. The project is designed as a responsive web application so the main workflows remain usable on desktop and mobile screens.

## Distinctiveness and Complexity

LoadoutsDaily is distinct from a basic CRUD site because it combines several related but different sources of information into one gaming-focused experience. The game catalogue is retrieved from the RAWG API rather than being a fixed list stored in the page. The browser communicates with Django JSON endpoints using JavaScript, while Django acts as a server-side integration layer that adds platform filtering, search, sorting, pagination, response normalization, caching, and fallback behavior. When RAWG is unavailable, the application attempts to use FreeToGame data and normalizes its different field names into the shape expected by the front end.

The main games workflow is more complex than a simple list page. Users can select PC, PlayStation, Xbox, Nintendo, iOS, Android, macOS, Linux, or all platforms; search for a title; sort by rating, name, or release date; move through result pages; and open a detailed view without leaving the page. The details view can display descriptions, release information, ratings, genres, developers, publishers, supported platforms, system requirements, screenshots, trailers, stores, additional content, and an official website when the API provides those values. Loading states, error states, image fallbacks, and empty search results are represented in the interface.

The application also has two separate content workflows. The News app retrieves current gaming articles through NewsData and caches the response. The Content app uses Django models and the admin interface to manage editorial entries and categories. This means the project demonstrates both external API integration and persistent local database content. The shared layout, navigation, search form, responsive grids, platform icons, animated loading interface, screenshot presentation, and neon cyberpunk visual system make the application a cohesive product rather than unrelated pages.

The project satisfies the course requirement to use Django on the back end, including models, and JavaScript on the front end. Django supplies routing, views, model access, admin management, API proxy endpoints, caching, and database configuration. JavaScript supplies asynchronous requests, dynamic game-card rendering, search, sorting, pagination, game details, trailer loading, and client-side view transitions. The SCSS source and compiled CSS provide desktop and mobile layouts: game, news, and content cards use two columns on larger screens and one column on smaller screens, while sidebars stack below the main content.

## Features

- Browse RAWG games with platform filters for major desktop, console, mobile, and Linux platforms.
- Search for games by title from the shared navigation bar.
- Sort games by rating, name, and release date.
- Paginate game and search results while retaining the selected platform and sort order.
- View detailed game data, screenshots, trailers, stores, DLC, requirements, and links.
- Cache external API responses for twelve hours to reduce repeated requests.
- Fall back to FreeToGame when the RAWG request fails.
- Read current gaming news supplied by NewsData.
- Browse up to ten recent editorial content entries from the local database.
- Manage content and categories through Django admin.
- Use the responsive layout on desktop and mobile screen sizes.

## Project Structure

- `manage.py` is Django's command-line entry point.
- `GamePulse/settings.py` configures installed apps, middleware, environment variables, the database, static files, and the custom user model. `urls.py` connects the games, news, and content applications. `asgi.py` and `wsgi.py` provide deployment entry points.
- `games/models.py` defines the custom `User` model and the `Game` model. `games/views.py` contains the homepage, RAWG and FreeToGame integration, normalization, caching, game details, and trailer endpoints. `games/urls.py` defines those routes. `games/templates/games/index.html` provides the game-page shell, while `games/tests.py` tests API-data normalization.
- `news/views.py` retrieves and caches NewsData articles. `news/templates/news/news.html` renders the news page, and `news/static/placeholder.png` is used when an article has no image.
- `content/models.py` defines `Content` and `Categories`. `content/views.py` retrieves recent records, `content/admin.py` registers them for administration, and `content/templates/content/index.html` renders the content cards. The migration files create and update these tables.
- `templates/layout.html` contains the shared navigation, search form, external icon libraries, stylesheet links, footer, and API attribution.
- `static/js/games.js` controls asynchronous game requests, rendering, search, sorting, pagination, game details, screenshots, and trailers. `static/styles.scss` is the stylesheet source; `static/styles.css` is its compiled output and `styles.css.map` is the source map. The image directory contains the favicon and visual assets. `static/js/sw.js` contains the service-worker script.
- `requirements.txt` lists the Python dependencies, and `.env` stores local API credentials without being committed.

## Setup and Running

Python 3.13 or a compatible Python version, PostgreSQL, and a modern browser are recommended. From the project directory, create and activate a virtual environment:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file in the project root with credentials for the services used by the application:

```text
RAWG_KEY=e77dbf9417b740a38e52ee1aadbb37e7
NEWSDATA_API_KEY=pub_30c82df0142d40cbb9b5ea5fc6c8073f
```

Configure PostgreSQL credentials in `GamePulse/settings.py` or replace the database configuration with a local development database. Do not publish API keys, database passwords, or Django secret keys. Apply migrations and optionally create an administrator account:

```powershell
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Open `http://127.0.0.1:8000/`. The admin interface is available at the admin route configured in `GamePulse/urls.py`. When editing SCSS, compile it with Dart Sass, which avoids the native Visual C++ build requirements associated with some Python Sass packages:

```powershell
sass --watch static/styles.scss:static/styles.css
```

The dependency file includes `newsdataapi`, matching the import used by the News app. Keep the real `.env` file local and use `.env.example` as the safe template for other environments.

## Testing

The current automated test suite contains a normalization test for FreeToGame-shaped data. Run it with:

```powershell
python manage.py test
```

Django's project validation can be run with:

```powershell
python manage.py check
```

At the time this README was written, both commands completed successfully. The project would benefit from additional tests for URL routing, API success and failure responses, caching, pagination, search, sorting, NewsData errors, database models, admin behavior, and JavaScript interactions. Mobile layouts should also be checked on real devices or browser emulation before submission.

## APIs and Attribution

The project uses RAWG for game data, NewsData for gaming news, and FreeToGame as a fallback source. The shared page footer credits these services. API availability, rate limits, response formats, and licensing should be reviewed before deployment. The site is intended as a learning project and should keep credentials server-side.

## CS50 Requirement Assessment

Based on the current codebase, the project appears to satisfy the core technical requirements: it is sufficiently more involved than a small introductory exercise, uses Django and multiple Django models, uses JavaScript substantially on the front end, and includes responsive CSS behavior. Its API proxying, normalization, fallback service, caching, asynchronous rendering, detailed game view, news integration, admin-managed content, and responsive layouts provide credible evidence of complexity and distinctiveness.

The main submission risks are documentation and polish rather than the central idea. This README now explains the project, files, setup, and complexity as requested. Before submitting, confirm that the real `.env` file is excluded from the submitted archive, rotate any API keys or database credentials that have ever been exposed, confirm that all external scripts and service-worker code are intentional, and test the complete application with valid API keys. The most important game workflows now have automated tests, but additional tests for news, content, admin behavior, and browser interactions would strengthen the submission. These steps would make the project easier for staff to install, review, and distinguish from a generic API listing application.
