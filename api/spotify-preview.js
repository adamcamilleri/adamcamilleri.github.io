/**
 * Extracts a Spotify track preview URL by scraping the public embed page.
 * No API key or OAuth required.
 * GET /api/spotify-preview?trackId=SPOTIFY_TRACK_ID
 * Returns: { previewUrl: "https://p.scdn.co/..." }
 *      or: { error: "preview_not_found" | "spotify_disabled" | "trackId required" }
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (process.env.SPOTIFY_ENABLED !== 'true') {
    return res.status(503).json({ error: 'spotify_disabled' });
  }

  const trackId = (req.query && req.query.trackId) || null;
  if (!trackId || !/^[a-zA-Z0-9]+$/.test(trackId)) {
    return res.status(400).json({ error: 'trackId required' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let embedRes;
    try {
      embedRes = await fetch(
        `https://open.spotify.com/embed/track/${encodeURIComponent(trackId)}`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!embedRes.ok) {
      console.error(`Spotify embed fetch failed: ${embedRes.status} for trackId: ${trackId}`);
      return res.status(502).json({ error: 'preview_not_found' });
    }

    const html = await embedRes.text();

    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) {
      console.error(`Spotify: __NEXT_DATA__ not found for trackId: ${trackId}`);
      return res.status(502).json({ error: 'preview_not_found' });
    }

    let data;
    try {
      data = JSON.parse(match[1]);
    } catch (e) {
      console.error(`Spotify: failed to parse __NEXT_DATA__ JSON for trackId: ${trackId}`);
      return res.status(502).json({ error: 'preview_not_found' });
    }

    const previewUrl =
      data &&
      data.props &&
      data.props.pageProps &&
      data.props.pageProps.state &&
      data.props.pageProps.state.data &&
      data.props.pageProps.state.data.entity &&
      data.props.pageProps.state.data.entity.audioPreview &&
      data.props.pageProps.state.data.entity.audioPreview.url;

    if (!previewUrl) {
      console.error(`Spotify: audioPreview.url missing for trackId: ${trackId}`);
      return res.status(404).json({ error: 'preview_not_found' });
    }

    return res.status(200).json({ previewUrl });
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`Spotify: fetch timeout for trackId: ${trackId}`);
      return res.status(504).json({ error: 'timeout' });
    }
    console.error(`Spotify preview error for trackId ${trackId}:`, err.message);
    return res.status(500).json({ error: 'preview_not_found' });
  }
};
