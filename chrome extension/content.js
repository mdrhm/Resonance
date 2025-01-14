async function getUserID(){
    await document.querySelector('[data-testid="user-widget-link"]').click()
    let userID  = await document.querySelector('[role="menu"]').childNodes[1].querySelector("a").href.split("/").at(-1)
    document.querySelector('[data-testid="user-widget-link"]').click()
    return userID
}

function getSongIDs() {
    return Array.from(document.querySelectorAll('[role="row"]:not(.rated) [data-testid="internal-track-link"]')
    ).map((song) => song.href.split("/").at(-1))
}

function markRated() {
    document.querySelectorAll('[role="row"]:not(.rated):has([data-testid="internal-track-link"])').forEach((el) => el.classList.add("rated"))
}

function getRatings() {
    let songIDs = getSongIDs().join("-")
    return getUserID().then(userID => {
        if(songIDs.length === 0) {
            return {ratings: []}
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
                return data;  // Return the JSON data
            })
            .catch(error => {
                console.error('Error fetching ratings:', error);
                throw error;  // Optionally throw an error if fetch fails
            });
    })
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
        row.lastChild.innerHTML = generateRating(parseFloat(rating["avg_rating"]).toFixed(1), rating["num_of_ratings"], "4") + row.lastChild.innerHTML
        addRatingClick(row)
    }

    let unratedRows = document.querySelectorAll('[data-testid="tracklist-row"]:not(:has(.rating))')
    for (let row of unratedRows) {
        row.lastChild.innerHTML = generateRating("-", 0, null) + row.lastChild.innerHTML
        addRatingClick(row)
    }

}

function generateRating(avgRating, numberOfRatings, userRating) {
    return `<div class="rating-container">
                <div class="rating">
                    <span>★</span>
                    ${avgRating}/5 (${numberOfRatings})
                </div>
                <div class="give-rating">
                    <span>☆</span>
                    <span>☆</span>
                    <span>☆</span>
                    <span>☆</span>
                    <span>☆</span>
                </div>
           </div>`
}

function addRatingClick(row) {
    let ratings = row.querySelectorAll('.give-rating span')
    for(let i = 0; i < 5; i++){
        ratings[i].addEventListener("click", () => {
            addRating(row.querySelector('a').href.split("/").at(-1), 5 - i)
        })
    }
}

function addRating(songID, rating) {
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Access-Control-Allow-Origin', 'https://open.spotify.com');
    headers.append('Access-Control-Allow-Credentials', 'true');
    return getUserID().then(userID => {
        return fetch(`https://resonanceapi.pythonanywhere.com/ratings?user=${userID}&song=${songID}&rating=${rating}`, {
            method: 'POST',
            headers: headers
        })
            .then(response => response.json())
            .then(data => {
                return populateRatings([data]);  // Return the JSON data
            })
            .catch(error => {
                console.error('Error fetching ratings:', error);
                throw error;  // Optionally throw an error if fetch fails
            });
    })
}

// setInterval
setInterval(() => {
    console.log(getSongIDs())
    getRatings().then(data => {
        populateRatings(data.ratings)
    });
    markRated()
}, 5000)

window.addEventListener("click", () => {
    // console.log(getUserID())
    // console.log(getSongIDs())
    // markRated()
})

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

