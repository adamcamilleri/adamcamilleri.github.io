/**
 * Songdle – daily song API.
 * Returns today's song for the game from the static songs.json pool.
 * GET /api/soundcloud-daily?date=YYYY-MM-DD&genre=all|rock|hip-hop
 */

const path = require('path');
const fs = require('fs');

const SONGS_PATH = path.join(__dirname, '..', 'projects', 'songdle', 'songs.json');

function loadSongsFromFile(genre) {
  try {
    const raw = fs.readFileSync(SONGS_PATH, 'utf8');
    const tracks = JSON.parse(raw);
    // Accept songs that have either an iTunes preview URL or a Spotify ID
    const all = Array.isArray(tracks) ? tracks.filter((t) => t.preview_url || t.spotifyId) : [];
    if (!genre || genre === 'all') return all;
    return all.filter((t) => t.genre === genre);
  } catch {
    return [];
  }
}

function getDailyIndex(total, dateStr) {
  const hash = dateStr.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  return hash % total;
}

/** Get today's track. Used by JSON API and stream proxy. */
async function getDailyTrackData(options) {
  const dateStr = (options && options.date) || new Date().toISOString().slice(0, 10);
  const genre   = (options && options.genre) || 'all';

  const tracks = loadSongsFromFile(genre);
  if (tracks.length === 0) return null;

  // Salt the date with genre so each genre produces its own daily song
  const saltedDate = dateStr + '_' + genre;
  const idx   = getDailyIndex(tracks.length, saltedDate);
  const daily = tracks[idx];
  return { dateStr, daily, total: tracks.length };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const q     = req.query || {};
    const genre = q.genre || 'all';
    const data  = await getDailyTrackData({ date: q.date, genre });
    if (!data) {
      return res.status(404).json({ error: 'No songs found in songs.json' });
    }
    const { dateStr, daily, total } = data;
    return res.status(200).json({
      date: dateStr,
      genre,
      song: {
        id:          daily.id,
        name:        daily.name,
        artist:      daily.artist,
        preview_url: daily.preview_url,
        spotifyId:   daily.spotifyId || null,
        youtubeId:   daily.youtubeId || null,
        startOffset: daily.startOffset || 0,
      },
      total,
    });
  } catch (err) {
    console.error('Songdle API error:', err);
    return res.status(500).json({ error: err.message || 'API error' });
  }
};

module.exports.getDailyTrackData = getDailyTrackData;
