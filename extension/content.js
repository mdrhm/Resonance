let userID, nowPlayingID
let nowPlayingInfo = {}

function addLogo() {
    const logoContainer = document.querySelector('[data-testid="global-nav-bar"] div')
    if (logoContainer.children.length > 1) {
        return
    }
    const plus = document.createElement('div');
    plus.innerHTML = '+'
    const resonanceLogo = logoContainer.children[0].cloneNode(true)
    resonanceLogo.innerHTML = '<img src="https://resonanceapi.pythonanywhere.com/images/logo.svg">'
    logoContainer.appendChild(plus)
    logoContainer.appendChild(resonanceLogo)
}
async function getUserID(){
    let userID = Array.from(document.querySelectorAll('[data-encore-id="listRow"]')).filter((row) => {return row.getAttribute('aria-labelledby').includes('user')}).map((row) => {return row.getAttribute('aria-labelledby').split(':').at(2)})[0]
    if (userID) {
        return userID
    }
    if (!document.querySelector('[data-testid="user-widget-link"]')){
        return null
    }
    const menu = document.querySelector('[role="menu"]')
    if(!menu) {
        await document.querySelector('[data-testid="user-widget-link"]').click()
    }
    userID  = await document.querySelector('[role="menu"]').childNodes[1].querySelector("a").href.split("/").at(-1)
    if(!menu) {
        document.querySelector('[data-testid="user-widget-link"]').click()
    }
    return userID
}

async function getTrackIDs(tracks){
    console.log(tracks)
    tracks = tracks.map((track) => {return {"album": track["album"], "name": encodeURIComponent(track["name"])}})
    console.log(tracks)
    const response = await fetch(`https://resonanceapi.pythonanywhere.com/track-ids?tracks=${JSON.stringify(tracks)}`);
    const data = await response.json();
    return data["ids"]
}
async function getNowPlayingID() {
    if (!document.querySelector('[data-testid="user-widget-link"]')) {
        return
    }
    if (document.querySelector('[data-testid="NPV_Panel_OpenDiv"] [data-testid="context-link"]')) {
        return new Promise((resolve, reject) => {
            resolve('track:' + document.querySelector('[data-testid="NPV_Panel_OpenDiv"] [data-testid="context-link"]').href.split("%3A").at(-1))
        })
    }

    let nowPlayingTrack = document.querySelector('[data-testid="now-playing-widget"] a')
    if (!nowPlayingTrack) {
        return
    }
    if (!nowPlayingTrack.href.includes('album')) {
        document.querySelector('[data-testid="NPV_Panel_OpenDiv"] .rating-container')?.remove()
        document.querySelector('[data-testid="now-playing-widget"] .rating-container')?.remove()
        return
    }
    if (nowPlayingInfo["name"] === nowPlayingTrack.text && nowPlayingInfo["album"] === nowPlayingTrack.href.split("/").at(-1)) {
        return nowPlayingID
    }
    nowPlayingInfo = {
        name: nowPlayingTrack.text,
        album: nowPlayingTrack.href.split("/").at(-1)
    }
    const nowPlayingResponse = await getTrackIDs([nowPlayingInfo])
    return nowPlayingResponse[0]["track"]
}

async function addAnchorToTracks() {
    const tracksWithoutAnchors = document.querySelectorAll('[data-testid="tracklist-row"]:not(:has(a.btE2c3IKaOXZ4VNAb8WQ))')

    let tracks = Array.from(tracksWithoutAnchors).map(
        (song) => {
            return {
                "name": song.querySelector('.btE2c3IKaOXZ4VNAb8WQ').innerText,
                "album": song.querySelector('._TH6YAXEzJtzSxhkGSqu a').href.split("/").at(-1)
            }
        })

    if (tracks.length === 0){
        return
    }
    let trackIDs = await getTrackIDs(tracks)

    tracksWithoutAnchors.forEach( (song) => {
        let trackName = song.querySelector('.btE2c3IKaOXZ4VNAb8WQ').innerText
        let albumID = song.querySelector('._TH6YAXEzJtzSxhkGSqu a').href.split("/").at(-1)
        let trackID = trackIDs.filter((track) => {return track["name"] === trackName && track["album"] === albumID})[0]["track"]
        song.querySelector('.btE2c3IKaOXZ4VNAb8WQ').outerHTML = `<a draggable="false" class="btE2c3IKaOXZ4VNAb8WQ" href="/track/${trackID.split(":").at(-1)}" tabindex="-1"> ${song.querySelector('.btE2c3IKaOXZ4VNAb8WQ').outerHTML}</a>`
    })

    getRatings(trackIDs.map((track) => {track["track"]})).then(data => {
        populateRatings(data)
    })
}

