/**
 * Get a single design by ID from MongoDB.
 * GET /api/get-design?id=...
 */
module.exports = async function handler(req, res) {
  const { corsHeaders } = require('./_lib/cors.js');
  Object.entries(corsHeaders(req, 'GET, OPTIONS')).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { checkApiKey } = require('./_lib/api-key.js');
  const keyCheck = checkApiKey(req);
  if (!keyCheck.ok) return res.status(401).json({ error: keyCheck.error });

  const id = req.query?.id ?? (typeof req.url === 'string' && req.url ? new URL(req.url, 'http://localhost').searchParams.get('id') : null);
  if (!id) return res.status(400).json({ error: 'Missing id query parameter' });

  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ error: 'MONGODB_URI not configured' });
  }

  try {
    const { ObjectId } = require('mongodb');
    const { getDb } = require('./_lib/mongodb.js');
    const db = await getDb();
    const doc = await db.collection('designs').findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: 'Design not found' });
    return res.status(200).json({ html: doc.html, name: doc.name, createdAt: doc.createdAt.toISOString() });
  } catch (err) {
    if (err.name === 'BSONError') return res.status(400).json({ error: 'Invalid id' });
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};
