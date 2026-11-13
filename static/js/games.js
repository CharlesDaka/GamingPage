if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.addEventListener('pageshow', () => {
    window.scrollTo(0, 0);
});


let currentPlatform = 'All';
let currentSort = '-rating';
let gamesPageScrollY = 0;


document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);
    const listItems = document.querySelectorAll('.list-inline-item');
    const gameDetailsPage = document.querySelector('.game-details-page');
    if (gameDetailsPage) {
        gameDetailsPage.style.display = 'none';
    }

    const sortSelect = document.querySelector('#sort-select');
    const gamesPage = document.querySelector('.games-page');
    if (sortSelect && gamesPage) {
        currentSort = sortSelect.value;
        const query = new URLSearchParams(window.location.search).get('q') || '';
        if (query) {
            const searchInput = document.querySelector('input[name="q"]');
            if (searchInput) {
                searchInput.value = query;
            }
            searchGames(query);
        } else {
            fetchGames(currentPlatform, currentSort);
        }

        sortSelect.addEventListener('change', (event) => {
            currentSort = event.target.value;
            fetchGames(currentPlatform, currentSort);
        });
    }

    listItems.forEach(platform => {
        platform.addEventListener('click', () => {
            currentPlatform = platform.dataset.platform || 'All';
            fetchGames(currentPlatform, currentSort);
        });
    });

    const searchForm = document.querySelector('form[role="search"]');
    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            searchGames();
        });
    }
});


function fetchGames(platform, sortByValue) {
    currentPlatform = platform || 'All';
    currentSort = sortByValue || currentSort || '-rating';
    const gamesPage = document.querySelector('.games-page');
    
    if (gamesPage) {
        const gameFetching = document.querySelector('.game-fetching');
        const cyberpunkErrorTheme = document.querySelector('.cyberpunk-error-theme');
        const glitchText = document.querySelector('.glitch-text');
        const platformOnLoading = document.querySelector('.platform-on-loading');

        if (gameFetching) {gameFetching.style.display = 'flex';}
        if (cyberpunkErrorTheme) {cyberpunkErrorTheme.style.display = 'none';}
        if (glitchText) {glitchText.textContent = `FETCHING ${platform.toUpperCase()} GAMES...`;}
        if (platformOnLoading) {platformOnLoading.textContent = `PLATFORM: ${platform}`;}

        const params = new URLSearchParams({ sort_by: sortByValue });
        fetch(`/games/${platform}?${params.toString()}`)
        .then(r => r.json())
        .then(d => {
            if (d.message) {
                document.querySelector('.pagination').style.display = 'none';
                document.querySelector('.game-fetching').style.display = 'none';
                document.querySelector('.cyberpunk-error-theme').style.display = 'block';
                document.querySelector('.cyberpunk-error-theme').innerHTML = `
                    <h1 class="glitch">SYSTEM ERROR</h1>
                    <p>${d.message}</p>
                    <a href="">Try Again</a>    
                `;
            }
            

            const gamesContainer = document.querySelector('#game_section');
            gamesContainer.innerHTML = '';

            d.games.forEach(game => {
                const gameCard = document.createElement('div');
                gameCard.className = 'game-card';

                const gameCardContent = `
                    <div class="game-card-image">
                        <img loading="lazy" src="${game.background_image || game.thumbnail}" alt="${game.name || game.title}">
                    </div>
                    <div class="game-card-content">
                        <h3 class="game-title">${game.name || game.title}</h3>
                        <p>Released: ${game.released || game.release_date}</p>
                        <p>Rating: ${game.rating || 0}
                            <span style="color: #FFD700; font-size: 24px;">
                                ${'★'.repeat(Math.floor(game.rating))}${'☆'.repeat(5 - Math.floor(game.rating))}
                            </span>
                        </p>
                        <button class="game-details-btn" onclick="gameDetails(${game.id}, '${(game.name || game.title || '').replace(/'/g, "\\'")}')">Game Details</button>
                    </div>
                `;
                gameCard.innerHTML = gameCardContent;
                gamesContainer.appendChild(gameCard);
            });

            const paginationContainer = document.querySelector('.pagination');
            let previous = `<a class="page-link" tabindex="-1" disabled>Previous page</a>`
            if (d.prevPage) {
                previous = `<button class="page-link" tabindex="-1" onclick='gamesPagination(${JSON.stringify(d.prevPage)})'>Previous page</button>`
            }

            let nextPage = `<a class="page-link" tabindex="-1" disabled>Next page</a>`
            if (d.nextPage) {
                nextPage = `<button class="page-link" onclick='gamesPagination(${JSON.stringify(d.nextPage)})'>Next page</button>`
            }

            paginationContainer.innerHTML = `
                <ul class="pagination justify-content-center">
                    <li class="page-item">${previous}</li>
                    <li class="page-item disabled"><a class="page-link current">page ${d.currentPage}</a></li>
                    <li class="page-item">${nextPage}</li>
                </ul>
            `
        })
        .catch(err => {console.log(err)})
        .finally(() => {
            document.querySelector('.game-fetching').style.display = 'none';
        });
    }
    
}


