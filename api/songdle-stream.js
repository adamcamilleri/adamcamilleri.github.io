/**
 * Stream proxy for Songdle: fetches the iTunes preview URL server-side
 * and pipes it to the client, bypassing browser CORS restrictions.
 * GET /api/songdle-stream?date=YYYY-MM-DD&genre=all|rock|hip-hop
 * GET /api/songdle-stream?id=SONG_ID   (unlimited mode — specific song)
 */
const path = require('path');
const fs   = require('fs');
const { getDailyTrackData } = require('./soundcloud-daily.js');

const SONGS_PATH = path.join(__dirname, '..', 'projects', 'songdle', 'songs.json');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET')     return res.status(405).end();

  try {
    let dateStr  = (req.query && req.query.date)  || null;
    let genreStr = (req.query && req.query.genre) || null;
    let idStr    = (req.query && req.query.id)    || null;

    if ((!dateStr || !genreStr || !idStr) && req.url) {
      try {
        const u = new URL(req.url, 'http://localhost');
        if (!dateStr)  dateStr  = u.searchParams.get('date');
        if (!genreStr) genreStr = u.searchParams.get('genre');
        if (!idStr)    idStr    = u.searchParams.get('id');
      } catch (e) {}
    }

    let streamUrl;

    if (idStr) {
      // Unlimited mode: look up a specific song by ID
      const raw  = fs.readFileSync(SONGS_PATH, 'utf8');
      const songs = JSON.parse(raw);
      const song  = Array.isArray(songs) ? songs.find((s) => String(s.id) === String(idStr)) : null;
      if (!song || !song.preview_url) {
        res.status(404).end();
        return;
      }
      streamUrl = song.preview_url;
    } else {
      // Daily mode: pick today's song by date + genre
      dateStr  = dateStr  || new Date().toISOString().slice(0, 10);
      genreStr = genreStr || 'all';
      const data = await getDailyTrackData({ date: dateStr, genre: genreStr });
      if (!data || !data.daily || !data.daily.preview_url) {
        res.status(404).end();
        return;
      }
      streamUrl = data.daily.preview_url;
    }

    const headers = {
      'Accept':     'audio/mpeg,audio/*,*/*',
      'User-Agent': 'Songdle/1.0',
    };

    let streamRes = await fetch(streamUrl, { redirect: 'manual', headers });

    if (streamRes.status >= 300 && streamRes.status < 400 && streamRes.headers.get('location')) {
      streamRes = await fetch(streamRes.headers.get('location'), { redirect: 'follow', headers });
    }

    if (!streamRes.ok) {
      console.error('Songdle stream fetch failed:', streamRes.status);
      res.status(502).end();
      return;
    }

    const contentType = streamRes.headers.get('content-type') || 'audio/mpeg';
    const buf = await streamRes.arrayBuffer();
    if (buf.byteLength === 0) { res.status(502).end(); return; }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buf.byteLength);
    res.end(Buffer.from(buf));
  } catch (err) {
    console.error('Songdle stream error:', err);
    if (!res.headersSent) res.status(500).end();
  }
};
