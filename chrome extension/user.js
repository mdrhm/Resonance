let isFetching = false;
let nextPageUrl = null;

function createTrackHTML(track, index) {
    const {album, artists, artwork, explicit, length, name, rating, url} = track;

    return `<div role="row" aria-rowindex="${index + 1}" aria-selected="false">
            <div data-testid="tracklist-row" class="IjYxRc5luMiDPhKhZVUH UpiE7J6vPrJIa59qxts4" draggable="true" role="presentation">
                <div class="fS0C4IgbHviZxIVGC736" role="gridcell" aria-colindex="1">
                    <div class="ucB9avGYvzsmzXUOw0S7">
                        <span class="e-9541-text encore-text-body-medium xNyTkXEncSjszLNI65Nq" data-encore-id="text">${index + 1}</span>
                    </div>
                </div>
                <div class="w46g_LQVSLE9xK399VYf" role="gridcell" aria-colindex="2">
                    <img aria-hidden="false" draggable="false" loading="eager" src="${artwork}" alt="${name}" class="mMx2LUixlnN_Fu45JpFB IqDKYprOtD_EJR1WClPv Yn2Ei5QZn19gria6LjZj" width="40" height="40">
                    <div class="_iQpvk1c9OgRAc8KRTlH">
                        <a draggable="false" class="btE2c3IKaOXZ4VNAb8WQ" href="${url}" tabindex="-1">
                            <div class="e-9541-text encore-text-body-medium encore-internal-color-text-base btE2c3IKaOXZ4VNAb8WQ standalone-ellipsis-one-line" data-encore-id="text" dir="auto">${name}</div>
                        </a>
                        ${explicit === "true" ? `
                        <span class="e-9541-text encore-text-body-medium encore-internal-color-text-subdued _7_yPy5jfb9kzk3gijq6A" data-encore-id="text">
                            <span aria-label="Explicit" class="Ps9zgW56WZaBVLo1n3cg l67ZKWaTyRadDGEcLWcE" title="Explicit">
                                <span class="SgFtsvn3upY_tG6mnt4n">E</span>
                            </span>
                        </span>` : ''}
                        <span class="e-9541-text encore-text-body-small encore-internal-color-text-subdued UudGCx16EmBkuFPllvss standalone-ellipsis-one-line" data-encore-id="text">
                            <span class="e-9541-text encore-text-body-small" data-encore-id="text">
                                ${artists.map(artist => `<a draggable="true" dir="auto" href="${artist.url}" tabindex="-1">${artist.name}</a>`).join(', ')}
                            </span>
                        </span>
                    </div>
                </div>
                <div class="_TH6YAXEzJtzSxhkGSqu" role="gridcell" aria-colindex="3">
                    <span class="e-9541-text encore-text-body-small" data-encore-id="text">
                        <a draggable="true" class="standalone-ellipsis-one-line" dir="auto" href="${album.url}" tabindex="-1">${album.name}</a>
                    </span>
                </div>
                <div class="PAqIqZXvse_3h6sDVxU0" role="gridcell" aria-colindex="4">
                    <div class="rating-container">
                        <div class="rating">
                            <span>★</span>
                            <div>${rating}</div>
                        </div>
                    </div>
                    <div class="e-9541-text encore-text-body-small encore-internal-color-text-subdued l5CmSxiQaap8rWOOpEpk" data-encore-id="text">${length}</div>
                </div>
            </div>
        </div>
    `;
}

