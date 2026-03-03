/**
 * Stream proxy for Songdle: fetches today's track preview from SoundCloud server-side
 * and sends it to the client so the browser doesn't hit CORS/blocked direct URLs.
 * GET /api/songdle-stream?date=YYYY-MM-DD
 */
const soundcloudDaily = require('./soundcloud-daily.js');
const getDailyTrackData = soundcloudDaily.getDailyTrackData;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const dateStr = (req.query && req.query.date) || new Date().toISOString().slice(0, 10);
    const data = await getDailyTrackData({ date: dateStr });
    if (!data || !data.daily || !data.daily.preview_url) {
      res.status(404).end();
      return;
    }

    const streamRes = await fetch(data.daily.preview_url, {
      headers: data.token ? { Authorization: 'OAuth ' + data.token } : {},
    });

    if (!streamRes.ok) {
      res.status(502).end();
      return;
    }

    const contentType = streamRes.headers.get('content-type') || 'audio/mpeg';
    const buf = await streamRes.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buf.byteLength);
    res.end(Buffer.from(buf));
  } catch (err) {
    console.error('Songdle stream error:', err);
    if (!res.headersSent) res.status(500).end();
  }
};
