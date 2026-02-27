/**
 * Local development server – runs the full Handoff stack (frontend + API) in one process.
 * Use for: Docker, or `npm run dev` for local development without Vercel.
 * Production: Vercel serves the API; this file is not used.
 */
const express = require('express');
const path = require('path');

const chatHandler = require('./api/chat.js');
const deployHandler = require('./api/deploy.js');
const paymentHandler = require('./api/create-payment-link.js');
const saveDesignHandler = require('./api/save-design.js');
const getDesignsHandler = require('./api/get-designs.js');
const getDesignHandler = require('./api/get-design.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '500kb' }));
app.use(express.static(path.join(__dirname)));

app.all('/api/chat', (req, res) => chatHandler(req, res));
app.all('/api/deploy', (req, res) => deployHandler(req, res));
app.all('/api/create-payment-link', (req, res) => paymentHandler(req, res));
app.post('/api/save-design', (req, res) => saveDesignHandler(req, res));
app.get('/api/get-designs', (req, res) => getDesignsHandler(req, res));
app.get('/api/get-design', (req, res) => getDesignHandler(req, res));

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Handoff dev server: http://localhost:${PORT}`);
    console.log(`  Portfolio:  http://localhost:${PORT}/`);
    console.log(`  Handoff:    http://localhost:${PORT}/projects/handoff/`);
  });
}

module.exports = { app };