function getSongIDs() {
    let songIDs = Array.from(document.querySelectorAll('[data-encore-id="card"]:not(:has(.rating-container)):has(a) a, [data-testid="tracklist-row"]:not(:has(.rating-container)) [data-testid="internal-track-link"], [data-testid="tracklist-row"]:not(:has(.rating-container)) a.btE2c3IKaOXZ4VNAb8WQ, [data-testid="top-result-card"]:not(:has(.rating-container)) a:has(div), .Z35BWOA10YGn5uc9YgAp:not(:has(.rating-container)) a')).map((card) => {
        return card.href.split("/").at(-2) + ':' + card.href.split("/").at(-1)
    })
    if (document.querySelector('[data-testid="entityTitle"], [data-testid="adaptiveEntityTitle"]') && !document.querySelector(':has(> [data-testid="entityTitle"], > [data-testid="adaptiveEntityTitle"]) .rating-container')) {
        songIDs.push(window.location.href.split("/")[3] + ':' + window.location.href.split("/")[4].split("?")[0])
    }

    const widget = document.querySelector('[data-testid="now-playing-widget"] .rating-container')

    if (nowPlayingID && (!widget || widget.getAttribute('song-id') !== nowPlayingID)) {
        songIDs.push(nowPlayingID)
    }
    songIDs = songIDs.map((songID) => {return songID.split("?").at(0)})
    console.log(JSON.stringify(songIDs))
    return songIDs

}

function markRated() {
    document.querySelectorAll('[role="row"]:not(.rated):has([data-testid="internal-track-link"])').forEach((el) => el.classList.add("rated"))
}

function getRatings(songIDs) {
    if (songIDs.length === 0) {
        return new Promise((resolve, reject) => {
            resolve([])
        })
    }

    songIDs = JSON.stringify(songIDs)
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Access-Control-Allow-Origin', 'https://open.spotify.com');
    headers.append('Access-Control-Allow-Credentials', 'true');

    return fetch(`https://resonanceapi.pythonanywhere.com/ratings?${(userID) ? 'user=' + userID + '&' : ''}song=${songIDs}`, {
        method: 'GET',
        headers: headers
    })
        .then(response => response.json())
        .then(data => {
            return data.ratings;
        })
        .catch(error => {
            console.error('Error fetching ratings:', error);
            throw error;
        });
}

function populateRatings(ratings) {
    populateRowRatings(ratings)
    populatePageRating(ratings)
    populateCardRatings(ratings)
    populateNowPlaying(ratings)
    populateHomePageCards(ratings)
}

function populateRowRatings(ratings) {
    for (let rating of ratings) {
        let row = Array.from(document.querySelectorAll('[data-testid="tracklist-row"]:has([data-testid="internal-track-link"]), [data-testid="tracklist-row"]:has(a.btE2c3IKaOXZ4VNAb8WQ)')).filter((row) => {
            return row.querySelector('a').href.split("/").at(-2) + ':' + row.querySelector('a').href.split("/").at(-1) === rating["spotify_id"]
        })[0]
        if (!row) {
            continue
        } else if (row.querySelector(".rating-container")) {
            row.querySelector(".rating-container").remove()
        }
        row.lastChild.insertBefore(generateRating(rating), row.lastChild.children[0]);
    }
}

