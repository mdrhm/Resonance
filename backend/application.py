from flask import Flask, request, session, redirect
from flask_cors import CORS
import json
import os
from supabase import create_client, Client
from spotify import get_tracks, get_albums, get_artists, get_playlists, get_track_ids, get_user_tokens
import urllib.parse
import time

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = os.getenv('APP_SECRET')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')

supabase = create_client(url, key)

app.config["SESSION_COOKIE_NAME"] = "spotify_session"
app.config["SESSION_COOKIE_SECURE"] = True
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "None"

@app.route('/ratings', methods=['GET', 'POST', 'DELETE'])
def ratings():
    match request.method:
        case 'GET':
            user_id = session.get("user_id") or request.args.get('user')
            song_ids = json.loads(request.args.get('song'))
            response = supabase.rpc("get_song_ratings", {"user_id": user_id, "song_ids": song_ids}).execute()
            return {"ratings": response.data}
        case 'POST':
            user_id = session.get("user_id") or request.args.get('user')
            song = request.args.get('song')
            rating = request.args.get('rating')
            supabase.table("rating").delete().eq("user_id", user_id).eq("spotify_id", song).execute()
            supabase.table("rating").insert({
                "user_id": user_id,
                "spotify_id": song,
                "rating": rating
            }).execute()
            response = supabase.rpc("get_song_ratings", {"user_id": user_id, "song_ids": [song]}).execute()
            return response.data[0]
        case 'DELETE':
            user_id = session.get("user_id") or request.args.get('user')
            song = request.args.get('song')
            supabase.table("rating").delete().eq("user_id", user_id).eq("spotify_id", song).execute()
            response = supabase.rpc("get_song_ratings", {"user_id": user_id, "song_ids": [song]}).execute()
            return response.data[0]

@app.route('/users/<user>/<entity_type>s', methods=['GET'])
def user_ratings(user, entity_type):
    offset = max(0, int(request.args.get('offset', 0)))
    limits = {
        "track": 50,
        "album": 20,
        "artist": 50,
        "playlist": 15
    }
    limit = max(0, min(limits[entity_type], int(request.args.get('limit', limits[entity_type]))))
    response = supabase.table("rating").select("rating, spotify_id").eq("user_id", user).like("spotify_id", f"{entity_type}%").order("rating_id", desc=True).limit(limit).offset(offset).execute()
    entities = response.data
    match entity_type:
        case 'track':
            info = {"tracks": get_tracks(entities)}
        case 'album':
            info = {"albums": get_albums(entities)}
        case 'artist':
            info = {"artists": get_artists(entities)}
        case 'playlist':
            info = {"playlists": get_playlists(entities)}
    if supabase.table("rating").select("rating, spotify_id").eq("user_id", user).like("spotify_id", f"{entity_type}%").order("rating_id", desc=True).limit(limit).offset(offset + limit).execute().data:
        info["next_page"] = f"https://resonanceapi.pythonanywhere.com/users/{user}/{entity_type}s?offset={offset + limit}&limit={limit}"
    return info

@app.route('/track-ids', methods=['GET'])
def track_from_album():
    user_id = session.get("user_id") or request.args.get('user')
    tracks = json.loads(request.args.get('tracks'))
    tracks_with_ids = []
    for i in range(0, len(tracks), 20):
        tracks_with_ids += get_track_ids(tracks[i:min(i + 20, len(tracks))])
    response = supabase.rpc("get_song_ratings", {"user_id": user_id, "song_ids": list(map(lambda t: t["track"], tracks_with_ids))}).execute()
    data = response.data
    for track in tracks_with_ids:
        track["rating"] = list(filter(lambda r: r["spotify_id"] == track["track"], data))[0]
    return {"ids": tracks_with_ids}

@app.route('/auth', methods=['GET'])
def auth():
    code = request.args.get("code")
    error = request.args.get("error")
    session_exists = session.get("refresh_token") and time.time() - session.get("timestamp") < 10
    if code:
        tokens = get_user_tokens(code)
        session["refresh_token"] = tokens.get("refresh_token")
        session["user_id"] = tokens.get("user_id")
        session['timestamp'] = time.time()
    if code or error:
        return redirect(session.get("redirect"))
    if not session_exists:
        return "Authorization failed", 401
    return "Authorization success", 200

@app.route("/login")
def login():
    session["redirect"] = request.args.get("redirect", "https://open.spotify.com/")
    params = {
        "client_id": os.getenv('SPOTIFY_CLIENT_ID'),
        "response_type": "code",
        "redirect_uri": "http://resonanceapi.pythonanywhere.com/auth",
        "scope": "user-read-private user-read-email"
    }
    auth_url = "https://accounts.spotify.com/authorize?" + urllib.parse.urlencode(params)
    return redirect(auth_url)

@app.route("/logout")
def logout():
    session.clear()
    return "Session cleared", 200

def get_refresh_token():
    return session.get('refresh_token')

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=8000)