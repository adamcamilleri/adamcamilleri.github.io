/**
 * Optional API key validation for programmatic API access.
 * Set API_KEYS in env (comma-separated). If X-API-Key is sent, it must match.
 * If API_KEYS is not set, or no key is sent, requests are allowed.
 */
function checkApiKey(req) {
  const keys = process.env.API_KEYS;
  if (!keys || typeof keys !== 'string') return { ok: true };
  const provided = req.headers['x-api-key'] || req.headers['X-API-Key'];
  if (!provided) return { ok: true };
  const valid = keys.split(',').map(k => k.trim()).filter(Boolean).includes(provided.trim());
  if (!valid) return { ok: false, error: 'Invalid API key' };
  return { ok: true };
}

module.exports = { checkApiKey };
