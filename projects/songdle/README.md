# Songdle

A daily music guessing game. Listen to short clips and guess the song — wrong guesses unlock longer clips, up to 6 rounds.

Same song for everyone each day. Includes an Unlimited mode to play as many songs as you like.

## Song Pool

Songs are defined in `projects/songdle/songs.json`. Each entry:

```json
{ "name": "Track Title", "artist": "Artist Name", "genre": "rock", "preview_url": "https://..." }
```

Audio is streamed via the `/api/songdle-stream` proxy using iTunes preview URLs.

## Local Development

```bash
npm run dev
```

Open http://localhost:3000/projects/songdle/
