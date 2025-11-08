/**
 * Local Spotify Server for macOS
 * Runs on your Mac and provides an API for the iPad to connect to
 */

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for local network access
app.use(cors());
app.use(express.json());

// Serve static files (the web interface)
app.use(express.static(__dirname));

/**
 * Execute AppleScript and return result
 */
function runAppleScript(script) {
    return new Promise((resolve, reject) => {
        exec(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

/**
 * Get current playback state from Spotify
 */
async function getPlaybackState() {
    try {
        const script = `
            tell application "Spotify"
                if it is running then
                    set trackName to name of current track
                    set artistName to artist of current track
                    set albumName to album of current track
                    set albumArt to artwork url of current track
                    set playerState to player state as string
                    set trackDuration to duration of current track
                    set playerPosition to player position
                    set trackID to id of current track
                    set trackPopularity to popularity of current track
                    set shuffleState to shuffling
                    set repeatState to repeating

                    return trackName & "|" & artistName & "|" & albumName & "|" & albumArt & "|" & playerState & "|" & trackDuration & "|" & playerPosition & "|" & trackID & "|" & trackPopularity & "|" & shuffleState & "|" & repeatState
                else
                    return "not_running"
                end if
            end tell
        `;

        const result = await runAppleScript(script);

        if (result === 'not_running') {
            return { running: false };
        }

        const [trackName, artistName, albumName, albumArt, playerState, duration, position, trackID, popularity, shuffling, repeating] = result.split('|');

        return {
            running: true,
            track: {
                name: trackName,
                artist: artistName,
                album: albumName,
                albumArt: albumArt,
                duration: parseInt(duration),
                position: parseFloat(position) * 1000,  // Convert seconds to milliseconds
                id: trackID,
                popularity: parseInt(popularity)
            },
            isPlaying: playerState === 'playing',
            shuffling: shuffling === 'true',
            repeating: repeating === 'true'
        };
    } catch (error) {
        console.error('Error getting playback state:', error);
        return { running: false, error: error.message };
    }
}

/**
 * Control Spotify playback
 */
async function controlPlayback(action) {
    try {
        let script = '';

        switch (action) {
            case 'play':
                script = 'tell application "Spotify" to play';
                break;
            case 'pause':
                script = 'tell application "Spotify" to pause';
                break;
            case 'playpause':
                script = 'tell application "Spotify" to playpause';
                break;
            case 'next':
                script = 'tell application "Spotify" to next track';
                break;
            case 'previous':
                script = 'tell application "Spotify" to previous track';
                break;
            default:
                throw new Error('Invalid action');
        }

        await runAppleScript(script);
        return { success: true };
    } catch (error) {
        console.error('Error controlling playback:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch news from NOS.nl RSS feed
 */
async function fetchNOSNews() {
    try {
        const response = await fetch('https://feeds.nos.nl/nosnieuwsalgemeen');
        const xmlText = await response.text();

        // Simple XML parsing for RSS items
        const items = [];
        const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xmlText)) !== null) {
            // Decode HTML entities
            let title = match[1]
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');

            items.push(title);
        }

        return items.slice(0, 15); // Return top 15 headlines
    } catch (error) {
        console.error('Error fetching NOS news:', error);
        return ['NOS nieuws tijdelijk niet beschikbaar'];
    }
}

// API Routes

/**
 * GET /api/status
 * Returns current playback status
 */
app.get('/api/status', async (req, res) => {
    const state = await getPlaybackState();
    res.json(state);
});

/**
 * POST /api/control
 * Controls playback (play, pause, next, previous)
 */
app.post('/api/control', async (req, res) => {
    const { action } = req.body;
    const result = await controlPlayback(action);
    res.json(result);
});

/**
 * GET /api/info
 * Returns server information
 */
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Spotify Local Server',
        version: '1.0.0',
        platform: process.platform
    });
});

/**
 * GET /api/news
 * Returns latest news from NOS.nl
 */
app.get('/api/news', async (req, res) => {
    const news = await fetchNOSNews();
    res.json({ news });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🎵 Spotify Local Server');
    console.log('========================');
    console.log(`Server running on port ${PORT}`);
    console.log('\nAccess from your iPad:');

    // Get local IP addresses
    const os = require('os');
    const interfaces = os.networkInterfaces();

    Object.keys(interfaces).forEach(ifname => {
        interfaces[ifname].forEach(iface => {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`  http://${iface.address}:${PORT}`);
            }
        });
    });

    console.log('\nLocal access:');
    console.log(`  http://localhost:${PORT}`);
    console.log('\nPress Ctrl+C to stop\n');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n\nShutting down server...');
    process.exit(0);
});
