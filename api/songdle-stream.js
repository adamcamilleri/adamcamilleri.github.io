/**
 * Stream proxy for Songdle: fetches today's track preview from SoundCloud server-side
 * and pipes it to the client so the browser doesn't hit CORS/blocked direct URLs.
 * GET /api/songdle-stream?date=YYYY-MM-DD
 */
const { Readable } = require('stream');
const { getDailyTrackData } = require('./soundcloud-daily.js');

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
    res.setHeader('Content-Type', contentType);
    if (streamRes.headers.get('content-length')) {
      res.setHeader('Content-length', streamRes.headers.get('content-length'));
    }

    const nodeStream = Readable.fromWeb(streamRes.body);
    nodeStream.pipe(res);
  } catch (err) {
    console.error('Songdle stream error:', err);
    if (!res.headersSent) res.status(500).end();
  }
};
