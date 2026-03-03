/**
 * Songdle API – returns today's song for the game.
 *
 * Uses static songs.json (recommended) – export your playlist once with:
 *   cd projects/songless && node export-playlist.js
 *
 * Client Credentials cannot access playlists (user resource). The export script
 * uses OAuth so you log in once and save the tracks locally.
 */

const path = require('path');
const fs = require('fs');

const SONGS_PATH = path.join(__dirname, '..', 'projects', 'songless', 'songs.json');

function getDailyIndex(total, dateStr) {
  const hash = dateStr.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  return hash % total;
}

function loadSongsFromFile() {
  try {
    const raw = fs.readFileSync(SONGS_PATH, 'utf8');
    const tracks = JSON.parse(raw);
    return Array.isArray(tracks) ? tracks : [];
  } catch {
    return [];
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const tracks = loadSongsFromFile().filter((t) => t.preview_url);
    if (tracks.length === 0) {
      return res.status(404).json({
        error: 'No songs. Run: cd projects/songless && node export-playlist.js (see README)',
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
    console.error('Songdle API error:', err);
    return res.status(500).json({
      error: err.message || 'API error',
    });
  }
};
