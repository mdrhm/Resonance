let userID

async function getUserID(){
    await document.querySelector('[data-testid="user-widget-link"]').click()
    let userID  = await document.querySelector('[role="menu"]').childNodes[1].querySelector("a").href.split("/").at(-1)
    document.querySelector('[data-testid="user-widget-link"]').click()
    return userID
}

function getSongIDs() {
    return Array.from(document.querySelectorAll('[role="row"]:not(:has(.rating-container)) [data-testid="internal-track-link"]')
    ).map((song) => song.href.split("/").at(-1))
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
    for (let rating of ratings) {
        let row = Array.from(document.querySelectorAll('[data-testid="tracklist-row"]')).filter((row) => {
            return row.querySelector('a').href.split("/").at(-1) === rating["spotify_id"]
        })[0]
        if(!row) {
            continue
        }
        else if (row.querySelector(".rating-container")) {
            row.querySelector(".rating-container").remove()
        }
        row.lastChild.innerHTML = generateRating(rating) + row.lastChild.innerHTML
        addRatingClick(row.querySelector(".rating-container"))
    }
}

async function populateNowPlaying(){
    const panelDiv = document.querySelector('[data-testid="NPV_Panel_OpenDiv"] .rating-container')
    const widgetDiv = document.querySelector('[data-testid="now-playing-widget"] .rating-container')

    if (panelDiv && widgetDiv) {
        return
    }

    let nowPlayingID = ''
    if (!document.querySelector('[data-testid="NPV_Panel_OpenDiv"] [data-testid="context-link"]')) {
        await document.querySelector('[data-restore-focus-key="now_playing_view"]').click()
        nowPlayingID = document.querySelector('[data-testid="NPV_Panel_OpenDiv"] [data-testid="context-link"]').href.split("%3A").at(-1)
        document.querySelector('[data-restore-focus-key="now_playing_view"]').click()
    }
    else {
        nowPlayingID = document.querySelector('[data-testid="NPV_Panel_OpenDiv"] [data-testid="context-link"]').href.split("%3A").at(-1)
    }
    getRatings([nowPlayingID]).then(data => {
        if (panelDiv) {
            panelDiv.remove()
        }
        else if (widgetDiv) {
            widgetDiv.remove()
        }
        let rating = data[0]
        let ratingDiv = generateRating(rating)
        if (document.querySelector('[data-testid="NPV_Panel_OpenDiv"] > div')) {
            document.querySelector('[data-testid="NPV_Panel_OpenDiv"] > div').innerHTML += ratingDiv
        }
        document.querySelector('[data-testid="now-playing-widget"]').childNodes[1].innerHTML += ratingDiv
    })
}

function populatePageRating(){
    if (document.querySelector(':has(> [data-testid="entityTitle"]) .rating-container')){
        return
    }
    let pageID = window.location.href.split("/")[4].split("?")[0]
    getRatings([pageID]).then(data => {
        let pageRating = data[0]
        document.querySelector(':has(> [data-testid="entityTitle"])').innerHTML += generateRating(pageRating)
        addRatingClick(document.querySelector(':has(> [data-testid="entityTitle"]) .rating-container'))
    })
}

function generateRating(rating) {
    let avgRating = (rating["num_of_ratings"] === 0) ? "-" : parseFloat(rating["avg_rating"]).toFixed(1)
    let numberOfRatings = rating["num_of_ratings"]
    let userRating = (rating["user_rating"]["rated"]) ? rating["user_rating"]["rating"] : 0
    let songID = rating["spotify_id"]
    return `<div class="rating-container" song-id="${songID}">
                <div class="rating">
                    <span>★</span>
                    ${avgRating}/5 (${numberOfRatings})
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
        userID = user
        getRatings(getSongIDs()).then(data => {
            populateRatings(data)
        })
        populatePageRating()
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

