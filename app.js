/**
 * Spotify Player for iOS 9 - Local Server Version
 * ES5 Compatible - No modern JavaScript features
 * Connects to local server running on your Mac
 */

(function() {
    'use strict';

    // State
    var serverUrl = null;
    var refreshTimer = null;
    var currentTrack = null;

    // DOM Elements
    var connectionScreen = document.getElementById('connection-screen');
    var playerScreen = document.getElementById('player-screen');
    var serverUrlInput = document.getElementById('server-url');
    var connectBtn = document.getElementById('connect-btn');
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
    var newsTickerText = document.getElementById('news-ticker-text');

    // Utility Functions
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
    function makeRequest(method, endpoint, data, callback, errorCallback) {
        var xhr = new XMLHttpRequest();
        var url = serverUrl + endpoint;

        xhr.open(method, url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var response = xhr.responseText ? JSON.parse(xhr.responseText) : null;
                    callback(response);
                } catch (e) {
                    if (errorCallback) {
                        errorCallback('Parse error', xhr.responseText);
                    }
                }
            } else {
                if (errorCallback) {
                    errorCallback(xhr.status, xhr.responseText);
                }
            }
        };

        xhr.onerror = function() {
            if (errorCallback) {
                errorCallback('Network error', null);
            }
        };

        if (data) {
            xhr.send(JSON.stringify(data));
        } else {
            xhr.send();
        }
    }

    function getCurrentPlayback() {
        makeRequest('GET', '/api/status', null, function(data) {
            if (data && data.running && data.track) {
                updatePlayer(data);
                currentTrack = data;
            } else {
                showNoPlayback();
                currentTrack = null;
            }
        }, function(error) {
            console.error('Error getting playback:', error);
            showNoPlayback();
            currentTrack = null;
        });
    }

    function updatePlayer(data) {
        noPlayback.style.display = 'none';

        // Update track info
        trackName.textContent = data.track.name || '-';
        artistName.textContent = data.track.artist || '-';
        albumName.textContent = data.track.album || '-';

        // Album art
        if (data.track.albumArt) {
            albumArt.src = data.track.albumArt;
            albumArt.style.display = 'block';
        } else {
            albumArt.style.display = 'none';
        }

        // Progress
        var duration = data.track.duration || 0;
        var position = data.track.position || 0;
        var progress = duration > 0 ? (position / duration) * 100 : 0;

        progressFill.style.width = progress + '%';
        currentTime.textContent = formatTime(position);
        totalTime.textContent = formatTime(duration);

        // Play/Pause state
        if (data.isPlaying) {
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
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }

    function controlPlayback(action) {
        makeRequest('POST', '/api/control', { action: action }, function(response) {
            if (response && response.success) {
                setTimeout(getCurrentPlayback, 300);
            } else {
                showStatus('Control failed');
            }
        }, function(error) {
            showStatus('Control error');
            console.error('Control error:', error);
        });
    }

    function playPause() {
        controlPlayback('playpause');
    }

    function skipToNext() {
        controlPlayback('next');
        showStatus('Next track');
    }

    function skipToPrevious() {
        controlPlayback('previous');
        showStatus('Previous track');
    }

    // News Ticker
    function fetchNews() {
        if (!serverUrl) return;

        makeRequest('GET', '/api/news', null, function(response) {
            if (response && response.news && response.news.length > 0) {
                // Create scrolling text with bullet separators
                var newsText = response.news.join(' • ') + ' • ';
                newsTickerText.textContent = newsText;
            }
        }, function(error) {
            console.error('Error fetching news:', error);
        });
    }

    // Connection
    function testConnection(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url + '/api/info', true);
        xhr.timeout = 5000;

        xhr.onload = function() {
            if (xhr.status === 200) {
                callback(true);
            } else {
                callback(false);
            }
        };

        xhr.onerror = function() {
            callback(false);
        };

        xhr.ontimeout = function() {
            callback(false);
        };

        xhr.send();
    }

    function connect() {
        var url = serverUrlInput.value.trim();

        // Remove trailing slash if present
        if (url.charAt(url.length - 1) === '/') {
            url = url.substring(0, url.length - 1);
        }

        // Basic validation
        if (!url || url.indexOf('http') !== 0) {
            showStatus('Please enter a valid URL');
            return;
        }

        connectBtn.textContent = 'Connecting...';
        connectBtn.disabled = true;

        testConnection(url, function(success) {
            connectBtn.textContent = 'Connect';
            connectBtn.disabled = false;

            if (success) {
                serverUrl = url;
                localStorage.setItem('spotify_server_url', serverUrl);
                initPlayer();
            } else {
                showStatus('Cannot connect to server. Check the URL and try again.', 5000);
            }
        });
    }

    function disconnect() {
        serverUrl = null;
        localStorage.removeItem('spotify_server_url');
        if (refreshTimer) {
            clearInterval(refreshTimer);
        }
        connectionScreen.style.display = 'flex';
        playerScreen.style.display = 'none';
    }

    function initPlayer() {
        connectionScreen.style.display = 'none';
        playerScreen.style.display = 'flex';

        // Initial fetch
        getCurrentPlayback();
        fetchNews();

        // Poll every 1 second for smooth updates
        refreshTimer = setInterval(function() {
            getCurrentPlayback();
        }, 1000);

        // Update news every 5 minutes
        setInterval(function() {
            fetchNews();
        }, 5 * 60 * 1000);
    }

    // Event Listeners
    connectBtn.addEventListener('click', connect);
    playPauseBtn.addEventListener('click', playPause);
    nextBtn.addEventListener('click', skipToNext);
    prevBtn.addEventListener('click', skipToPrevious);

    // Enter key on input
    serverUrlInput.addEventListener('keypress', function(e) {
        if (e.keyCode === 13 || e.which === 13) {
            connect();
        }
    });

    // Initialization
    function init() {
        // Auto-detect server URL from browser address
        var currentUrl = window.location.protocol + '//' + window.location.host;

        // If we're accessing via IP/domain (not file://), use current URL
        if (window.location.protocol !== 'file:') {
            serverUrlInput.value = currentUrl;

            // Try to auto-connect immediately
            testConnection(currentUrl, function(success) {
                if (success) {
                    serverUrl = currentUrl;
                    localStorage.setItem('spotify_server_url', serverUrl);
                    initPlayer();
                } else {
                    // Try stored URL as fallback
                    var storedUrl = localStorage.getItem('spotify_server_url');
                    if (storedUrl && storedUrl !== currentUrl) {
                        serverUrlInput.value = storedUrl;
                        testConnection(storedUrl, function(success) {
                            if (success) {
                                serverUrl = storedUrl;
                                initPlayer();
                            } else {
                                connectionScreen.style.display = 'flex';
                                playerScreen.style.display = 'none';
                            }
                        });
                    } else {
                        connectionScreen.style.display = 'flex';
                        playerScreen.style.display = 'none';
                    }
                }
            });
        } else {
            // File protocol - check for stored server URL
            var storedUrl = localStorage.getItem('spotify_server_url');
            if (storedUrl) {
                serverUrlInput.value = storedUrl;

                // Try to auto-connect
                testConnection(storedUrl, function(success) {
                    if (success) {
                        serverUrl = storedUrl;
                        initPlayer();
                    } else {
                        connectionScreen.style.display = 'flex';
                        playerScreen.style.display = 'none';
                        showStatus('Server not available. Please reconnect.', 5000);
                    }
                });
            } else {
                // Show connection screen
                connectionScreen.style.display = 'flex';
                playerScreen.style.display = 'none';
            }
        }
    }

    // Handle visibility change to pause/resume updates
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            if (refreshTimer) {
                clearInterval(refreshTimer);
            }
        } else {
            if (serverUrl && playerScreen.style.display !== 'none') {
                getCurrentPlayback();
                refreshTimer = setInterval(function() {
                    getCurrentPlayback();
                }, 1000);
            }
        }
    });

    // Start the app
    init();
})();