function createAlbumHTML(album, index) {
    const {artists, artwork, name, rating, url, year} = album;

    return `
        <span role="presentation" class="cuOXad0Tk2T44Jkldvs8">
            <div class="Ih5mmxAJFDIBYVcQQrrN">
                <div class="Box__BoxComponent-sc-y4nds-0 kcRGDn Box-sc-1njtxi4-0 hscyXl aAYpzGljXQv1_zfopxaH Card" data-encore-id="card" role="group" aria-labelledby="card-title-${url}" draggable="true" data-testid="search-category-card-${index}">
                <a class="CardButton-sc-g9vf2u-0 eWZOJQ" href="${url}"></a>
                    <div id="onClickHint-${url}" style="display: none;"></div>
                    <div class="xBV4XgMq0gC5lQICFWY_">
                        <div class="GOcsybnoHYyJGQGDRuwj" style="--card-color: #B85C3D;">
                            <div>
                                <img aria-hidden="false" draggable="false" loading="lazy" src="${artwork}" data-testid="card-image" alt="${name}" class="mMx2LUixlnN_Fu45JpFB yMQTWVwLJ5bV8VGiaqU3 Yn2Ei5QZn19gria6LjZj">
                            </div>
                        </div>
                        <div class="woJQ5t2YiaJhjTv_KE7p">
                            <div class="ix_8kg3iUb9VS5SmTnBY">
                            </div>
                        </div>
                    </div>
                    <div class="Areas__InteractiveArea-sc-1tea2mc-0 Areas__MainArea-sc-1tea2mc-1 MWEhk kLALqL">
                        <div class="Areas__InteractiveArea-sc-1tea2mc-0 Areas__Column-sc-1tea2mc-2 MWEhk yMCdi">
                            <a draggable="false" class="Gi6Lr1whYBA2jutvHvjQ" href="${url}">
                                <p class="e-9541-text encore-text-body-medium CardTitle__CardText-sc-1h38un4-1 eznGBk xHz124sSHSCYHecLCTfi" data-encore-id="cardTitle" id="card-title-${url}" aria-describedby="onClickHint-${url}" title="${name}" dir="auto">
                                    <span class="CardTitle__LineClamp-sc-1h38un4-0 RBShQ">
                                        <span class="">${name}</span>
                                    </span>
                                </p>
                            </a>
                            <div class="e-9541-text encore-text-body-small encore-internal-color-text-subdued CardDetails__CardDetailText-sc-1gdonml-1 kNtRLK" data-encore-id="cardSubtitle" id="card-subtitle-${url}" dir="auto">
                                <span class="CardDetails__LineClamp-sc-1gdonml-0 sVzSB">
                                    <div class="e-9541-text encore-text-body-small encore-internal-color-text-subdued i6jA7UnVNDJFGlAgtutp JS9WYvoqyy3vUXqMt5Hv" data-encore-id="text">
                                        <time datetime="${year}">${year} • </time>
                                        <a draggable="false" dir="auto" href="${artists[0].url}">${artists[0].name}</a>
                                    </div>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="rating-container" song-id="${url}">
                        <div class="rating">
                            <span>★</span>
                            <div class="avg-rating">${rating}</div>
                        </div>
                    </div>
                </div>
            </div>
        </span>
    `;
}