function populateNowPlaying(ratings) {
    function addToPanel() {
        const panelDiv = document.querySelector('[data-testid="NPV_Panel_OpenDiv"]')
        const widgetDiv = document.querySelector('[data-testid="now-playing-widget"] .rating-container')
        const panelRating = document.querySelector('[data-testid="NPV_Panel_OpenDiv"] .rating-container')
        if (!panelDiv || (panelRating && panelRating.getAttribute('song-id') === nowPlayingID)) {
            return
        }
        if (panelRating) {
            panelRating.remove()
        }
        const widgetDivClone = widgetDiv.cloneNode(true)
        addRatingClick(widgetDivClone)
        panelDiv.children[0].appendChild(widgetDivClone)
    }

    function addToFullScreen() {
        const fullScreenTrack = document.querySelector('.npv-track')
        const fullScreenRating = document.querySelector('.npv-track .rating-container')

        if (!fullScreenTrack || (fullScreenRating && fullScreenRating.getAttribute('song-id') === nowPlayingID)) {
            return
        }
        if (fullScreenRating) {
            fullScreenRating.remove()
        }
        const widgetDiv = document.querySelector('[data-testid="now-playing-widget"] .rating-container')
        const widgetDivClone = widgetDiv.cloneNode(true)
        addRatingClick(widgetDivClone)
        fullScreenTrack.appendChild(widgetDivClone)
    }

    const panelDiv = document.querySelector('[data-testid="NPV_Panel_OpenDiv"] .rating-container')
    const widgetDiv = document.querySelector('[data-testid="now-playing-widget"] .rating-container')
    let rating = ratings.filter((r) => {
        return nowPlayingID === r["spotify_id"]
    })[0]
    if (!rating) {
        addToPanel()
        addToFullScreen()
        return
    }
    if (panelDiv) {
        panelDiv.remove()
    }
    if (widgetDiv) {
        widgetDiv.remove()
    }
    let ratingDiv = generateRating(rating)
    document.querySelector('[data-testid="now-playing-widget"]').childNodes[1].appendChild(ratingDiv)
    addToPanel()
    addToFullScreen()
}

function populatePageRating(ratings) {
    if (window.location.href.split("/").length <= 4) {
        return
    }
    let pageID = window.location.href.split("/")[3] + ':' + window.location.href.split("/")[4].split("?")[0]
    let pageRating = ratings.filter((rating) => {return rating["spotify_id"] === pageID})[0]
    if (!pageRating) {
        return
    }
    if (document.querySelector(':has(> [data-testid="entityTitle"], > [data-testid="adaptiveEntityTitle"]) .rating-container')) {
        document.querySelector(':has(> [data-testid="entityTitle"], > [data-testid="adaptiveEntityTitle"]) .rating-container').remove()
    }
    const rating =  generateRating(pageRating)
    if (pageRating["spotify_id"] === 'user:' + userID) {
        rating.classList.add("self")
        rating.querySelector(".ratings").remove()
    }
    document.querySelector(':has(> [data-testid="entityTitle"], > [data-testid="adaptiveEntityTitle"])').appendChild(rating)
}

function populateCardRatings(ratings){
    for (rating of ratings) {
        Array.from(document.querySelectorAll('[data-encore-id="card"]:has(a), [data-testid="top-result-card"] .mXNT9H2GU7lDW4cGx0q1')).filter((card) => {
            return card.querySelector("a").href.split("/").at(-2) + ':' + card.querySelector("a").href.split("/").at(-1) === rating["spotify_id"]
        }).forEach((card) => {
            if (card.querySelector('.rating-container')) {
                card.querySelector('.rating-container').remove()
            }
            card.appendChild(generateRating(rating))
        })
    }
}

