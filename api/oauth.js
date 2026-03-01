/**
 * Vercel OAuth – single handler for authorize, callback, and status.
 * Rewrites in vercel.json route /api/auth-vercel-* here with ?action=
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
  const max = maxAge > 0 ? `; Max-Age=${maxAge}` : '; Max-Age=0';
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax${max}${secure}`;
}

function parseCookies(cookieHeaderStr) {
  const cookies = {};
  if (cookieHeaderStr) {
    cookieHeaderStr.split(';').forEach(c => {
      const [k, v] = c.trim().split('=');
      if (k && v) cookies[k.trim()] = decodeURIComponent(v.trim());
    });
  }
  return cookies;
}

function decodeNonce(idToken) {
  try {
    const payload = idToken.split('.')[1];
    if (!payload) return '';
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    const m = decoded.match(/"nonce":"([^"]+)"/);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

async function handleAuthorize(req, res) {
  const origin = getOrigin(req);
  const redirectUri = `${origin}/api/auth-vercel-callback`;
  const state = generateSecureRandomString(43);
  const nonce = generateSecureRandomString(43);
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  res.setHeader('Set-Cookie', [
    cookieHeader('oauth_state', state, 600),
    cookieHeader('oauth_nonce', nonce, 600),
    cookieHeader('oauth_code_verifier', codeVerifier, 600),
  ]);

  const params = new URLSearchParams({
    client_id: process.env.VERCEL_OAUTH_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile offline_access',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  res.writeHead(302, { Location: `https://vercel.com/oauth/authorize?${params.toString()}` });
  res.end();
}

async function handleCallback(req, res) {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const origin = getOrigin(req);
  const handoffUrl = `${origin}/projects/handoff/`;

  if (errorParam) {
    res.writeHead(302, { Location: `${handoffUrl}?error=oauth_denied` });
    return res.end();
  }

  if (!code) {
    res.writeHead(302, { Location: `${handoffUrl}?error=oauth_no_code` });
    return res.end();
  }

  const cookies = parseCookies(req.headers.cookie);
  const storedState = cookies.oauth_state;
  const storedNonce = cookies.oauth_nonce;
  const codeVerifier = cookies.oauth_code_verifier;

  if (!state || !storedState || state !== storedState) {
    res.writeHead(302, { Location: `${handoffUrl}?error=oauth_state_mismatch` });
    return res.end();
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.VERCEL_OAUTH_CLIENT_ID,
    client_secret: process.env.VERCEL_OAUTH_CLIENT_SECRET,
    code,
    code_verifier: codeVerifier || '',
    redirect_uri: `${origin}/api/auth-vercel-callback`,
  });

  const tokenRes = await fetch('https://api.vercel.com/login/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('Vercel OAuth token exchange failed:', err);
    res.writeHead(302, { Location: `${handoffUrl}?error=oauth_token_failed` });
    return res.end();
  }

  const tokenData = await tokenRes.json();
  const decodedNonce = decodeNonce(tokenData.id_token || '');
  if (storedNonce && decodedNonce && decodedNonce !== storedNonce) {
    res.writeHead(302, { Location: `${handoffUrl}?error=oauth_nonce_mismatch` });
    return res.end();
  }

  const accessMaxAge = Math.min(tokenData.expires_in || 3600, 60 * 60 * 24);
  const refreshMaxAge = 60 * 60 * 24 * 30;

  res.setHeader('Set-Cookie', [
    cookieHeader('oauth_state', '', 0),
    cookieHeader('oauth_nonce', '', 0),
    cookieHeader('oauth_code_verifier', '', 0),
    cookieHeader('vercel_access_token', tokenData.access_token, accessMaxAge),
    cookieHeader('vercel_refresh_token', tokenData.refresh_token || '', refreshMaxAge),
  ]);
  res.writeHead(302, { Location: `${handoffUrl}?vercel_connected=1` });
  res.end();
}

function handleStatus(req, res) {
  const origin = req.headers.origin || req.headers.Origin;
  const allowed = ALLOWED_ORIGINS.some(o => origin && (origin === o || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) ||
    (origin && (origin.endsWith('.vercel.app') || origin.endsWith('.github.io')));
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const cookies = parseCookies(req.headers.cookie);
  return res.status(200).json({ connected: !!cookies.vercel_access_token });
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

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const action = url.searchParams.get('action');

  if (action === 'authorize') return handleAuthorize(req, res);
  if (action === 'callback') return handleCallback(req, res);
  if (action === 'status') return handleStatus(req, res);

  res.setHeader('Content-Type', 'application/json');
  return res.status(400).json({ error: 'Missing action param' });
};
