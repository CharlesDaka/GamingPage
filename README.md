# GamePulse

GamePulse is a Django-based gaming discovery and editorial web app that combines game listings, search, filters, detailed pages, and gaming news into one user experience. It pulls content from external APIs, normalizes the responses, and renders them in a responsive frontend built with HTML, CSS, JavaScript, and Django templates.

## [View it live](https://gamevault-z6qh.onrender.com)

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

## Notes

- The app depends on external API availability.
- API keys should be rotated if exposed in any public repository or deployment log.
- The project should be treated as a production-ready Django app only after security settings are hardened.

## License

This project is for learning and personal use unless stated otherwise by the owner.
