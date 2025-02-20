import os
import requests
import base64
from dotenv import load_dotenv
from multiprocessing import Pool

load_dotenv()

def get_access_token():
    client_id = os.getenv('SPOTIFY_CLIENT_ID')
    client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')

    client_credentials = f"{client_id}:{client_secret}"
    base64_credentials = base64.b64encode(client_credentials.encode()).decode()

    token_url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": f"Basic {base64_credentials}"
    }
    data = {
        "grant_type": "client_credentials"
    }

    response = requests.post(token_url, headers=headers, data=data)
    response_data = response.json()

    # Extract the access token
    return response_data['access_token']

def get_tracks(ids):
    def ms_to_min_sec(ms):
        total_seconds = ms / 1000

        minutes = int(total_seconds // 60)
        seconds = int(total_seconds % 60)

        return f"{minutes:01}:{seconds:02}"
    def clean_up_data(track):
        return {
            "url": track["external_urls"]["spotify"],
            "name": track["name"],
            "artists": list(map(lambda artist: {"name": artist["name"], "url": artist["external_urls"]["spotify"]}, track["artists"])),
            "artwork": track["album"]["images"][0]["url"],
            "album": {
                "name": track["album"]["name"],
                "url": track["album"]["external_urls"]["spotify"]
            },
            "length": ms_to_min_sec(track["duration_ms"]),
            "explicit": str(track["explicit"]).lower(),
            "rating": list(filter(lambda id: id["spotify_id"].split(":")[1] == track["id"], ids))[0]["rating"]
        }

    if not ids:
        return []

    search_url = "https://api.spotify.com/v1/tracks"
    params = {
        "ids": ",".join(list(map(lambda e: e["spotify_id"].split(":")[1], ids))),
    }
    headers = {
        "Authorization": f"Bearer {get_access_token()}"
    }

    tracks_response = requests.get(search_url, headers=headers, params=params)
    tracks = tracks_response.json()["tracks"]
    return list(map(clean_up_data, tracks))

def get_albums(ids):
    def clean_up_data(album):
        return {
            "url": album["external_urls"]["spotify"],
            "name": album["name"],
            "artists": list(map(lambda artist: {"name": artist["name"], "url": artist["external_urls"]["spotify"]}, album["artists"])),
            "artwork": album["images"][0]["url"],
            "year": album["release_date"][:4],
            "rating": list(filter(lambda id: id["spotify_id"].split(":")[1] == album["id"], ids))[0]["rating"]
        }

    if not ids:
        return []

    search_url = "https://api.spotify.com/v1/albums"
    params = {
        "ids": ",".join(list(map(lambda e: e["spotify_id"].split(":")[1], ids))),
    }
    headers = {
        "Authorization": f"Bearer {get_access_token()}"
    }

    albums_response = requests.get(search_url, headers=headers, params=params)
    albums = albums_response.json()["albums"]
    return list(map(clean_up_data, albums))

def get_artists(ids):
    def clean_up_data(artist):
        return {
            "url": artist["external_urls"]["spotify"],
            "name": artist["name"],
            "artwork": artist["images"][0]["url"],
            "rating": list(filter(lambda id: id["spotify_id"].split(":")[1] == artist["id"], ids))[0]["rating"]
        }

    if not ids:
        return []

    search_url = "https://api.spotify.com/v1/artists"
    params = {
        "ids": ",".join(list(map(lambda e: e["spotify_id"].split(":")[1], ids))),
    }
    headers = {
        "Authorization": f"Bearer {get_access_token()}"
    }

    artists_response = requests.get(search_url, headers=headers, params=params)
    artists = artists_response.json()["artists"]
    return list(map(clean_up_data, artists))

def get_playlist(id):
    def clean_up_data(playlist):
        return {
            "url": playlist["external_urls"]["spotify"],
            "name": playlist["name"],
            "artwork": playlist["images"][0]["url"],
            "owner": {
                "name": playlist["owner"]["display_name"],
                "url": playlist["owner"]["external_urls"]["spotify"]
            },
            "rating": id["rating"]
        }

    search_url = "https://api.spotify.com/v1/playlists/" + str(id["spotify_id"].split(":")[1])
    headers = {
        "Authorization": f"Bearer {get_access_token()}"
    }

    playlist_response = requests.get(search_url, headers=headers)
    playlist = playlist_response.json()
    if playlist.get("error"):
        return None
    return clean_up_data(playlist)

def get_playlists(ids):
    with (Pool(processes=4) as P):
        return list(filter(lambda x: bool(x), list(P.map(get_playlist, ids))))


def get_track_ids(tracks):
    search_url = "https://api.spotify.com/v1/albums"
    params = {
        "ids": ",".join(list(map(lambda track: track["album"], tracks)))
    }
    headers = {
        "Authorization": f"Bearer {get_access_token()}"
    }
    albums_response = requests.get(search_url, headers=headers, params=params)
    albums = albums_response.json()
    if albums.get('error'):
        return albums
    for track in tracks:
        album_for_track = list(filter(lambda album: album["id"] == track["album"], albums["albums"]))[0]
        track["track"] = "track:" + list(filter(lambda x: x["name"] == track["name"], album_for_track["tracks"]["items"]))[0]["id"]
    return tracks