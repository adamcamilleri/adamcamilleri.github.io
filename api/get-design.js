/**
 * Get a single design by ID from MongoDB.
 * GET /api/get-design?id=...
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

module.exports = async function handler(req, res) {
  Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id = req.query?.id ?? (typeof req.url === 'string' && req.url ? new URL(req.url, 'http://localhost').searchParams.get('id') : null);
  if (!id) return res.status(400).json({ error: 'Missing id query parameter' });

  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ error: 'MONGODB_URI not configured' });
  }

  try {
    const { ObjectId } = require('mongodb');
    const { getDb } = require('./lib/mongodb.js');
    const db = await getDb();
    const doc = await db.collection('designs').findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: 'Design not found' });
    return res.status(200).json({ html: doc.html, name: doc.name, createdAt: doc.createdAt.toISOString() });
  } catch (err) {
    if (err.name === 'BSONError') return res.status(400).json({ error: 'Invalid id' });
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};
