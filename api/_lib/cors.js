/**
 * Shared CORS utility — single source of truth for all API handlers.
 * SEC-03: Consolidates duplicated CORS logic that was spread across 6 handler files.
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

/**
 * Returns CORS response headers for the given request.
 * @param {object} req - Vercel/Node HTTP request object
 * @param {string} [allowedMethods='POST, OPTIONS'] - value for Access-Control-Allow-Methods
 * @returns {object} Headers object to apply via res.setHeader()
 */
function corsHeaders(req, allowedMethods) {
  const origin = req.headers.origin || req.headers.Origin;
  const allowed =
    ALLOWED_ORIGINS.some(
      (o) =>
        origin &&
        (origin === o ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:'))
    ) ||
    (origin && (origin.endsWith('.vercel.app') || origin.endsWith('.github.io')));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': allowedMethods || 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  };
}

module.exports = { corsHeaders, ALLOWED_ORIGINS };
