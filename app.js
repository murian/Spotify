/**
 * Spotify Player for iOS 9
 * ES5 Compatible - No modern JavaScript features
 */

(function() {
    'use strict';

    // Configuration - REPLACE THESE VALUES
    var CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
    var REDIRECT_URI = window.location.origin + window.location.pathname;
    var SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';

    // State
    var accessToken = null;
    var refreshTimer = null;
    var currentTrack = null;

    // DOM Elements
    var loginScreen = document.getElementById('login-screen');
    var playerScreen = document.getElementById('player-screen');
    var loginBtn = document.getElementById('login-btn');
    var albumArt = document.getElementById('album-art');
    var noPlayback = document.getElementById('no-playback');
    var trackName = document.getElementById('track-name');
    var artistName = document.getElementById('artist-name');
    var albumName = document.getElementById('album-name');
    var currentTime = document.getElementById('current-time');
    var totalTime = document.getElementById('total-time');
    var progressFill = document.getElementById('progress-fill');
    var playPauseBtn = document.getElementById('play-pause-btn');
    var playIcon = document.getElementById('play-icon');
    var pauseIcon = document.getElementById('pause-icon');
    var prevBtn = document.getElementById('prev-btn');
    var nextBtn = document.getElementById('next-btn');
    var statusMessage = document.getElementById('status-message');

    // Utility Functions
    function getHashParams() {
        var hashParams = {};
        var e;
        var r = /([^&;=]+)=?([^&;]*)/g;
        var q = window.location.hash.substring(1);
        while ((e = r.exec(q))) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
        }
        return hashParams;
    }

    function formatTime(ms) {
        var seconds = Math.floor(ms / 1000);
        var minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    }

    function showStatus(message, duration) {
        statusMessage.textContent = message;
        setTimeout(function() {
            statusMessage.textContent = '';
        }, duration || 3000);
    }

    // API Functions
    function makeRequest(method, url, callback, errorCallback) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var response = xhr.responseText ? JSON.parse(xhr.responseText) : null;
                    callback(response);
                } catch (e) {
                    callback(null);
                }
            } else {
                if (errorCallback) {
                    errorCallback(xhr.status, xhr.responseText);
                }
            }
        };

        xhr.onerror = function() {
            if (errorCallback) {
                errorCallback(0, 'Network error');
            }
        };

        xhr.send();
    }

    function getCurrentPlayback() {
        makeRequest('GET', 'https://api.spotify.com/v1/me/player', function(data) {
            if (data && data.item) {
                updatePlayer(data);
                currentTrack = data;
            } else {
                showNoPlayback();
            }
        }, function(status) {
            if (status === 401) {
                // Token expired
                logout();
            } else if (status === 204) {
                // No playback
                showNoPlayback();
            }
        });
    }

    function updatePlayer(data) {
        noPlayback.style.display = 'none';

        // Update track info
        trackName.textContent = data.item.name;

        // Artists
        var artists = [];
        for (var i = 0; i < data.item.artists.length; i++) {
            artists.push(data.item.artists[i].name);
        }
        artistName.textContent = artists.join(', ');

        albumName.textContent = data.item.album.name;

        // Album art
        if (data.item.album.images && data.item.album.images.length > 0) {
            albumArt.src = data.item.album.images[0].url;
            albumArt.style.display = 'block';
        }

        // Progress
        var progress = (data.progress_ms / data.item.duration_ms) * 100;
        progressFill.style.width = progress + '%';
        currentTime.textContent = formatTime(data.progress_ms);
        totalTime.textContent = formatTime(data.item.duration_ms);

        // Play/Pause state
        if (data.is_playing) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }

    function showNoPlayback() {
        noPlayback.style.display = 'flex';
        albumArt.style.display = 'none';
        trackName.textContent = '-';
        artistName.textContent = '-';
        albumName.textContent = '-';
        currentTime.textContent = '0:00';
        totalTime.textContent = '0:00';
        progressFill.style.width = '0%';
    }

    function playPause() {
        if (!currentTrack) {
            showStatus('No playback available');
            return;
        }

        var endpoint = currentTrack.is_playing ?
            'https://api.spotify.com/v1/me/player/pause' :
            'https://api.spotify.com/v1/me/player/play';

        var xhr = new XMLHttpRequest();
        xhr.open('PUT', endpoint, true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
            if (xhr.status === 204) {
                setTimeout(getCurrentPlayback, 300);
            } else if (xhr.status === 404) {
                showStatus('No active device found');
            } else {
                showStatus('Playback error');
            }
        };

        xhr.send();
    }

    function skipToNext() {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api.spotify.com/v1/me/player/next', true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);

        xhr.onload = function() {
            if (xhr.status === 204) {
                showStatus('Skipped to next');
                setTimeout(getCurrentPlayback, 500);
            } else if (xhr.status === 404) {
                showStatus('No active device found');
            } else {
                showStatus('Skip error');
            }
        };

        xhr.send();
    }

    function skipToPrevious() {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://api.spotify.com/v1/me/player/previous', true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);

        xhr.onload = function() {
            if (xhr.status === 204) {
                showStatus('Skipped to previous');
                setTimeout(getCurrentPlayback, 500);
            } else if (xhr.status === 404) {
                showStatus('No active device found');
            } else {
                showStatus('Skip error');
            }
        };

        xhr.send();
    }

    // Authentication
    function login() {
        var authUrl = 'https://accounts.spotify.com/authorize';
        authUrl += '?client_id=' + encodeURIComponent(CLIENT_ID);
        authUrl += '&response_type=token';
        authUrl += '&redirect_uri=' + encodeURIComponent(REDIRECT_URI);
        authUrl += '&scope=' + encodeURIComponent(SCOPES);
        authUrl += '&show_dialog=true';

        window.location = authUrl;
    }

    function logout() {
        accessToken = null;
        localStorage.removeItem('spotify_access_token');
        if (refreshTimer) {
            clearInterval(refreshTimer);
        }
        loginScreen.style.display = 'flex';
        playerScreen.style.display = 'none';
        window.location.hash = '';
    }

    function initPlayer() {
        loginScreen.style.display = 'none';
        playerScreen.style.display = 'flex';

        // Initial fetch
        getCurrentPlayback();

        // Poll every 2 seconds
        refreshTimer = setInterval(function() {
            getCurrentPlayback();
        }, 2000);
    }

    // Event Listeners
    loginBtn.addEventListener('click', login);
    playPauseBtn.addEventListener('click', playPause);
    nextBtn.addEventListener('click', skipToNext);
    prevBtn.addEventListener('click', skipToPrevious);

    // Initialization
    function init() {
        // Check for access token in URL hash
        var params = getHashParams();
        if (params.access_token) {
            accessToken = params.access_token;
            localStorage.setItem('spotify_access_token', accessToken);
            window.location.hash = '';
            initPlayer();
            return;
        }

        // Check for stored access token
        var storedToken = localStorage.getItem('spotify_access_token');
        if (storedToken) {
            accessToken = storedToken;
            initPlayer();
            return;
        }

        // Show login screen
        loginScreen.style.display = 'flex';
        playerScreen.style.display = 'none';
    }

    // Start the app
    init();
})();