function createArtistHTML(artist, index) {
    const {artwork, name, rating, url} = artist;

    return `
        <span role="presentation" class="cuOXad0Tk2T44Jkldvs8">
            <div class="Ih5mmxAJFDIBYVcQQrrN">
                <div class="Box__BoxComponent-sc-y4nds-0 kcRGDn Box-sc-1njtxi4-0 hscyXl aAYpzGljXQv1_zfopxaH Card" data-encore-id="card" role="group" aria-labelledby="card-title-${url}" draggable="true" data-testid="search-category-card-${index}">
                <a class="CardButton-sc-g9vf2u-0 eWZOJQ" href="${url}"></a>
                    <div id="onClickHint-${url}" style="display: none;"></div>
                    <div class="xBV4XgMq0gC5lQICFWY_">
                        <div class="GOcsybnoHYyJGQGDRuwj MxmW8QkHqHWtuhO589PV" style="--card-color: #402828;">
                            <div>
                                <img aria-hidden="false" draggable="false" loading="lazy" src="${artwork}" data-testid="card-image" alt="${name}" class="mMx2LUixlnN_Fu45JpFB yMQTWVwLJ5bV8VGiaqU3 MxmW8QkHqHWtuhO589PV yOKoknIYYzAE90pe7_SE Yn2Ei5QZn19gria6LjZj">
                            </div>
                        </div>
                        <div class="woJQ5t2YiaJhjTv_KE7p">
                            <div class="ix_8kg3iUb9VS5SmTnBY">
                            </div>
                        </div>
                    </div>
                    <div class="Areas__InteractiveArea-sc-1tea2mc-0 Areas__MainArea-sc-1tea2mc-1 MWEhk kLALqL">
                        <div class="Areas__InteractiveArea-sc-1tea2mc-0 Areas__Column-sc-1tea2mc-2 MWEhk yMCdi">
                            <a draggable="false" class="Gi6Lr1whYBA2jutvHvjQ" href="${url}">
                                <p class="e-9541-text encore-text-body-medium CardTitle__CardText-sc-1h38un4-1 eznGBk xHz124sSHSCYHecLCTfi" data-encore-id="cardTitle" id="card-title-${url}" aria-describedby="onClickHint-${url}" title="${name}" dir="auto">
                                    <span class="CardTitle__LineClamp-sc-1h38un4-0 RBShQ">
                                        <span class="">${name}</span>
                                    </span>
                                </p>
                            </a>
                            <div class="e-9541-text encore-text-body-small encore-internal-color-text-subdued CardDetails__CardDetailText-sc-1gdonml-1 kNtRLK" data-encore-id="cardSubtitle" id="card-subtitle-${url}" dir="auto">
                                <span class="CardDetails__LineClamp-sc-1gdonml-0 sVzSB">
                                    <div class="e-9541-text encore-text-body-small encore-internal-color-text-subdued i6jA7UnVNDJFGlAgtutp JS9WYvoqyy3vUXqMt5Hv" data-encore-id="text">
                                        <span>Artist</span>
                                    </div>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="rating-container" song-id="${url}">
                        <div class="rating">
                            <span>★</span>
                            <div class="avg-rating">${rating}</div>
                        </div>
                    </div>
                </div>
            </div>
        </span>
    `;
}

function createPlaylistHTML(playlist, index) {
    const {artwork, name, owner, rating, url} = playlist;

    return `
        <span role="presentation" class="cuOXad0Tk2T44Jkldvs8">
            <div class="Ih5mmxAJFDIBYVcQQrrN">
                <div class="Box__BoxComponent-sc-y4nds-0 kcRGDn Box-sc-1njtxi4-0 hscyXl aAYpzGljXQv1_zfopxaH Card" data-encore-id="card" role="group" aria-labelledby="card-title-${url}" draggable="true" data-testid="search-category-card-${index}">
                <a class="CardButton-sc-g9vf2u-0 eWZOJQ" href="${url}"></a>
                    <div id="onClickHint-${url}" style="display: none;"></div>
                    <div class="xBV4XgMq0gC5lQICFWY_">
                        <div class="GOcsybnoHYyJGQGDRuwj" style="--card-color: #8C7440;">
                            <div>
                                <img aria-hidden="false" draggable="false" loading="lazy" src="${artwork}" data-testid="card-image" alt="${name}" class="mMx2LUixlnN_Fu45JpFB yMQTWVwLJ5bV8VGiaqU3 yOKoknIYYzAE90pe7_SE Yn2Ei5QZn19gria6LjZj">
                            </div>
                        </div>
                    </div>
                    <div class="Areas__InteractiveArea-sc-1tea2mc-0 Areas__MainArea-sc-1tea2mc-1 MWEhk kLALqL">
                        <div class="Areas__InteractiveArea-sc-1tea2mc-0 Areas__Column-sc-1tea2mc-2 MWEhk yMCdi">
                            <a draggable="false" class="Gi6Lr1whYBA2jutvHvjQ" href="${url}">
                                <p class="e-9541-text encore-text-body-medium CardTitle__CardText-sc-1h38un4-1 eznGBk xHz124sSHSCYHecLCTfi" data-encore-id="cardTitle" id="card-title-${url}" aria-describedby="onClickHint-${url}" title="${name}" dir="auto">
                                    <span class="CardTitle__LineClamp-sc-1h38un4-0 RBShQ">
                                        <span class="">${name}</span>
                                    </span>
                                </p>
                            </a>
                            <div class="e-9541-text encore-text-body-small encore-internal-color-text-subdued CardDetails__CardDetailText-sc-1gdonml-1 kNtRLK" data-encore-id="cardSubtitle" id="card-subtitle-${url}" dir="auto">
                                <span class="CardDetails__LineClamp-sc-1gdonml-0 sVzSB">
                                    <div class="e-9541-text encore-text-body-small encore-internal-color-text-subdued i6jA7UnVNDJFGlAgtutp JS9WYvoqyy3vUXqMt5Hv" data-encore-id="text">
                                        <span>By ${owner.name}</span>
                                    </div>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="rating-container" song-id="${url}">
                        <div class="rating">
                            <span>★</span>
                            <div class="avg-rating">${rating}</div>
                        </div>
                    </div>
                </div>
            </div>
        </span>
    `;
}

