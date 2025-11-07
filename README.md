# Spotify Player for iOS 9 (Local Version)

A web-based Spotify player optimized for old iPads running iOS 9. This displays what's currently playing on **your Mac's Spotify** and lets you control it remotely - just like macOS's Now Playing widget.

## Features

- 🎵 Display currently playing track from your Mac
- 🎨 Show album artwork
- ⏯️ Play/Pause control
- ⏭️ Skip to next track
- ⏮️ Skip to previous track
- 📱 Optimized for landscape mode on iPad
- 🔄 Real-time updates (1-second polling)
- ✨ iOS 9 Safari compatible (ES5 JavaScript)
- 🔒 No Spotify API keys needed - works locally
- 🏠 Works on your local network (no internet required)

## How It Works

1. A lightweight Node.js server runs on your Mac
2. The server uses AppleScript to read/control Spotify on your Mac
3. Your iPad connects to this local server over your home WiFi
4. The iPad displays what's playing and sends control commands

**This is different from the Spotify Web API version** - it shows what's playing specifically on your computer, not your Spotify account in general.

## Requirements

- Mac with Spotify installed
- Node.js installed on your Mac (v12 or later)
- iPad with iOS 9+ or any web browser
- Both devices on the same WiFi network

## Setup Instructions

### 1. Install Node.js (if not already installed)

Download and install from [nodejs.org](https://nodejs.org/)

Or use Homebrew:
```bash
brew install node
```

Verify installation:
```bash
node --version
npm --version
```

### 2. Install and Start the Server

Open Terminal on your Mac and navigate to this folder:

```bash
cd /path/to/Spotify
```

Install dependencies:
```bash
npm install
```

Start the server:
```bash
npm start
```

You should see output like:
```
🎵 Spotify Local Server
========================
Server running on port 3000

Access from your iPad:
  http://192.168.1.123:3000

Local access:
  http://localhost:3000

Press Ctrl+C to stop
```

**Keep this Terminal window open** - the server needs to stay running.

### 3. Connect from iPad

1. Make sure Spotify is playing something on your Mac
2. On your iPad, open Safari
3. Go to the URL shown in the Terminal (e.g., `http://192.168.1.123:3000`)
4. You should see a connection screen
5. The server URL should already be filled in
6. Tap "Connect"
7. You should now see what's playing!

### 4. Optional: Add to Home Screen

For a full-screen app experience:
1. In Safari, tap the Share button
2. Tap "Add to Home Screen"
3. Name it "Spotify Player"
4. Launch from home screen anytime

## Usage

### Starting the Server

Every time you want to use this:
1. Open Terminal on your Mac
2. Navigate to this folder: `cd /path/to/Spotify`
3. Run: `npm start`
4. Keep Terminal open while using

### Using the Player

- Start playing music in Spotify on your Mac
- The iPad will automatically show what's playing
- Use the controls to play/pause, skip tracks
- Progress bar updates in real-time
- Album art displays automatically

### Stopping the Server

Press `Ctrl+C` in the Terminal window to stop the server.

## Troubleshooting

### "Cannot connect to server"

- Make sure the server is running on your Mac (check Terminal)
- Verify both devices are on the same WiFi network
- Try accessing `http://localhost:3000` on your Mac's browser to test the server
- Check your Mac's firewall settings (allow Node.js connections)

### "No music playing" message

- Start playing something in Spotify on your Mac first
- Make sure Spotify is actually running on your Mac
- Try pausing and playing again

### Controls don't work

- Spotify must be running on your Mac
- Check Terminal for error messages
- Try restarting the Spotify app on your Mac

### Album art not showing

- Some tracks may not have album artwork
- Check internet connection (album art comes from Spotify's servers)

### Server won't start

- Make sure port 3000 is not already in use
- Try changing the port in `server.js` (line 9):
  ```javascript
  const PORT = 3001; // or any other port
  ```

### Permission errors with AppleScript

On first use, macOS may ask for permission for Terminal/Node to control Spotify. Click "OK" to allow this.

## Technical Details

### Architecture

- **Server**: Node.js with Express
- **Spotify Control**: AppleScript (macOS native automation)
- **Client**: Pure HTML/CSS/JavaScript (ES5 for iOS 9)
- **Communication**: REST API over local network
- **Update frequency**: 1 second polling

### Files

- `server.js` - Node.js server with AppleScript integration
- `package.json` - Node.js dependencies
- `index.html` - Web interface structure
- `style.css` - Styling and layout (landscape optimized)
- `app.js` - Client-side logic (ES5 compatible)
- `README.md` - This file

### API Endpoints

The server provides these endpoints:

- `GET /api/status` - Get current playback state
- `POST /api/control` - Control playback (play, pause, next, previous)
- `GET /api/info` - Server information

### Supported Actions

- `playpause` - Toggle play/pause
- `play` - Resume playback
- `pause` - Pause playback
- `next` - Skip to next track
- `previous` - Skip to previous track

## Advanced Usage

### Running on Different Port

Edit `server.js` line 9:
```javascript
const PORT = 3001; // Change to any available port
```

### Auto-start on Mac Boot (Optional)

You can create a Launch Agent to auto-start the server:

1. Create file: `~/Library/LaunchAgents/com.spotify.player.plist`
2. Add configuration (adjust paths):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.spotify.player</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/Spotify/server.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```
3. Load it: `launchctl load ~/Library/LaunchAgents/com.spotify.player.plist`

### Keeping Server Running

Use a tool like `pm2` to keep the server running:
```bash
npm install -g pm2
pm2 start server.js --name spotify-player
pm2 save
pm2 startup
```

## Limitations

- Only works with Spotify on macOS (uses AppleScript)
- Requires Mac and iPad on same network
- Cannot control volume through this interface
- Seek/scrubbing not implemented (can be added if needed)
- Server must be running on Mac for iPad to work

## Compatibility

### Server (Mac)
- macOS 10.9+
- Node.js 12+
- Spotify desktop app

### Client (iPad)
- iOS 9+ Safari (primary target)
- Any modern browser on any device

## Windows/Linux Support

This version uses AppleScript and only works on macOS. For Windows/Linux, you would need to:
- Replace AppleScript with platform-specific Spotify control
- Windows: Use PowerShell or C# to control Spotify
- Linux: Use D-Bus to communicate with Spotify

## Security Note

The server runs without authentication since it's intended for local network use only. **Do not expose this to the internet** without adding proper authentication.

## License

Free to use and modify for personal use.

## Credits

Built for iOS 9 compatibility with ❤️

Uses AppleScript for native macOS Spotify integration.
