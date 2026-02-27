/**
 * MongoDB connection helper – caches client for serverless reuse.
 * Set MONGODB_URI in environment variables.
 */
const { MongoClient } = require('mongodb');

let cached = null;

async function getDb() {
  if (cached) return cached.db;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not configured');
  const client = new MongoClient(uri);
  await client.connect();
  cached = { client, db: client.db('handoff') };
  return cached.db;
}

module.exports = { getDb };