function createTrackListDiv(type) {
    let innerHTML = '';
    if (type === 'tracks') {
        innerHTML = `<div role="grid" aria-rowcount="21" aria-colcount="4" aria-label="All songs for “yellow”" class="oIeuP60w1eYpFaXESRSg oYS_3GP9pvVjqbFlh9tq track-list" tabindex="0" data-testid="track-list"><div class="IpXjqI9ouS_N5zi0WM88 track-list-header" role="presentation">
            <div class="ePPpO_NuGDUxVRTw7y6W UpiE7J6vPrJIa59qxts4" role="row" aria-rowindex="1">
<div class="fS0C4IgbHviZxIVGC736" role="columnheader" aria-colindex="1" aria-sort="none" tabindex="-1"><div data-testid="column-header-context-menu">#</div></div><div class="w46g_LQVSLE9xK399VYf" role="columnheader" aria-colindex="2" aria-sort="none" tabindex="-1"><div data-testid="column-header-context-menu"><div class="rGujAXjCLKEd_N6yTwds"><span class="e-9541-text encore-text-body-small standalone-ellipsis-one-line" data-encore-id="text">Title</span></div></div></div><div class="_TH6YAXEzJtzSxhkGSqu" role="columnheader" aria-colindex="3" aria-sort="none" tabindex="-1"><div data-testid="column-header-context-menu"><div class="rGujAXjCLKEd_N6yTwds"><span class="e-9541-text encore-text-body-small standalone-ellipsis-one-line" data-encore-id="text">Album</span></div></div></div><div class="PAqIqZXvse_3h6sDVxU0" role="columnheader" aria-colindex="4" aria-sort="none" tabindex="-1"><div data-testid="column-header-context-menu"><div aria-label="Duration" class="rGujAXjCLKEd_N6yTwds kxxyFjKz2levImEvxq48"><svg data-encore-id="icon" role="img" aria-hidden="true" class="Svg-sc-ytk21e-0 dYnaPI e-9541-icon" viewBox="0 0 16 16"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"></path><path d="M8 3.25a.75.75 0 0 1 .75.75v3.25H11a.75.75 0 0 1 0 1.5H7.25V4A.75.75 0 0 1 8 3.25z"></path></svg></div></div></div></div>
        </div></div>`
    } else {
        innerHTML = `<div data-testid="grid-container" class="iKwGKEfAfW7Rkx2_Ba4E track-list" style="--min-column-width: 130px;">`
    }
    document.querySelector('.track-list-container').innerHTML = innerHTML
}

function changeButtons(buttonClicked) {
    document.querySelectorAll('#songs-button, #albums-button, #artists-button, #playlists-button').forEach((button) => {
        button.querySelector('button').classList = 'LegacyChip__LegacyChipComponent-sc-tzfq94-0 fJQBhR encore-text-body-small'
        button.querySelector('span').classList = 'LegacyChipInner__ChipInnerComponent-sc-1qguixk-0 eURTZh'
    })
    document.querySelector(buttonClicked + ' button').classList = 'LegacyChip__LegacyChipComponent-sc-tzfq94-0 fZfoaE encore-text-body-small'
    document.querySelector(buttonClicked + ' span').classList = 'LegacyChipInner__ChipInnerComponent-sc-1qguixk-0 eWNJLi encore-inverted-light-set'


}

