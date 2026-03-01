/**
 * List saved designs from MongoDB.
 * GET /api/get-designs
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
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };
}

module.exports = async function handler(req, res) {
  Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { checkApiKey } = require('./_lib/api-key.js');
  const keyCheck = checkApiKey(req);
  if (!keyCheck.ok) return res.status(401).json({ error: keyCheck.error });

  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ error: 'MONGODB_URI not configured' });
  }

  try {
    const { getDb } = require('./_lib/mongodb.js');
    const db = await getDb();
    const designs = await db.collection('designs')
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .project({ _id: 1, name: 1, createdAt: 1 })
      .toArray();
    return res.status(200).json({
      designs: designs.map(d => ({
        id: d._id.toString(),
        name: d.name,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
};
