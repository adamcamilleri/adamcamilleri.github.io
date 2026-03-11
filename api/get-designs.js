/**
 * List saved designs from MongoDB.
 * GET /api/get-designs
 */
module.exports = async function handler(req, res) {
  const { corsHeaders } = require('./_lib/cors.js');
  Object.entries(corsHeaders(req, 'GET, OPTIONS')).forEach(([k, v]) => res.setHeader(k, v));

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