function renderTracks() {
    changeButtons('#songs-button')
    createTrackListDiv('tracks')
    const trackList = document.querySelector('.track-list');
    getInfo('tracks').then((tracks) => {
        trackList.innerHTML += tracks.map((track, index) => createTrackHTML(track, index)).join('') || `<div class="no-info-fetched"><p>${currentUserName()} has not rated any songs yet</p></div>`
    });
    setupInfiniteScroll()
}

function renderAlbums() {
    changeButtons('#albums-button')
    createTrackListDiv('albums')
    const trackList = document.querySelector('.track-list');
    getInfo('albums').then((albums) => {
        trackList.innerHTML = albums.map((album, index) => createAlbumHTML(album, index)).join('') || `<div class="no-info-fetched"><p>${currentUserName()} has not rated any albums yet</p></div>`
    });
    setupInfiniteScroll()
}

function renderArtists() {
    changeButtons('#artists-button')
    createTrackListDiv('artists')
    const trackList = document.querySelector('.track-list');
    getInfo('artists').then((artists) => {
        trackList.innerHTML = artists.map((artist, index) => createArtistHTML(artist, index)).join('') || `<div class="no-info-fetched"><p>${currentUserName()} has not rated any artists yet</p></div>`
    });
    setupInfiniteScroll()
}

function renderPlaylists() {
    changeButtons('#playlists-button')
    createTrackListDiv('playlists')
    const trackList = document.querySelector('.track-list');
    getInfo('playlists').then((playlists) => {
        trackList.innerHTML = playlists.map((playlist, index) => createPlaylistHTML(playlist, index)).join('') || `<div class="no-info-fetched"><p>${currentUserName()} has not rated any playlists yet</p></div>`
    });
    setupInfiniteScroll()
}

function initializeDiv() {
    const userDiv = document.createElement('div');
    userDiv.innerHTML = `<div class="overlay">
            <div class="modal-container" user-id="${currentUserID()}">
                <button aria-label="Close" class="VKCcyYujazVPj6VkksPM"><svg width="18" height="18" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><title>Close</title><path d="M31.098 29.794L16.955 15.65 31.097 1.51 29.683.093 15.54 14.237 1.4.094-.016 1.508 14.126 15.65-.016 29.795l1.414 1.414L15.54 17.065l14.144 14.143" fill="white" fill-rule="evenodd"></path></svg></button>
                <main class="main-content" tabindex="-1" aria-label="Spotify – Search">
                    <div class="qG4q41T8PJl0SkVgUeJc">
                        <div class="IDNDdMa6ACThrEsGWsXX contentSpacing">
                            <div class="bMurPtRDRv5LuN78MTVG">
                                <div class="KjPUGV8uMbl_0bvk9ePv J4qD2RoZgGLbOdpfs63w" role="list">
                                    <div role="presentation" class="flex-container">
                                        <a draggable="false" class="UnwG2v9ISmcUhnjKj22Y" tabindex="-1" id="songs-button">
                                            <button role="checkbox" aria-checked="true" data-encore-id="chip" tabindex="-1">
                                                <span>Songs</span>
                                            </button>
                                        </a>
                                        <a draggable="false" class="UnwG2v9ISmcUhnjKj22Y" tabindex="-1" id="albums-button">
                                            <button role="checkbox" aria-checked="false" data-encore-id="chip" tabindex="-1">
                                                <span>Albums</span>
                                            </button>
                                        </a>
                                        <a draggable="false" class="UnwG2v9ISmcUhnjKj22Y" tabindex="-1" id="artists-button">
                                            <button role="checkbox" aria-checked="false" data-encore-id="chip" tabindex="-1">
                                                <span>Artists</span>
                                            </button>
                                        </a>
                                        <a draggable="false" class="UnwG2v9ISmcUhnjKj22Y" tabindex="-1" id="playlists-button">
                                            <button role="checkbox" aria-checked="false" data-encore-id="chip" tabindex="-1">
                                                <span>Playlists</span>
                                            </button>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="contentSpacing" id="searchPage">
                        <div data-testid="grid-container" class="iKwGKEfAfW7Rkx2_Ba4E kMLumUDiP1DgYtLABkVO">
                            <div class="oahixVvmYv3VD8UxHkpr">
                                <div class="track-list-container" data-testid="infinite-scroll-list">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="main-view-container__mh-footer-container"></div>
                </main>
            </div>
        </div>
    `;
    document.querySelector('body').appendChild(userDiv.firstChild);

    document.getElementById('songs-button').addEventListener('click', renderTracks);
    document.getElementById('albums-button').addEventListener('click', renderAlbums);
    document.getElementById('artists-button').addEventListener('click', renderArtists);
    document.getElementById('playlists-button').addEventListener('click', renderPlaylists);

    document.querySelector('.modal-container [aria-label="Close"]').addEventListener('click', closeDiv)

    document.querySelector('.overlay').addEventListener('click', (e) => {
        if(!document.querySelector('.modal-container').contains(e.target)){
            closeDiv()
        }
    })

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            closeDiv()
        }
    })

    renderTracks();
}

