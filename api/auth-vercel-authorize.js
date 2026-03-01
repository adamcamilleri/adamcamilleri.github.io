/**
 * Vercel OAuth – redirect user to authorize Handoff to deploy to their Vercel account.
 * Requires VERCEL_OAUTH_CLIENT_ID and VERCEL_OAUTH_CLIENT_SECRET in env.
 * Path: /api/auth-vercel-authorize (flat path for Vercel deployment)
 */
const crypto = require('crypto');

const ALLOWED_ORIGINS = [
  'https://adamcamilleri.github.io',
  'https://adamcamilleri-github-io.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function getOrigin(req) {
  const origin = req.headers.origin || req.headers.Origin;
  const host = req.headers.host || '';
  const proto = req.headers['x-forwarded-proto'] || 'http';
  if (origin && (origin.endsWith('.vercel.app') || origin.endsWith('.github.io') || origin.includes('localhost'))) return origin;
  return `${proto}://${host}`;
}

function generateSecureRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

function cookieHeader(name, value, maxAge = 600) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

module.exports = async function handler(req, res) {
  const clientId = process.env.VERCEL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.VERCEL_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'VERCEL_OAUTH_CLIENT_ID and VERCEL_OAUTH_CLIENT_SECRET must be set' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = getOrigin(req);
  const redirectUri = `${origin}/api/auth-vercel-callback`;
  const state = generateSecureRandomString(43);
  const nonce = generateSecureRandomString(43);
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  res.setHeader('Set-Cookie', [
    cookieHeader('oauth_state', state),
    cookieHeader('oauth_nonce', nonce),
    cookieHeader('oauth_code_verifier', codeVerifier),
  ]);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile offline_access',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `https://vercel.com/oauth/authorize?${params.toString()}`;
  res.writeHead(302, { Location: authUrl });
  res.end();
};
