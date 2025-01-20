from flask import Flask, request, render_template, session, redirect, Response
from flask_cors import CORS
import json
import os
import hashlib
from queries import SELECT_FROM_WHERE, INSERT_INTO, DELETE_FROM_WHERE, UPDATE_SET_WHERE

app = Flask(__name__)
CORS(app)
app.config["SESSION_PERMANENT"] = False
app.secret_key = os.urandom(24)

@app.route('/ratings', methods=['GET', 'POST', 'DELETE', 'PUT'])
def ratings():
    match request.method:
        case 'GET':
            user_id = request.args.get('user')
            songs_arr = json.loads(request.args.get('song'))
            songs = "(" + ", ".join(map(lambda x: "'" + x + "'", songs_arr)) + ")"
            ratings = SELECT_FROM_WHERE("spotify_id, AVG(rating) as avg_rating, COUNT(rating) as num_of_ratings", "rating", "spotify_id IN " + songs + " GROUP BY spotify_id")
            songs_with_ratings = list(map(lambda x: x["spotify_id"], ratings))
            songs_without_ratings = list(filter(lambda x: x not in songs_with_ratings, songs_arr))
            for song in songs_without_ratings:
                ratings += [{"spotify_id": song, "rating": "-", "num_of_ratings": 0}]
            for index, rating in enumerate(ratings):
                user_rating = SELECT_FROM_WHERE("rating", "rating", "user_id = '" + user_id + "' AND spotify_id = '" + rating["spotify_id"] + "'")
                ratings[index]["user_rating"] = {"rated": "false"} if not user_rating else {"rated": "true", "rating": user_rating[0]["rating"]}
            return {"ratings": ratings}
        case 'POST':
            user_id = request.args.get('user')
            song = request.args.get('song')
            rating = request.args.get('rating')
            DELETE_FROM_WHERE("rating", "user_id = '" + user_id + "' AND spotify_id = '" + song + "'")
            INSERT_INTO('rating', {"user_id": user_id, "spotify_id": song, "rating": rating})
            rating_inserted = SELECT_FROM_WHERE("spotify_id, AVG(rating) as avg_rating, COUNT(rating) as num_of_ratings", "rating", "spotify_id = '" + song + "' GROUP BY spotify_id")[0]
            rating_inserted["user_rating"] = {"rated": "true", "rating": rating}
            return rating_inserted
        case 'DELETE':
            user_id = request.args.get('user')
            song = request.args.get('song')
            DELETE_FROM_WHERE("rating", "user_id = '" + user_id + "' AND spotify_id = '" + song + "'")
            ratings = SELECT_FROM_WHERE("spotify_id, AVG(rating) as avg_rating, COUNT(rating) as num_of_ratings", "rating", "spotify_id = '" + song + "' GROUP BY spotify_id")
            rating_after_deleted = {"spotify_id": song, "rating": "-", "num_of_ratings": 0} if not ratings else  ratings[0]
            rating_after_deleted["user_rating"] = {"rated": "false"}
            return rating_after_deleted
if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=8000)