function populateHomePageCards(ratings){
    for (let rating of ratings) {
        Array.from(document.querySelectorAll('.Z35BWOA10YGn5uc9YgAp')).filter((card) => {return card.querySelector('a').href.split("/").at(-2) + ":" + card.querySelector('a').href.split("/").at(-1) === rating["spotify_id"]}).forEach((card) => {
            if (card.querySelector('.rating-container')) {
                card.querySelector('.rating-container').remove()
            }
            card.querySelector('.TbrIq3NG2VYFoAUMSmp9').appendChild(generateRating(rating))
        })
    }
}

function generateRating(rating) {
    let avgRating = (rating["num_of_ratings"] === 0) ? "-" : parseFloat(rating["avg_rating"]).toFixed(1)
    let numberOfRatings = rating["num_of_ratings"]
    let userRating = (rating["user_rating"]["rated"]) ? rating["user_rating"]["rating"] : 0
    let songID = rating["spotify_id"]
    const ratingDiv = document.createElement('div');
    ratingDiv.innerHTML = `<div class="rating-container" song-id="${songID}">
                <div class="rating">
                    <span>★</span>
                    <div class = "avg-rating">${avgRating}</div>
                    <div class = "out-of">/5</div>
                    <div class = "num-of-ratings">&nbsp;(${formatNumberOfRatings(numberOfRatings)})</div>
                </div>
                <div class = "ratings">
                    <div class="give-rating">
                        <span>☆</span>
                        <span>☆</span>
                        <span>☆</span>
                        <span>☆</span>
                        <span>☆</span>
                    </div>
                    <div class="existing-rating">
                        <span>${(userRating >= 5) ? `★` : `☆`}</span>
                        <span>${(userRating >= 4) ? `★` : `☆`}</span>
                        <span>${(userRating >= 3) ? `★` : `☆`}</span>
                        <span>${(userRating >= 2) ? `★` : `☆`}</span>
                        <span>${(userRating >= 1) ? `★` : `☆`}</span>
                    </div>
                </div>
           </div>`;
    addRatingClick(ratingDiv.firstChild)
    return ratingDiv.firstChild;
}

function addRatingClick(container) {
    let ratings = container.querySelectorAll('.give-rating span')
    let songID = container.getAttribute('song-id')
    for (let i = 0; i < 5; i++) {
        ratings[i].addEventListener("click", () => {
            if (!userID) {
                document.querySelector('[data-testid="login-button"]').click()
            } else if (Array.from(container.querySelectorAll('.existing-rating span')).filter((star) => {
                return star.innerHTML === '★'
            }).length === 5 - i) {
                updateRating('DELETE', songID, 5 - i)
            } else {
                updateRating('POST', songID, 5 - i)
            }
        })
    }
}

function formatNumberOfRatings(numOfRatings) {
    if (numOfRatings < 1000) {
        return numOfRatings
    }
    numOfRatings = parseInt(numOfRatings)
    const abvs = ['K', 'M', 'B']
    const commas = parseInt(Math.log(numOfRatings) / Math.log(1000))

    return (numOfRatings/(Math.pow(1000, commas))).toFixed(1) + abvs[commas - 1]
}

function updateRating(method, songID, rating) {
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Access-Control-Allow-Origin', 'https://open.spotify.com');
    headers.append('Access-Control-Allow-Credentials', 'true');
    return fetch(`https://resonanceapi.pythonanywhere.com/ratings?user=${userID}&song=${songID}&rating=${rating}`, {
        method: method,
        headers: headers
    })
        .then(response => response.json())
        .then(data => {
            return populateRatings([data]);
        })
        .catch(error => {
            console.error('Error fetching ratings:', error);
            throw error;
        })
}


setInterval(() => {
    addLogo()
    addAnchorToTracks()
    getUserID().then(user => {
        getNowPlayingID().then(nPI => {
            nowPlayingID = nPI
            userID = user
            getRatings(getSongIDs()).then(data => {
                populateRatings(data)
            })
        })
    })
}, 1000)


// MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
//
// var observer = new MutationObserver(function(mutations, observer) {
//     console.log(getUserID())
//     console.log(getSongIDs())
//     markRated()
// });
//
// observer.observe(document, {
//     subtree: true,
//     attributes: true
// });