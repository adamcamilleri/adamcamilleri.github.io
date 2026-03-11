/**
 * Save a design to MongoDB (NoSQL).
 * POST /api/save-design
 * Body: { html: string, name?: string }
 */
module.exports = async function handler(req, res) {
  const { corsHeaders } = require('./_lib/cors.js');
  Object.entries(corsHeaders(req, 'POST, OPTIONS')).forEach(([k, v]) => res.setHeader(k, v));

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
