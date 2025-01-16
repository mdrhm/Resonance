let userID, nowPlayingID
async function getUserID(){
    await document.querySelector('[data-testid="user-widget-link"]').click()
    let userID  = await document.querySelector('[role="menu"]').childNodes[1].querySelector("a").href.split("/").at(-1)
    document.querySelector('[data-testid="user-widget-link"]').click()
    return userID
}

async function getNowPlayingID() {
    let nowPlayingID = ''
    if (!document.querySelector('[data-testid="NPV_Panel_OpenDiv"] [data-testid="context-link"]')) {
        await document.querySelector('[data-restore-focus-key="now_playing_view"]').click()
        nowPlayingID = document.querySelector('[data-testid="NPV_Panel_OpenDiv"] [data-testid="context-link"]').href.split("%3A").at(-1)
        document.querySelector('[data-restore-focus-key="now_playing_view"]').click()
        return nowPlayingID
    }

    return new Promise((resolve, reject) => {
        resolve(document.querySelector('[data-testid="NPV_Panel_OpenDiv"] [data-testid="context-link"]').href.split("%3A").at(-1))
    })
}

function getSongIDs() {
    let songIDs = Array.from(document.querySelectorAll('[role="row"]:not(:has(.rating-container)) [data-testid="internal-track-link"]')
    ).map((song) => song.href.split("/").at(-1))
    if (document.querySelector('[data-testid="entityTitle"]') && !document.querySelector(':has(> [data-testid="entityTitle"]) .rating-container')) {
        songIDs.push(window.location.href.split("/")[4].split("?")[0])
    }
    songIDs = songIDs.concat(Array.from(document.querySelectorAll('[data-testid="grid-container"] [data-encore-id="card"]:not(:has(.rating-container)):has(a)')).map((card) => {
        return card.querySelector("a").href.split("/").at(-1)
    }))

    const widget = document.querySelector('[data-testid="now-playing-widget"] .rating-container')
    const panel = document.querySelector('[data-testid="NPV_Panel_OpenDiv"]')

    if (!widget || widget.getAttribute('song-id') !== nowPlayingID || (panel && !panel.querySelector('.rating-container'))) {
        songIDs.push(nowPlayingID)
    }
    console.log(songIDs)
    return songIDs

}

function markRated() {
    document.querySelectorAll('[role="row"]:not(.rated):has([data-testid="internal-track-link"])').forEach((el) => el.classList.add("rated"))
}

function getRatings(songIDs) {
    songIDs = songIDs.join("-")
    if (songIDs.length === 0) {
        return new Promise((resolve, reject) => {
            resolve([])
        })
    }
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Access-Control-Allow-Origin', 'https://open.spotify.com');
    headers.append('Access-Control-Allow-Credentials', 'true');

    return fetch(`https://resonanceapi.pythonanywhere.com/ratings?user=${userID}&song=${songIDs}`, {
        method: 'GET',
        headers: headers
    })
        .then(response => response.json())  // Parse the JSON response
        .then(data => {
            return data.ratings;  // Return the JSON data
        })
        .catch(error => {
            console.error('Error fetching ratings:', error);
            throw error;  // Optionally throw an error if fetch fails
        });
}

function populateRatings(ratings) {
    populateRowRatings(ratings)
    populatePageRating(ratings)
    populateCardRatings(ratings)
    populateNowPlaying(ratings)
}

function populateRowRatings(ratings) {
    for (let rating of ratings) {
        let row = Array.from(document.querySelectorAll('[data-testid="tracklist-row"]')).filter((row) => {
            return row.querySelector('a').href.split("/").at(-1) === rating["spotify_id"]
        })[0]
        if (!row) {
            continue
        } else if (row.querySelector(".rating-container")) {
            row.querySelector(".rating-container").remove()
        }
        row.lastChild.insertBefore(createElementWithHTML(generateRating(rating)), row.lastChild.children[0]);
        addRatingClick(row.querySelector(".rating-container"))
    }
}

