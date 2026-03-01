/**
 * Save a design to MongoDB (NoSQL).
 * POST /api/save-design
 * Body: { html: string, name?: string }
 */
const ALLOWED_ORIGINS = [
  'https://adamcamilleri.github.io',
  'https://www.adamcamilleri.github.io',
  'https://adamcamilleri.com',
  'https://www.adamcamilleri.com',
  'https://adamcamilleri-github-io.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
];

function corsHeaders(req) {
  const origin = req.headers.origin || req.headers.Origin;
  const allowed = ALLOWED_ORIGINS.some(o => origin === o) ||
    (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || origin.endsWith('.vercel.app') || origin.endsWith('.github.io')));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };
}

module.exports = async function handler(req, res) {
  Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { checkApiKey } = require('./_lib/api-key.js');
  const keyCheck = checkApiKey(req);
  if (!keyCheck.ok) return res.status(401).json({ error: keyCheck.error });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  let validated;
  try {
    const { validateSaveDesignPayload } = require('../dist/validation.js');
    validated = validateSaveDesignPayload(body);
  } catch {
    const { html: h, name: n } = body;
    if (!h || typeof h !== 'string') validated = { valid: false, error: 'Missing or invalid "html"' };
    else if (h.length > 500000) validated = { valid: false, error: 'HTML too large' };
    else validated = { valid: true, html: h, name: (n && String(n).trim()) || 'Untitled design' };
  }
  if (!validated.valid) {
    const status = validated.error?.includes('too large') ? 413 : 400;
    return res.status(status).json({ error: validated.error });
  }
  const { html, name } = validated;

  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ error: 'MONGODB_URI not configured' });
  }

  try {
    const { getDb } = require('./_lib/mongodb.js');
    const db = await getDb();
    const doc = {
      html,
      name,
      createdAt: new Date(),
    };
    const result = await db.collection('designs').insertOne(doc);
    return res.status(201).json({
      id: result.insertedId.toString(),
      name: doc.name,
      createdAt: doc.createdAt.toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};
