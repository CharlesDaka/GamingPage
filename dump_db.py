import sqlite3
import json

conn = sqlite3.connect('games.db')
cursor = conn.cursor()

cursor.execute("SELECT title, platform, thumbnail, short_description, game_url, genre, publisher, developer, release_date FROM games")
rows = cursor.fetchall()

games_list = []
for row in rows:
    game = {
        "title": row[0],
        "platform": row[1],
        "thumbnail": row[2],
        "short_description": row[3],
        "game_url": row[4],
        "genre": row[5],
        "publisher": row[6],
        "developer": row[7],
        "release_date": row[8]
    }
    games_list.append(game)

with open('games.json', 'w') as f:
    json.dump(games_list, f)

conn.close()

print(f"Dumped {len(games_list)} games to games.json")