/**
 * Stream proxy for Songdle: fetches today's track preview from SoundCloud server-side
 * and sends it to the client so the browser doesn't hit CORS/blocked direct URLs.
 * GET /api/songdle-stream?date=YYYY-MM-DD&genre=all|rock|hip-hop
 * GET /api/songdle-stream?id=SONG_ID  (unlimited mode — stream a specific song)
 */
const path = require('path');
const fs = require('fs');
const soundcloudDaily = require('./soundcloud-daily.js');
const getDailyTrackData = soundcloudDaily.getDailyTrackData;
const getToken = soundcloudDaily.getToken;

const SONGS_PATH = path.join(__dirname, '..', 'projects', 'songdle', 'songs.json');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    let dateStr = (req.query && req.query.date) || null;
    let genreStr = (req.query && req.query.genre) || null;
    let idStr = (req.query && req.query.id) || null;

    if ((!dateStr || !genreStr || !idStr) && req.url) {
      try {
        const u = new URL(req.url, 'http://localhost');
        if (!dateStr) dateStr = u.searchParams.get('date');
        if (!genreStr) genreStr = u.searchParams.get('genre');
        if (!idStr) idStr = u.searchParams.get('id');
      } catch (e) {}
    }

    let streamUrl;

    if (idStr) {
      // Unlimited mode: look up a specific song by ID
      const raw = fs.readFileSync(SONGS_PATH, 'utf8');
      const songs = JSON.parse(raw);
      const song = Array.isArray(songs) ? songs.find((s) => String(s.id) === String(idStr)) : null;
      if (!song || !song.preview_url) {
        res.status(404).end();
        return;
      }
      streamUrl = song.preview_url;
    } else {
      // Daily mode: pick today's song by date + genre
      dateStr = dateStr || new Date().toISOString().slice(0, 10);
      genreStr = genreStr || 'all';
      const data = await getDailyTrackData({ date: dateStr, genre: genreStr });
      if (!data || !data.daily || !data.daily.preview_url) {
        res.status(404).end();
        return;
      }

      let token = data.token;
      if (!token && getToken) {
        try { token = await getToken(); } catch (e) {
          console.error('Songdle stream: could not get token', e.message);
        }
      }

      streamUrl = data.daily.preview_url;
      const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
      const isSoundCloud = streamUrl && (streamUrl.includes('soundcloud.com') || streamUrl.includes('sndcdn.com'));
      if (clientId && isSoundCloud && streamUrl.indexOf('client_id=') === -1) {
        streamUrl = streamUrl + (streamUrl.indexOf('?') >= 0 ? '&' : '?') + 'client_id=' + encodeURIComponent(clientId);
      }
    }

    const authHeaders = {
      'Accept': 'audio/mpeg,audio/*,*/*',
      'User-Agent': 'Songdle/1.0 (https://github.com/adamcamilleri/adamcamilleri.github.io)',
    };

    let streamRes = await fetch(streamUrl, { redirect: 'manual', headers: authHeaders });

    if (streamRes.status >= 300 && streamRes.status < 400 && streamRes.headers.get('location')) {
      const location = streamRes.headers.get('location');
      streamRes = await fetch(location, { redirect: 'follow', headers: authHeaders });
    }

    if (!streamRes.ok) {
      const errBody = await streamRes.text().catch(() => '');
      console.error('Songdle stream fetch failed:', streamRes.status, errBody.slice(0, 200));
      res.status(502).end();
      return;
    }

    const contentType = streamRes.headers.get('content-type') || 'audio/mpeg';
    const buf = await streamRes.arrayBuffer();
    if (buf.byteLength === 0) {
      res.status(502).end();
      return;
    }
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buf.byteLength);
    res.end(Buffer.from(buf));
  } catch (err) {
    console.error('Songdle stream error:', err);
    if (!res.headersSent) res.status(500).end();
  }
};
