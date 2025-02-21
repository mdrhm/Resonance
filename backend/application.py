from flask import Flask, request
from flask_cors import CORS
import json
import os
from supabase import create_client, Client
from spotify import get_tracks, get_albums, get_artists, get_playlists, get_track_ids

app = Flask(__name__)
CORS(app)

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_KEY')

supabase = create_client(url, key)

@app.route('/ratings', methods=['GET', 'POST', 'DELETE'])
def ratings():
    match request.method:
        case 'GET':
            user_id = request.args.get('user')
            song_ids = json.loads(request.args.get('song'))
            response = supabase.rpc("get_song_ratings", {"user_id": user_id, "song_ids": song_ids}).execute()
            return {"ratings": response.data}
        case 'POST':
            user_id = request.args.get('user')
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
            user_id = request.args.get('user')
            song = request.args.get('song')
            supabase.table("rating").delete().eq("user_id", user_id).eq("spotify_id", song).execute()
            response = supabase.rpc("get_song_ratings", {"user_id": user_id, "song_ids": [song]}).execute()
            return response.data[0]

@app.route('/users/<user>/<entity_type>s', methods=['GET'])
def user_ratings(user, entity_type):
    offset = 0 if not request.args.get('offset') else max(0, int(request.args.get('offset')))
    limit = min(20, int(request.args.get('limit', 50))) if entity_type == 'album' else int(request.args.get('limit', 50))
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
    user_id = request.args.get('user')
    tracks = json.loads(request.args.get('tracks'))
    tracks_with_ids = []
    for i in range(0, len(tracks), 20):
        tracks_with_ids += get_track_ids(tracks[i:min(i + 20, len(tracks))])
    response = supabase.rpc("get_song_ratings", {"user_id": user_id, "song_ids": list(map(lambda t: t["track"], tracks_with_ids))}).execute()
    data = response.data
    for track in tracks_with_ids:
        track["rating"] = list(filter(lambda r: r["spotify_id"] == track["track"], data))[0]
    return {"ids": tracks_with_ids}

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=8000)