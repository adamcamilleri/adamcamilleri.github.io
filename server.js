/**
 * Local development server – runs the full Handoff stack (frontend + API) in one process.
 * Use for: Docker, or `npm run dev` for local development without Vercel.
 * Production: Vercel serves the API; this file is not used.
 */
const express = require('express');
const path = require('path');

const chatHandler = require('./api/chat.js');
const deployHandler = require('./api/deploy.js');
const healthHandler = require('./api/health.js');
const soundcloudDailyHandler = require('./api/soundcloud-daily.js');
const songdleStreamHandler = require('./api/songdle-stream.js');
const songdleSongsHandler = require('./api/songdle-songs.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '500kb' }));
app.use(express.static(path.join(__dirname)));

app.all('/api/chat', (req, res) => chatHandler(req, res));
app.all('/api/deploy', (req, res) => deployHandler(req, res));
app.get('/api/health', (req, res) => healthHandler(req, res));
app.get('/api/soundcloud-daily', (req, res) => soundcloudDailyHandler(req, res));
app.get('/api/songdle-stream', (req, res) => songdleStreamHandler(req, res));
app.get('/api/songdle-songs', (req, res) => songdleSongsHandler(req, res));

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Handoff dev server: http://localhost:${PORT}`);
    console.log(`  Portfolio:  http://localhost:${PORT}/`);
    console.log(`  Handoff:    http://localhost:${PORT}/projects/handoff/`);
  });
}

module.exports = { app };
