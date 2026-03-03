/**
 * Enriches songs.json with Spotify track IDs by searching the Spotify Web API.
 * Requires a free Spotify developer app (no approval needed).
 *
 * Usage:
 *   SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node projects/songdle/enrich-spotify-ids.js
 *
 * Or create a .env.local file with those two vars and this script will read it.
 *
 * Only updates songs that don't already have a spotifyId.
 * Writes results back to songs.json in place.
 */

const fs = require('fs');
const path = require('path');

// ── Load env from .env.local or .env if present ──────────────────────────────
for (const name of ['.env.local', '.env']) {
  const envPath = path.join(__dirname, '../../', name);
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach((rawLine) => {
      const line = rawLine.replace(/\r$/, ''); // strip Windows CRLF
      const m = line.match(/^([A-Z_a-z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    });
    break;
  }
}

const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SONGS_PATH    = path.join(__dirname, 'songs.json');
const DELAY_MS      = 200; // between requests — well within Spotify's rate limits

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET.');
  console.error('Set them as environment variables, or add them to .env.local in the project root.');
  process.exit(1);
}

async function getToken() {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error('Token error: ' + (data.error_description || data.error || res.status));
  }
  return data.access_token;
}

async function searchTrack(token, artist, name) {
  // Try exact artist + track query first
  const q = encodeURIComponent(`track:${name} artist:${artist}`);
  const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=track&limit=3`, {
    headers: { Authorization: 'Bearer ' + token },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('token_expired');
    console.warn(`  Search HTTP ${res.status} for "${artist} – ${name}"`);
    return null;
  }
  const data = await res.json();
  const items = data && data.tracks && data.tracks.items;
  if (!items || items.length === 0) return null;

  // Prefer result whose artist name matches loosely
  const normalise = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const artistNorm = normalise(artist);
  const nameNorm   = normalise(name);

  for (const track of items) {
    const artistMatch = track.artists.some((a) => normalise(a.name) === artistNorm);
    const nameMatch   = normalise(track.name) === nameNorm;
    if (artistMatch && nameMatch) return track.id;
  }

  // Fallback: return first result if at least the artist roughly matches
  const first = items[0];
  if (first.artists.some((a) => normalise(a.name).includes(artistNorm) || artistNorm.includes(normalise(a.name)))) {
    return first.id;
  }

  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const songs = JSON.parse(fs.readFileSync(SONGS_PATH, 'utf8'));
  const toEnrich = songs.filter((s) => !s.spotifyId);
  const alreadyDone = songs.length - toEnrich.length;

  console.log(`Songs total: ${songs.length}  |  Already have spotifyId: ${alreadyDone}  |  To enrich: ${toEnrich.length}`);
  if (toEnrich.length === 0) {
    console.log('Nothing to do!');
    return;
  }

  let token = await getToken();
  console.log('Got Spotify token.\n');

  let found = 0, notFound = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    if (song.spotifyId) continue;

    process.stdout.write(`[${i + 1}/${songs.length}] ${song.artist} – ${song.name} ... `);

    let spotifyId = null;
    try {
      spotifyId = await searchTrack(token, song.artist, song.name);
      if (!spotifyId) {
        // Retry with a broader query (drop featured artists from name)
        const cleanName = song.name.replace(/\s*[\(\[].+?[\)\]]/g, '').trim();
        if (cleanName !== song.name) {
          spotifyId = await searchTrack(token, song.artist, cleanName);
        }
      }
    } catch (err) {
      if (err.message === 'token_expired') {
        console.log('\n  Token expired, refreshing...');
        token = await getToken();
        spotifyId = await searchTrack(token, song.artist, song.name);
      } else {
        console.warn('\n  Error:', err.message);
      }
    }

    if (spotifyId) {
      song.spotifyId = spotifyId;
      found++;
      console.log(`✓ ${spotifyId}`);
    } else {
      notFound++;
      console.log('✗ not found');
    }

    // Save progress after every song so partial results are kept on crash
    fs.writeFileSync(SONGS_PATH, JSON.stringify(songs, null, 2));
    await sleep(DELAY_MS);
  }

  console.log(`\nDone! Found: ${found}  |  Not found: ${notFound}`);
  console.log('songs.json updated in place.');
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
