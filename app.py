# FreeToGame API 

import requests

from cs50 import SQL
from flask import Flask, render_template, url_for, request, abort, redirect, flash
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = '3ba1c877ad974646ab76b69b3c58d17b'
db = SQL("sqlite:///games.db")

@app.route("/import_games")
def import_games():
    key = request.args.get('key')
    if key != '3ba1c877ad974646ab76b69b3c58d17b':
        abort(403)
    try:
        url = "https://www.freetogame.com/api/games"
        rawg = "https://api.rawg.io/api/games?key=3ba1c877ad974646ab76b69b3c58d17b"
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

@app.route("/health-check")
def health_check():
    return "OK", 200

@app.route("/ads.txt")
def ads_txt():
    return send_from_directory(app.static_folder, 'ads.txt')

@app.route("/layout")
def layout():
    game = db.execute("SELECT * FROM games")
    return render_template("layout.html", game=game)

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

@app.route("/tutorials")
def tutorials():
    return render_template("tutorials.html")

@app.route("/search", methods=["GET", "POST"])
def search():
    if request.method == 'GET':
        query = request.args.get("q")
        if query:
            games = db.execute("SELECT * FROM games WHERE title LIKE ?", "%" + query + "%")
            result = db.execute("SELECT COUNT(*) AS total FROM games WHERE title LIKE ?", "%" + query + "%")
            game_count = result[0]['total']
        else:
            games = []
    return render_template("search_results.html", games=games, game_count=game_count, query=query)

@app.route("/contact")
def contactus():
    return render_template("contact.html")

@app.route("/requested_games", methods=["GET", "POST"])
def requested_games():
    if request.method == 'POST':
        game = request.form.get("game_name")
        if not game:
            return "Error 67: Must Provide Game Name"
        game_name = game.upper()
        date = datetime.now()
        add_game_db = db.execute("INSERT INTO requested_games (game_name, date) VALUES (?, ?)",
                                  game_name, date)
        return "THANK YOU FOR REQUESTING, WE WILL MAKE AN ANNOUNCEMENT ON OUR SOCIAL MEADIA PLATFORMS!"
    else:
        return render_template("contact.html")

@app.route("/report", methods=["GET", "POST"])
def report():
    if request.method == 'POST':
        game = request.form.get("report")
        if game:
            date = datetime.now()
            report_game_db = ("INSERT INTO reported_links (game, date) VALUES (?, ?)",
                               game, date)
            return "THANK YOU FOR REPORTING, WE WILL MAKE AN ANNOUNCEMENT ON OUR SOCIAL MEADIA PLATFORMS!"
    else:
        return render_template("contact.html")

if __name__ == "__main__":
    app.run(host='0.0.0.0',port='5000',debug=True)