function gamesPagination(link) {
    document.querySelector('.game-fetching').style.display = 'flex';
    document.querySelector('.cyberpunk-error-theme').style.display = 'none';
    document.querySelector('.glitch-text').textContent = `LOADING NEXT PAGE...`
    document.querySelector('.platform-on-loading').textContent = `Please Wait.`

    const animationView = document.querySelector('.game-fetching');
    requestAnimationFrame(() => {
        animationView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const nextUrl = new URL(link, window.location.origin);
    nextUrl.searchParams.set('sort_by', currentSort);

    fetch(nextUrl)
    .then(r => r.json())
    .then(d => {
        const gamesContainer = document.querySelector('#game_section');
        gamesContainer.innerHTML = '';

        const games = d.games || d.results || [];
        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';

            const gameCardContent = `
                <div class="game-card-image">
                    <img loading="lazy" src="${game.background_image}" alt="${game.name}">
                </div>
                <div class="game-card-content">
                    <h3 class="game-title">${game.name}</h3>
                    <p>Released: ${game.released}</p>
                    <p>Rating: ${game.rating}
                        <span style="color: #FFD700; font-size: 24px;">
                            ${'★'.repeat(Math.floor(game.rating))}${'☆'.repeat(5 - Math.floor(game.rating))}
                        </span>
                    </p>
                    <button class="game-details-btn" onclick="gameDetails(${game.id})">Game Details</button>
                </div>
            `;
            gameCard.innerHTML = gameCardContent;
            gamesContainer.appendChild(gameCard);
        });

        const paginationContainer = document.querySelector('.pagination');

        let previous = `<a class="page-link" tabindex="-1" disabled>Previous page</a>`
        if (d.previousPage || d.previous) {
            previous = `<button class="page-link" tabindex="-1" onclick='gamesPagination(${JSON.stringify(d.previousPage || d.previous)})'>Previous page</button>`
        }

        let nextPage = `<a class="page-link" tabindex="-1" disabled>Next page</a>`
        if (d.nextPage || d.next) {
            nextPage = `<button class="page-link" onclick='gamesPagination(${JSON.stringify(d.nextPage || d.next)})'>Next page</button>`
        }

        const pageNumber = new URL(link, window.location.origin).searchParams.get('page') || d.currentPage || 1;

        paginationContainer.innerHTML = `
            <ul class="pagination justify-content-center">
                <li class="page-item">${previous}</li>
                <li class="page-item disabled"><a class="page-link current">page ${pageNumber}</a></li>
                <li class="page-item">${nextPage}</li>
            </ul>
        `
    })
    .catch(err => {console.log(err)})
    .finally(() => { document.querySelector('.game-fetching').style.display = 'none'; });
}


