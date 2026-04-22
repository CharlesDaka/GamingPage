# FreeToGame API 

import requests
import sys
import os

from cs50 import SQL
from flask import Flask, render_template, url_for, request, abort, redirect, flash
from datetime import datetime
from dotenv import load_dotenv

load_dotenv

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')
rawg_key = os.environ.get('ADMIN_SECRET_KEY')

# Connect my Supabase online database and my local database
# --- supabase db ---
remote_db = SQL(os.environ.get('SUPABASE_URL'))

# --- local db (for displaying games) ---
db = SQL('sqlite:///games.db')

# import games from an API to my database
@app.route("/games/import_games")
def import_games():
    # admin key
    admin = request.form.get('admin_key')
    if admin != rawg_key:
        abort(403)
    # key for RAWG API
    key = request.args.get('key')
    if key != rawg_key:
        abort(403)
    try:
        url = "https://www.freetogame.com/api/games"
        rawg = os.getenv('RAWG_URL')
        response = requests.get(url, timeout=10)
        # this triggers an exception if an API returns an error
        response.raise_for_status()

        games = response.json() # converts raw text file into a python list
        for game in games.get('results', []):
            existing = db.execute("SELECT * FROM games WHERE title = ?", game['name']
            )
            if len(existing) == 0:
                platform = (", ").join([p['platform']['name'] for p in game.get('platforms', [])])
                genre = game.get('genres', [{}])[0].get('name', 'unknown')
                db.execute("INSERT INTO games (title, platform, thumbnail, game_url, genre, release_date, slug, game_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                            game['name'], platform, game['background_image'], game.get('metacritic_url', 'No Url Available'), genre,
                            game['released'], game['slug'], game['id']
                )
        return "SUCCESSFULLY IMPORTED GAMES INTO YOUR DATABASE!"

    except requests.exceptions.RequestException as e:
        # this catches API/Internet Errors
        print(f"API Error: {e}")
        return "Sorry, we couldn't reach the game server right now, Please try again later."
    except requests.exceptions.ConnectionError as e:
        print(f"Connection Error: {e}")
        return "Connection error Please try refreshing the page"
    except requests.exceptions.ReadTimeout as e:
        print(f"Server Error: {e}")
        return "Server Timeout, Please try again later."
    except Exception as e:
        # This catches everything else (like SQL errors)
        print(f"General Error: {e}")
        return "An unexpected error occured while updating the database."

# check for errors during deploying
@app.route("/health-check")
def health_check():
    return "OK", 200

# ads route for google adsense
@app.route("/ads.txt")
def ads_txt():
    return send_from_directory(app.static_folder, 'ads.txt')

@app.route("/layout")
def layout():
    game = db.execute("SELECT * FROM games")
    return render_template("layout.html", game=game)

# homepage of GameVault Web Application
@app.route("/")
def homepage():
    # Get the current page from the URL (default to page 1) 
    page = request.args.get('page', 1, type=int)
    per_page  = 20
    offset = (page - 1) * per_page
    # Fetch only 20 games from the current page for PC
    games = db.execute("SELECT * FROM games WHERE platform = 'PC (Windows)' LIMIT ? OFFSET ?", per_page, offset)
    # calculate if there's a next page (total games / per_page)
    total_games = db.execute("SELECT COUNT(*) as count FROM games")[0]['count']
    has_next = offset + per_page < total_games
    return render_template('index.html', games=games, has_next=has_next, page=page)

# gaming tutorials from my youtube channel 'Youngcharlie Tutorials'
@app.route("/tutorials")
def tutorials():
    return render_template("tutorials.html")

# let users search for games (game title)
@app.route("/search", methods=["GET", "POST"])
def search():
    if request.method == 'GET':
        # get users input
        query = request.args.get("q")
        if query:
            # check if the game exits in the database
            games = db.execute("SELECT * FROM games WHERE title LIKE ?", "%" + query + "%")
            # count how many games were found
            result = db.execute("SELECT COUNT(*) AS total FROM games WHERE title LIKE ?", "%" + query + "%")
            game_count = result[0]['total']
        else:
            # if the user hasn't provided query yet, set the list to empty
            games = []
    return render_template("search_results.html", games=games, game_count=game_count, query=query)

# contact us section
@app.route("/contact")
def contactus():
    return render_template("contact.html")

# let users request for games that aren't on my database
@app.route("/requested_games", methods=["GET", "POST"])
def requested_games():
    if request.method == 'POST':
        # get user's input
        game = request.form.get("game_name")
        # if no input was provided return error
        if not game:
            return "Error 67: Must Provide Game Name"
        # convert user input into uppercase
        game_name = game.upper()
        # insert user input and datetime into database
        response = remote_db.execute("INSERT INTO requested_games (game) VALUES (?)", game_name)
        return "SUCCEFULLY ADDED THE GAME TO THE WAITLIST, WE WILL ANNOUNCE ON OUR SOCIAL MEDIA PLATFORMS!"
    else:
        return render_template("contact.html")

# let users report games with broken links (game title)
@app.route("/report", methods=["GET", "POST"])
def report():
    if request.method == 'POST':
        # get user's input
        game = request.form.get("report")
        # if no input, return error
        if not game:
            return "ERROR 67: Must Provide Game"
        # convert user input to uppercase
        game_name = game.upper()
        # insert reported game(s) into database
        response = remote_db.execute("INSERT INTO reported_games (game) VALUES (?)", game_name)
        return "THANK YOU FOR REPORTING, WE WILL MAKE AN ANNOUNCEMENT ON OUR SOCIAL MEADIA PLATFORMS!"
    else:
        return render_template("contact.html")

if __name__ == "__main__":
    app.run(host='0.0.0.0',port='5000',debug=True)

# Code by Charles Daka