# Spotify Player for iOS 9

A web-based Spotify player optimized for old iPads running iOS 9. Control your Spotify playback with a beautiful landscape interface showing album art, track info, and playback controls.

## Features

- 🎵 Display currently playing track
- 🎨 Show album artwork
- ⏯️ Play/Pause control
- ⏭️ Skip to next track
- ⏮️ Skip to previous track
- 📱 Optimized for landscape mode on iPad
- 🔄 Real-time playback updates
- ✨ iOS 9 Safari compatible (ES5 JavaScript)

## Requirements

- Spotify Premium account (required for playback control API)
- Spotify app running on any device (phone, computer, etc.)
- iPad with iOS 9+ or any modern web browser
- Web server to host the files (can be local or online)

## Setup Instructions

### 1. Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the app details:
   - App name: "Spotify Player iOS9" (or any name)
   - App description: "Web player for iPad"
5. Accept the terms and create the app
6. Note your **Client ID**

### 2. Configure Redirect URI

1. In your Spotify app settings, click "Edit Settings"
2. Add your Redirect URI:
   - For local testing: `http://localhost:8000/index.html` or `http://localhost:8000/`
   - For hosted version: `https://yourdomain.com/index.html` or `https://yourdomain.com/`
3. Click "Add" then "Save"

### 3. Update the Code

1. Open `app.js` in a text editor
2. Replace `YOUR_SPOTIFY_CLIENT_ID` with your actual Client ID:
   ```javascript
   var CLIENT_ID = 'your_actual_client_id_here';
   ```
3. If needed, update the `REDIRECT_URI` to match your hosting setup:
   ```javascript
   var REDIRECT_URI = 'http://localhost:8000/';
   ```

### 4. Host the Application

#### Option A: Local Server (for testing)

Using Python 3:
```bash
python3 -m http.server 8000
```

Using Python 2:
```bash
python -m SimpleHTTPServer 8000
```

Using Node.js (with npx):
```bash
npx http-server -p 8000
```

Then open: `http://localhost:8000/` (or `http://YOUR_COMPUTER_IP:8000/` from iPad)

#### Option B: GitHub Pages (free hosting)

1. Create a GitHub repository
2. Upload `index.html`, `style.css`, and `app.js`
3. Go to Settings > Pages
4. Enable GitHub Pages from main branch
5. Use the provided URL as your Redirect URI in Spotify settings

#### Option C: Any Web Host

Upload the three files to any web hosting service (Netlify, Vercel, your own server, etc.)

### 5. Use the App

1. Open the hosted URL in Safari on your iPad
2. Click "Login with Spotify"
3. Authorize the app
4. Start playing music on Spotify (on any device)
5. The player will show what's currently playing and let you control it

## Usage Notes

### Important

- You need an **active Spotify playback** on any device (phone, computer, smart speaker, etc.)
- The app controls your Spotify playback, it doesn't play audio directly
- Requires Spotify Premium for API playback control

### Tips

- Rotate iPad to landscape mode for best experience
- Add to home screen for full-screen app experience:
  1. Tap Share button in Safari
  2. Tap "Add to Home Screen"
  3. Launch from home screen for app-like experience
- The player updates every 2 seconds automatically
- If controls aren't working, make sure you have an active Spotify session

### Troubleshooting

**"No active device found"**
- Start playing music on Spotify (on any device) first
- The app controls existing playback, it doesn't initiate it

**Login doesn't work**
- Check that CLIENT_ID is correct in `app.js`
- Verify Redirect URI matches exactly in Spotify Dashboard and `app.js`
- Clear browser cache and try again

**Album art not showing**
- Some tracks may not have album art
- Check internet connection

**Player not updating**
- Refresh the page
- Check if Spotify is actually playing
- Token may have expired - logout and login again

## Browser Compatibility

- iOS 9+ Safari (primary target)
- All modern browsers (Chrome, Firefox, Edge, Safari)
- Uses ES5 JavaScript for maximum compatibility

## Technical Details

- Pure HTML/CSS/JavaScript (no frameworks)
- ES5 syntax for iOS 9 compatibility
- Spotify Web API for playback control
- OAuth 2.0 Implicit Grant Flow for authentication
- Polling-based updates (2-second intervals)

## API Scopes Used

- `user-read-playback-state` - Read current playback state
- `user-modify-playback-state` - Control playback
- `user-read-currently-playing` - Read currently playing track

## Files

- `index.html` - Main HTML structure
- `style.css` - Styling and layout (landscape optimized)
- `app.js` - Application logic and Spotify API integration
- `README.md` - This file

## Limitations

- Requires active Spotify Premium subscription
- Cannot control volume (API limitation on some devices)
- Cannot seek within track (can be added if needed)
- Tokens expire after 1 hour (requires re-login)

## License

Free to use and modify for personal use.

## Credits

Built for iOS 9 compatibility with ❤️
