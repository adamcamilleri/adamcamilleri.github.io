# Songless

A daily game where you guess the song from short audio clips. Wrong guess = longer clip.

Uses Spotify's 30-second preview API. Same song for everyone each day.

## Setup

### 1. Spotify App (you did this)

You have Client ID and Client Secret.

### 2. Create a Spotify playlist

1. In Spotify, create a playlist
2. Add songs you want in the game (only tracks with previews will be used)
3. Copy the playlist ID from the share link: `spotify.com/playlist/`**`xxx123`** ← that part

### 3. Environment variables

In your **Vercel** project (or `.env.local` for local):

| Variable | Value |
|----------|-------|
| `SPOTIFY_CLIENT_ID` | Your Client ID |
| `SPOTIFY_CLIENT_SECRET` | Your Client Secret |
| `SPOTIFY_PLAYLIST_ID` | Your playlist ID |

Or pass playlist in the URL: `/api/spotify-daily?playlist=YOUR_PLAYLIST_ID`

### 4. Run locally

```bash
# From repo root
npx vercel dev
```

Open http://localhost:3000/projects/songless/

### 5. Deploy

Deploy to Vercel (same repo). The API at `/api/spotify-daily` will work on your Vercel domain.

**If the game is on GitHub Pages** (adamcamilleri.github.io), add this before the script in `index.html`:

```html
<script>window.SONGLESS_API = 'https://your-vercel-project.vercel.app';</script>
<script src="script.js"></script>
```

Replace with your actual Vercel URL.