function populateNowPlaying(ratings) {
    function addToPanel() {
        const panelDiv = document.querySelector('[data-testid="NPV_Panel_OpenDiv"]')
        const widgetDiv = document.querySelector('[data-testid="now-playing-widget"] .rating-container')
        if (!panelDiv) {
            return
        }
        if (panelDiv.querySelector(".rating-container")) {
            panelDiv.querySelector(".rating-container").remove()
        }
        const widgetDivClone = widgetDiv.cloneNode(true)
        addRatingClick(widgetDivClone)
        panelDiv.children[0].appendChild(widgetDivClone)
    }

    const panelDiv = document.querySelector('[data-testid="NPV_Panel_OpenDiv"] .rating-container')
    const widgetDiv = document.querySelector('[data-testid="now-playing-widget"] .rating-container')
    let rating = ratings.filter((r) => {
        return nowPlayingID === r["spotify_id"]
    })[0]
    if (!rating) {
        return
    }
    if (panelDiv) {
        panelDiv.remove()
    }
    if (widgetDiv) {
        widgetDiv.remove()
    }
    let ratingDiv = createElementWithHTML(generateRating(rating))
    addRatingClick(ratingDiv)
    document.querySelector('[data-testid="now-playing-widget"]').childNodes[1].appendChild(ratingDiv)
    addToPanel()
}

function populatePageRating(ratings) {
    let pageID = window.location.href.split("/")[4].split("?")[0]
    let pageRating = ratings.filter((rating) => {return rating["spotify_id"] === pageID})[0]
    if (!pageRating) {
        return
    }
    if (document.querySelector(':has(> [data-testid="entityTitle"]) .rating-container')) {
        document.querySelector(':has(> [data-testid="entityTitle"]) .rating-container').remove()
    }
    document.querySelector(':has(> [data-testid="entityTitle"])').innerHTML += generateRating(pageRating)
    addRatingClick(document.querySelector(':has(> [data-testid="entityTitle"]) .rating-container'))
}

function populateCardRatings(ratings){
    for (rating of ratings) {
        let card = Array.from(document.querySelectorAll('[data-testid="grid-container"] [data-encore-id="card"]:not(:has(.rating-container)):has(a)')).filter((card) => {
            return card.querySelector("a").href.split("/").at(-1) === rating["spotify_id"]
        })[0]
        if (!card) {
            continue
        }
        else if (card.querySelector('[data-encore-id="cardSubtitle"] .rating-container')) {
            card.querySelector('[data-encore-id="cardSubtitle"] .rating-container').remove()
        }
        card.innerHTML += generateRating(rating)
    }
}

function generateRating(rating) {
    let avgRating = (rating["num_of_ratings"] === 0) ? "-" : parseFloat(rating["avg_rating"]).toFixed(1)
    let numberOfRatings = rating["num_of_ratings"]
    let userRating = (rating["user_rating"]["rated"]) ? rating["user_rating"]["rating"] : 0
    let songID = rating["spotify_id"]
    return `<div class="rating-container" song-id="${songID}">
                <div class="rating">
                    <span>★</span>
                    <div class = "avg-rating">${avgRating}</div>
                    <div class = "out-of">/5</div>
                    <div class = "num-of-ratings">&nbsp;(${numberOfRatings})</div>
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
           </div>`
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
            return populateRatings([data]);  // Return the JSON data
        })
        .catch(error => {
            console.error('Error fetching ratings:', error);
            throw error;  // Optionally throw an error if fetch fails
        })
}

setInterval(() => {
    getUserID().then(user => {
        getNowPlayingID().then(nPI => {
            nowPlayingID = nPI
            userID = user
            getRatings(getSongIDs()).then(data => {
                populateRatings(data)
            })
        })
        // populateNowPlaying()
    })
}, 5000)

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

function createElementWithHTML(htmlString) {
    const temp = document.createElement('div');
    temp.innerHTML = htmlString;
    return temp.firstChild;
}