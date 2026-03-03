/**
 * Spotify Daily – fetches playlist tracks and returns today's song for the game.
 * Uses Client Credentials flow (no user auth).
 *
 * Env vars: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_PLAYLIST_ID
 */

const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID || '';

async function getAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
  }
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Spotify token failed: ' + txt);
  }
  const data = await res.json();
  return data.access_token;
}

async function getPlaylistTracks(token, playlistId) {
  const tracks = [];
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
  while (url) {
    const res = await fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Playlist fetch failed: ' + txt);
    }
    const data = await res.json();
    for (const item of data.items || []) {
      const t = item.track;
      if (!t || t.type !== 'track') continue;
      if (!t.preview_url) continue; // Skip tracks without preview
      tracks.push({
        id: t.id,
        name: t.name,
        artist: (t.artists || []).map((a) => a.name).join(', '),
        preview_url: t.preview_url,
      });
    }
    url = data.next || null;
  }
  return tracks;
}

function getDailyIndex(total, dateStr) {
  const hash = dateStr.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  return hash % total;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const playlistId = PLAYLIST_ID || req.query.playlist;
    if (!playlistId) {
      return res.status(400).json({
        error: 'Missing playlist. Set SPOTIFY_PLAYLIST_ID or use ?playlist=xxx',
      });
    }

    const token = await getAccessToken();
    const tracks = await getPlaylistTracks(token, playlistId);
    if (tracks.length === 0) {
      return res.status(404).json({
        error: 'No tracks with previews in this playlist',
      });
    }

    const dateStr = req.query.date || new Date().toISOString().slice(0, 10);
    const idx = getDailyIndex(tracks.length, dateStr);
    const daily = tracks[idx];

    return res.status(200).json({
      date: dateStr,
      song: {
        id: daily.id,
        name: daily.name,
        artist: daily.artist,
        preview_url: daily.preview_url,
      },
      total: tracks.length,
    });
  } catch (err) {
    console.error('Spotify daily error:', err);
    return res.status(500).json({
      error: err.message || 'Spotify API error',
    });
  }
};