function closeDiv() {
    document.querySelector('.overlay')?.remove()
}

async function getInfo(entityType) {
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Access-Control-Allow-Origin', 'https://open.spotify.com');
    headers.append('Access-Control-Allow-Credentials', 'true');

    try {
        const response = await fetch(`https://resonanceapi.pythonanywhere.com/users/${currentUserID()}/${entityType}`, {
            method: 'GET',
            headers: headers,
        });
        const data = await response.json();

        nextPageUrl = data["next_page"] || null;

        return data[entityType];
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

function currentUserID() {
    return window.location.href.split("/").at(-1)
}

function currentUserName() {
    return document.querySelector('[data-testid="entityTitle"] h1').innerHTML
}

function setupInfiniteScroll() {
    const trackList = document.querySelector('.track-list');

    trackList.addEventListener('scroll', () => {
        const {scrollTop, scrollHeight, clientHeight} = trackList;

        if (scrollTop + clientHeight >= scrollHeight - 10 && !isFetching && nextPageUrl) {
            isFetching = true;
            fetchNextPage();
            console.log({scrollTop, scrollHeight, clientHeight})
        }
    });
}

async function fetchNextPage() {
    if (!nextPageUrl) return;

    try {
        const response = await fetch(nextPageUrl);
        const data = await response.json();

        if (data.tracks) {
            const newItems = data.tracks.map((track, index) => createTrackHTML(track, document.querySelectorAll('.modal-container [role="row"]').length - 1 + index)).join('');
            document.querySelector('.track-list').insertAdjacentHTML('beforeend', newItems);
        } else if (data.albums) {
            const newItems = data.albums.map((album, index) => createAlbumHTML(album, index)).join('');
            document.querySelector('.track-list').insertAdjacentHTML('beforeend', newItems);
        } else if (data.artists) {
            const newItems = data.artists.map((artist, index) => createArtistHTML(artist, index)).join('');
            document.querySelector('.track-list').insertAdjacentHTML('beforeend', newItems);
        } else if (data.playlists) {
            const newItems = data.playlists.map((playlist, index) => createPlaylistHTML(playlist, index)).join('');
            document.querySelector('.track-list').insertAdjacentHTML('beforeend', newItems);
        }

        nextPageUrl = data["next_page"] || null;
    } catch (error) {
        console.error('Error fetching next page:', error);
    } finally {
        isFetching = false;
    }
}


setInterval(() => {
    if (window.location.href.split("/").at(-2) === 'user' && !document.querySelector('.open-modal') && document.querySelector(':has(> [data-testid="entityTitle"]) .rating-container')) {
        const modalButton = document.createElement('div');
        modalButton.innerHTML = `<button class = 'open-modal'><img src="https://resonanceapi.pythonanywhere.com/images/logo.svg">Resonate</button>`
        modalButton.firstChild.addEventListener('click', initializeDiv)
        document.querySelector(':has(> [data-testid="entityTitle"]) .rating-container').prepend(modalButton.firstChild)
    }
    if (document.querySelector(".modal-container") && document.querySelector(".modal-container").getAttribute('user-id') !== currentUserID()) {
        document.querySelector(".overlay").remove()
    }
}, 100)

