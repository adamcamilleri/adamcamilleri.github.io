# Songdle

A daily game where you guess the song from short audio clips. Wrong guess = longer clip.

Same song for everyone each day. Uses SoundCloud stream URLs from a playlist or static `songs.json`.

## Setup

### 1. Create a SoundCloud app

1. Go to [soundcloud.com/you/apps](https://soundcloud.com/you/apps)
2. Create an app and note your **Client ID** and **Client Secret**

### 2. Configure Vercel environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `SOUNDCLOUD_CLIENT_ID` | Your Client ID |
| `SOUNDCLOUD_CLIENT_SECRET` | Your Client Secret |
| `SOUNDCLOUD_PLAYLIST_ID` | (Optional) Playlist **ID** (numeric) or full **playlist URL** – the game will use its tracks as the daily pool |

**Important:** Never commit these to git. Use Vercel’s env vars only.

### 3. Set your playlist (optional)

If you want to use a SoundCloud playlist, set `SOUNDCLOUD_PLAYLIST_ID` in Vercel to either:

- The **full playlist URL**, e.g. `https://soundcloud.com/user-241515664/sets/hip-hop-r-b-hits-2013`  
- Or the **numeric playlist ID** (if you already have it)

### 4. Fallback: static songs.json

If no playlist is configured, the API reads `projects/songdle/songs.json`. Add entries like:

```json
[
  { "id": "1", "name": "Track Title", "artist": "Artist Name", "preview_url": "https://..." },
  ...
]
```

You can export tracks from a playlist once and save them to this file, or maintain the list manually. Put the file at `projects/songdle/songs.json`.

## Run locally

```bash
# Set env vars (PowerShell)
$env:SOUNDCLOUD_CLIENT_ID = "your_client_id"
$env:SOUNDCLOUD_CLIENT_SECRET = "your_client_secret"
$env:SOUNDCLOUD_PLAYLIST_ID = "optional_playlist_id"

npx vercel dev
```

Open http://localhost:3000/projects/songdle/

## GitHub Pages

If the game is on GitHub Pages, set the API URL in `index.html`:

```html
<script>window.SONGDLE_API = 'https://adamcamilleri-github-io.vercel.app';</script>
```
