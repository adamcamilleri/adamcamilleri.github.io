/**
 * Songdle – SoundCloud edition.
 * Returns today's song with stream URL for the game.
 * Uses Client Credentials. Requires SOUNDCLOUD_CLIENT_ID, SOUNDCLOUD_CLIENT_SECRET.
 * Optional: SOUNDCLOUD_PLAYLIST_ID or ?playlist=xxx – can be a numeric ID or a full playlist URL.
 * Fallback: reads from projects/songdle/songs.json (static list with stream URLs).
 */

const path = require('path');
const fs = require('fs');

const SONGS_PATH = path.join(__dirname, '..', 'projects', 'songdle', 'songs.json');

function isNumericId(value) {
  return /^\d+$/.test(String(value).trim());
}

/** If playlist param is a URL or path, resolve it to a numeric playlist ID. */
async function resolvePlaylistId(token, playlistIdOrUrl) {
  const raw = String(playlistIdOrUrl).trim();
  if (isNumericId(raw)) return raw;
  let url = raw;
  if (!url.startsWith('http')) url = 'https://soundcloud.com/' + url.replace(/^\/*/, '');
  url = url.split('?')[0];
  const res = await fetch(
    'https://api.soundcloud.com/resolve?url=' + encodeURIComponent(url),
    { headers: { Authorization: 'OAuth ' + token } }
  );
  if (!res.ok) throw new Error('Resolve failed: ' + res.status);
  const resource = await res.json();
  if (resource.kind === 'playlist' && resource.id) return String(resource.id);
  throw new Error('URL did not resolve to a playlist');
}

async function getToken() {
  const id = process.env.SOUNDCLOUD_CLIENT_ID;
  const secret = process.env.SOUNDCLOUD_CLIENT_SECRET;
  if (!id || !secret) throw new Error('Missing SOUNDCLOUD_CLIENT_ID or SOUNDCLOUD_CLIENT_SECRET');
  const res = await fetch('https://secure.soundcloud.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(id + ':' + secret).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data.access_token;
}

async function getPlaylistTracks(token, playlistId) {
  const res = await fetch(`https://api.soundcloud.com/playlists/${playlistId}?show_tracks=true`, {
    headers: { Authorization: 'OAuth ' + token },
  });
  if (!res.ok) throw new Error('Playlist fetch failed: ' + res.status);
  const playlist = await res.json();
  const items = playlist.tracks || [];
  const tracks = [];
  for (const t of items) {
    if (!t || !t.id) continue;
    const streamRes = await fetch(`https://api.soundcloud.com/tracks/${t.id}/streams`, {
      headers: { Authorization: 'OAuth ' + token },
    });
    if (!streamRes.ok) continue;
    const streams = await streamRes.json();
    const url = streams.preview_mp3_128_url || streams.http_mp3_128_url;
    if (url) {
      tracks.push({
        id: String(t.id),
        name: t.title || t.name || 'Unknown',
        artist: t.user?.username || t.user?.full_name || 'Unknown',
        preview_url: url,
      });
    }
  }
  return tracks;
}

function loadSongsFromFile() {
  try {
    const raw = fs.readFileSync(SONGS_PATH, 'utf8');
    const tracks = JSON.parse(raw);
    return Array.isArray(tracks) ? tracks.filter((t) => t.preview_url) : [];
  } catch {
    return [];
  }
}

function getDailyIndex(total, dateStr) {
  const hash = dateStr.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  return hash % total;
}

/** Shared: get today's track (and optional token for streaming). Used by JSON API and stream proxy. */
async function getDailyTrackData(options) {
  const dateStr = (options && options.date) || new Date().toISOString().slice(0, 10);
  const playlistId = (options && options.playlistId) || process.env.SOUNDCLOUD_PLAYLIST_ID;
  let tracks = [];
  let token = null;

  if (playlistId) {
    try {
      token = await getToken();
      const id = await resolvePlaylistId(token, playlistId);
      tracks = await getPlaylistTracks(token, id);
    } catch (err) {
      console.error('SoundCloud API error:', err);
      tracks = loadSongsFromFile();
    }
  }
  if (tracks.length === 0) tracks = loadSongsFromFile();
  if (tracks.length === 0) return null;

  const idx = getDailyIndex(tracks.length, dateStr);
  const daily = tracks[idx];
  return { dateStr, daily, token, total: tracks.length };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const q = req.query || {};
    const data = await getDailyTrackData({ date: q.date, playlistId: q.playlist });
    if (!data) {
      return res.status(404).json({
        error: 'No songs. Add SOUNDCLOUD_PLAYLIST_ID or populate songs.json (see README)',
      });
    }
    const { dateStr, daily, total } = data;
    return res.status(200).json({
      date: dateStr,
      song: {
        id: daily.id,
        name: daily.name,
        artist: daily.artist,
        preview_url: daily.preview_url,
      },
      total,
    });
  } catch (err) {
    console.error('Songdle API error:', err);
    return res.status(500).json({ error: err.message || 'API error' });
  }
};

module.exports.getDailyTrackData = getDailyTrackData;
module.exports.getToken = getToken;
