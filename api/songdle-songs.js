/**
 * Songdle autocomplete endpoint.
 * Returns the song list (name, artist, genre only — no preview_url) for client-side autocomplete.
 * GET /api/songdle-songs
 */
const path = require('path');
const fs = require('fs');

const SONGS_PATH = path.join(__dirname, '..', 'projects', 'songdle', 'songs.json');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const raw = fs.readFileSync(SONGS_PATH, 'utf8');
    const songs = JSON.parse(raw);
    const result = (Array.isArray(songs) ? songs : []).map((s) => ({
      id: s.id,
      name: s.name,
      artist: s.artist,
      genre: s.genre || 'other',
      spotifyId: s.spotifyId || null,
    }));
    return res.status(200).json(result);
  } catch (err) {
    console.error('Songdle songs error:', err);
    return res.status(500).json({ error: 'Failed to load songs' });
  }
};