function searchGames(queryOverride = '') {
    const searchInput = document.querySelector('input[name="q"]');
    const query = (queryOverride || searchInput?.value || '').trim();

    if (!document.querySelector('.games-page')) {
        window.location.href = `/?q=${encodeURIComponent(query)}`;
        return;
    }

    document.querySelector('.game-fetching').style.display = 'flex';
    document.querySelector('.cyberpunk-error-theme').style.display = 'none';
    document.querySelector('.glitch-text').textContent = `SEARCHING FOR "${query.toUpperCase()}" GAMES...`
    document.querySelector('.platform-on-loading').textContent = `PLATFORM: ${currentPlatform}`

    const animationView = document.querySelector('.game-fetching');
    requestAnimationFrame(() => {
        animationView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    if (query) {
        const params = new URLSearchParams({ q: query, sort_by: currentSort });
        fetch(`/games/${currentPlatform}?${params.toString()}`)
        .then(r => r.json())
        .then(d => {
            const gamesContainer = document.querySelector('#game_section');
            gamesContainer.innerHTML = '';

            if (d.message) {
                document.querySelector('.pagination').style.display = 'none';
                document.querySelector('.game-fetching').style.display = 'none';
                document.querySelector('.cyberpunk-error-theme').style.display = 'block';
                document.querySelector('.cyberpunk-error-theme').innerHTML = `
                    <h2 class="glitch">SYSTEM ERROR</h2>
                    <p>${d.message}</p>
                    <a href="">Try Again</a>    
                `;
            } else if (!d.games || d.games.length === 0) {
                document.querySelector('.pagination').style.display = 'none';
                document.querySelector('.game-fetching').style.display = 'none';
                document.querySelector('.cyberpunk-error-theme').style.display = 'block';
                document.querySelector('.cyberpunk-error-theme').innerHTML = `
                    <h1 class="glitch">ERROR 404</h1>
                    <p>No games found for "${query}", try different title or <a href="">Request a game</a></p>
                    <a href="">See All Games</a>    
                `;
            } else {
                document.querySelector('.game-fetching').style.display = 'none';
                document.querySelector('.cyberpunk-error-theme').style.display = 'block';
                const game_count = d.games.length;
                document.querySelector('.cyberpunk-error-theme').innerHTML = `
                    <h2 class="glitch">${game_count} Game(s) Found.</h2>    
                `;
            }

            (d.games || []).forEach(game => {
                const gameCard = document.createElement('div');
                gameCard.className = 'game-card';
                
                const platforms = '';

                const gameCardContent = `
                    <div class="game-card-image">
                        <img loading="lazy" src="${game.background_image || game.thumbnail}" alt="${game.name || game.title}">
                    </div>
                    <div class="game-card-content">
                        <h3 class="game-title">${game.name || game.title}</h3>
                        <p>Released: ${game.released || game.release_date}</p>
                        <p>Rating: ${game.rating || 0}
                            <span style="color: #FFD700; font-size: 24px;">
                                ${'★'.repeat(Math.floor(game.rating))}${'☆'.repeat(5 - Math.floor(game.rating))}
                            </span>
                        </p>
                        <button class="game-details-btn" onclick="gameDetails(${game.id})">Game Details</button>
                    </div>
                `;
                gameCard.innerHTML = gameCardContent;
                gamesContainer.appendChild(gameCard);
            });

            const paginationContainer = document.querySelector('.pagination');
            let previous = `<button class="page-link" tabindex="-1" disabled>Previous page</button>`
            if (d.prevPage || d.previousPage) {
                previous = `<button class="page-link" tabindex="-1" onclick='gamesPagination(${JSON.stringify(d.prevPage || d.previousPage)})'>Previous page</button>`
            }

            let nextPage = `<button class="page-link" tabindex="-1" disabled>Next page</button>`
            if (d.nextPage) {
                nextPage = `<button class="page-link" onclick='gamesPagination(${JSON.stringify(d.nextPage)})'>Next page</button>`
            }

            paginationContainer.innerHTML = `
                <ul class="pagination justify-content-center">
                    <li class="page-item">${previous}</li>
                    <li class="page-item disabled"><a class="page-link current">page ${d.currentPage}</a></li>
                    <li class="page-item">${nextPage}</li>
                </ul>
            `
        })
        .catch(err => {console.log(err)})
        .finally(() => {
            document.querySelector('.game-fetching').style.display = 'none';
        });
    } else {
        fetchGames(currentPlatform, currentSort);
    }
}


function gameDetails(game_id) {
    gamesPageScrollY = window.scrollY;
    document.querySelector('.games-page').style.display = 'none';
    document.querySelector('.game-details-page').style.display = 'block';
    const gameDetailsContainer = document.querySelector('#game-details-section');
    gameDetailsContainer.innerHTML = `
        <div class="cyber-xbox-loader">
            <div class="xbox-orb""></div>
            <div class="glitch-text" style="text-align: left">LOADING... PLEASE WAIT.</div>
            <div class="loading-stats">
                <span class="pulse">MAINFRAME: LINKED</span>
                <span class="pulse delay">PAGE: GAME DETAILS</span>
            </div>
        </div>
    `;
    requestAnimationFrame(() => {
        gameDetailsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    
    fetch(`/game/${game_id}`)
    .then(r => {
        if (!r.ok) throw new Error(`Game details request failed: ${r.status}`);
        return r.json();
    })
    .then(game => {
        const screenshots = game.screenshots || game.gameDetails['screenshots'] || [];
        const imageElement = (screenshots || [])
            .map(img => `<img src="${img['image']}" alt="${game.gameDetails['name'] || game.gameDetails['title'] || ''} screenshot ${img.id || ''}">`)
            .join('')
        
        gameDetailsContainer.innerHTML = `
            <div style="text-align: left;">
                <button onclick="goBack2GamesPage()" class="back-btn">
                    < Back
                </button>
            </div>
            <div class="game-card-image">
                <img loading="lazy" src="${game.gameDetails['background_image'] || game.gameDetails['thumbnail']}" alt="${game.gameDetails['name'] || game.gameDetails['title']} Cover">
            </div>
            <h3>${game.gameDetails['name'] || game.gameDetails['title']}</h3>
            <p>${game.gameDetails['short_description'] || ''}</p>
            <p><b>Released</b>: <i>${game.gameDetails['released'] || game.gameDetails['release_date'] || 'unknown'}</i></p>
            <p><b>Rating</b>: <i>${game.gameDetails['rating'] || 0}</i>
                <span style="color: #FFD700; font-size: 24px;">
                    ${'★'.repeat(Math.floor(game.gameDetails['rating'] || 0))}${'☆'.repeat(5 - Math.floor(game.gameDetails['rating'] || 0))}
                </span>
                <span>(${game.gameDetails['ratings_count'] || 0} ratings)</span>
            </p>
            <p><b>Genre</b>: <i>${game.gameDetails['genre'] || 'unknown'}</i> | <b>Developer</b>: <i>${game.gameDetails['developer'] || 'unknown'}</i> | <b>Publisher</b>: <i>${game.gameDetails['publisher'] || 'unknown'}</i></p>
            <h5><b>Game Screenshots</b></h5>
            <div class="slider-container">
                <div class="slider-wrapper" data-screenshot-count="${screenshots.length}">
                    ${imageElement || `<p>No screenshots available for this game.</p>`}
                </div>
            </div>
            <div class="game-description">
                <p>${game.gameDetails['description'] || ''}</p>
            </div>

            ${renderRequirements(game.gameDetails)}

            
            <p><b>Status</b>: <i>${game.gameDetails['status']}</i></p>
            <p><b>Tags</b>: <i>${game.gameDetails['tags'] ? game.gameDetails['tags'].map(tag => `<small>${tag.name}</small>`).join(', ') : 'unknown'}</i></p>
            <div id="trailers-section">
                <h5><b>Game Trailers</b></h5>
            </div>
            <button id="trailers-toggle" onclick="getGameTrailers(${game_id})" class="btn btn-secondary">
               <i class="fas fa-film"></i> Show Trailers
            </button>
            
            <p style="align-items: center; justify-content: center; margin: 10px;"><a href="${game.gameDetails['game_url']}" target="_blank" style="text-decoration: none;">
                   <button class="game-website-btn">Game Website</button>
                </a>
            </p>
            <div>
                <h5 style="margin-top: 20px;"><b>Available On</b>:</h5>
                <div class="stores-container">
                    ${game.stores && game.stores.length > 0 ? game.stores.map(store => `
                        <div class="store-item">
                            <a href="${store.url}" target="_blank">
                                <i class="${store.className || 'fa-solid fa-cart-plus'}"></i> ${store.storeName || store.store?.name || 'Store'}</a>
                        </div>
                    `).join('') : '<p>No stores available for this game.</p>'}
                </div>
            </div>
            
            <h5 style="margin-top: 20px;"><b>DLCs</b></h5>
            <div class="additions-container">
                ${game.additions && game.additions.length > 0 ? game.additions.map(addition => `
                    <div class="addition-item">
                        <h6>${addition.name}</h6>
                        <small><b>Released:</b> ${addition.released || 'Unknown'}</small>
                    </div>
                `).join('') : '<p>No additional content available for this game.</p>'}
            </div>
        `
        startScreenshotSlider(screenshots.length);
    })
    .catch(error => {
        console.error(error);
        document.querySelector('#game-details-section').innerHTML = `
            <div style="text-align: left;">
                <button onclick="goBack2GamesPage()" style="border: none; background: rgba(10, 10, 20, 0.9); color: white; border-radius: 5px;">
                    < Back
                </button>
            </div>
            <div class="cyberpunk-error-theme" style="display: block;">
                <h1 class="glitch" style="font-size: 2rem;">GAME DETAILS UNAVAILABLE</h1>
                <p>Check your internet connection or try again later.</p>
                <p>${error.message}</p>
            </div>
        `;
    });
}

let screenshotSliderTimer;

function startScreenshotSlider(screenshotCount) {
    clearInterval(screenshotSliderTimer);

    if (screenshotCount < 2) return;

    const sliderWrapper = document.querySelector('#game-details-section .slider-wrapper');
    let currentSlide = 0;
    screenshotSliderTimer = setInterval(() => {
        currentSlide = (currentSlide + 1) % screenshotCount;
        sliderWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
    }, 5000);
}


function goBack2GamesPage() {
    document.querySelector('.games-page').style.display = 'block';
    document.querySelector('.game-details-page').style.display = 'none';

    requestAnimationFrame(() => {
        window.scrollTo(0, gamesPageScrollY);
    });
}


function renderRequirements(gameData) {
    const platforms = gameData.platforms || [{
        platform: {
            name: gameData.platform || 'System',
            slug: String(gameData.platform || 'system').toLowerCase().replace(/\s+/g, '-')
        },
        requirements: {
            minimum: formatRequirements(gameData.minimum_system_requirements)
        }
    }];

    let tabs = '';
    let panels = '';

    platforms.forEach((item, index) => {
    const platform = item.platform || {};
    const platformName = platform.name || gameData.platform || 'System';
    const slug = platform.slug || String(platformName).toLowerCase().replace(/\s+/g, '-');
    const isActive = index === 0 ? 'active' : '';

    tabs += `<button class="chrome-tab ${isActive}" onclick="switchTab(event, 'panel-${slug}')">${platformName}</button>`;

    // 2. Parse out requirements text or default to '-'
    let minText = item.requirements?.minimum || '-';
    let recText = item.requirements?.recommended || '-';

    panels += `
    <div id="panel-${slug}" class="panel ${isActive}">
        <h2>${platformName} Requirements</h2>
        <div class="req-box">
        ${minText !== '-' ? `<strong style="color: #00f0ff;;">${minText}</strong>` : '-'}
        ${recText !== '-' ? `<br><br><strong style="color: #00f0ff;">${recText}</strong>` : ''}
        </div>
    </div>`;
    });

    return `
    <div class="chrome-container">
        <div class="chrome-tabs-header">${tabs}</div>
        <div class="chrome-tab-content">${panels}</div>
    </div>`;
}


function formatRequirements(requirements) {
    if (!requirements) return '-';
    if (typeof requirements === 'string') return requirements;

    return Object.entries(requirements)
        .map(([key, value]) => `${key}: ${value || '-'}`)
        .join('<br>');
}


function switchTab(event, panelId) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.chrome-tab').forEach(t => t.classList.remove('active'));

    document.getElementById(panelId).classList.add('active');
    event.currentTarget.classList.add('active');
}


function getGameTrailers(game_id) {
    const trailersContainer = document.querySelector('#trailers-section');
    const toggleButton = document.querySelector('#trailers-toggle');

    if (trailersContainer.dataset.loaded === 'true') {
        const isHidden = trailersContainer.style.display === 'none';
        trailersContainer.style.display = isHidden ? 'block' : 'none';
        toggleButton.innerHTML = isHidden ? '<i class="fas fa-film"></i> Hide Trailers' : '<i class="fas fa-film"></i> Show Trailers';
        return;
    }

    trailersContainer.innerHTML = '<h5><b>Game Trailers</b></h5> <p class="glitch-text">Loading trailers...</p>';
    trailersContainer.style.display = 'block';
    toggleButton.innerHTML = '<i class="fas fa-film"></i> Hide Trailers';

    fetch(`/game/${game_id}/trailers`)
    .then(r => r.json())
    .then(d => {
        if (d.trailers && d.trailers.length > 0) {
            trailersContainer.dataset.loaded = 'true';
            trailersContainer.dataset.index = '0';
            trailersContainer.dataset.quality = '480';
            trailersContainer.dataset.trailers = JSON.stringify(d.trailers);
            renderTrailer();
        } else {
            trailersContainer.innerHTML = '<h5><b>Game Trailers</b></h5> <p>No trailers available for this game.</p>';
            toggleButton.innerHTML = '<i class="fas fa-film"></i> Show Trailers';
        }
    })
    .catch(err => {
        console.error('Error fetching trailers:', err);
        document.querySelector('#trailers-section').innerHTML = '<h5><b>Game Trailers</b></h5> <p>Error fetching trailers.Please check your internet connection and try again later.</p>';
        toggleButton.innerHTML = '<i class="fas fa-film"></i> Show Trailers';
    })
    .finally(() => {
        const trailersContainer = document.querySelector('#trailers-section');
        if (trailersContainer) {
            const loadingMessage = trailersContainer.querySelector('p');
            if (loadingMessage && loadingMessage.textContent.includes('Loading trailers...')) loadingMessage.remove();
        }
    });
}

function renderTrailer() {
    const trailersContainer = document.querySelector('#trailers-section');
    const trailers = JSON.parse(trailersContainer.dataset.trailers || '[]');
    const index = Number(trailersContainer.dataset.index || 0);
    const quality = trailersContainer.dataset.quality || '480';
    const trailer = trailers[index];
    const videoUrl = trailer.data[quality] || trailer.data.max || trailer.data['480'];

    requestAnimationFrame(() => {
        trailersContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    trailersContainer.innerHTML = `
        <h5><b>Game Trailers</b></h5>
        <div class="game-trailers-slider">
            <div class="trailer-card">
                <div class="trailer-controls">
                    <div class="quality-controls">
                        <b>Quality</b>:
                        <button class="quality-btn" onclick="changeTrailerQuality('480')">480p</button>
                        <button class="quality-btn" onclick="changeTrailerQuality('max')">Max</button>
                    </div>
                    <p class="alert alert-warning">Please Note that all trailers are muted!</p>
                    <div class="slider-controls">
                        <b>Video ${index + 1} of ${trailers.length}</b>
                        <button class="prev-btn" onclick="changeTrailer(-1)" ${trailers.length < 2 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
                        <button class="next-btn" onclick="changeTrailer(1)" ${trailers.length < 2 ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="trailer-content">
                    <h6>${trailer.name || 'Game Trailer'}</h6>
                    

                    <div class="video-container" id="videoContainer">
                        <video id="customVideo" poster="${trailer.preview || ''}">
                            <source src="${videoUrl || ''}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        
                        <div class="control-bar" id="controlBar">
                            <button id="playPauseBtn"><i class="fas fa-play"></i></button>
                            
                            <input type="range" id="progressBar" min="0" max="100" value="0">
                            <span id="timeDisplay">0:00 / 0:00</span>
                            
                            <button id="muteBtn"><i class="fas fa-volume-high"></i></button>
                            <input type="range" id="volumeSlider" min="0" max="1" step="0.1" value="1">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    videoControls();
}

function changeTrailer(step) {
    const trailersContainer = document.querySelector('#trailers-section');
    const trailers = JSON.parse(trailersContainer.dataset.trailers || '[]');
    const index = Number(trailersContainer.dataset.index || 0);
    trailersContainer.dataset.index = String((index + step + trailers.length) % trailers.length);
    renderTrailer();
}

function changeTrailerQuality(quality) {
    const trailersContainer = document.querySelector('#trailers-section');
    trailersContainer.dataset.quality = quality;
    renderTrailer();
}

function videoControls() {
    const video = document.getElementById('customVideo');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const progressBar = document.getElementById('progressBar');
    const timeDisplay = document.getElementById('timeDisplay');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');

    if (!video || !playPauseBtn || !progressBar || !timeDisplay || !muteBtn || !volumeSlider) {
        console.error('Video controls could not be initialized because a control element is missing.');
        return;
    }

    // Play and Pause toggle
    playPauseBtn.addEventListener('click', () => {
    if (video.paused || video.ended) {
        video.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        video.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    });

    // Helper function to format timestamp strings
    function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
    }

    // Dynamically update progress bar & time counter as video plays
    video.addEventListener('timeupdate', () => {
    if (video.duration) {
        const percentage = (video.currentTime / video.duration) * 100;
        progressBar.value = percentage;
        timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    }
    });

    // Seek video timeline when user drags the progress bar slider
    progressBar.addEventListener('input', () => {
    const seekTime = (progressBar.value / 100) * video.duration;
    video.currentTime = seekTime;
    });

    // Adjust volume slider
    volumeSlider.addEventListener('input', () => {
    video.volume = volumeSlider.value;
    video.muted = (video.volume === 0);
    muteBtn.innerHTML = video.muted ? '<i class="fas fa-volume-xmark"></i>' : '<i class="fas fa-volume-high"></i>';
    });

    // Mute/Unmute toggle button
    muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    muteBtn.innerHTML = video.muted ? '<i class="fas fa-volume-xmark"></i>' : '<i class="fas fa-volume-high"></i>';
    volumeSlider.value = video.muted ? 0 : video.volume;
    });
}
