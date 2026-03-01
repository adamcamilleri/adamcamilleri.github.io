/**
 * Vercel OAuth callback – exchange code for tokens, set cookie, redirect back to Handoff.
 */
const crypto = require('crypto');

const ALLOWED_ORIGINS = [
  'https://adamcamilleri.github.io',
  'https://adamcamilleri-github-io.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function getOrigin(req) {
  const host = req.headers.host || '';
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return `${proto}://${host}`;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(c => {
      const [k, v] = c.trim().split('=');
      if (k && v) cookies[k] = decodeURIComponent(v.trim());
    });
  }
  return cookies;
}

function cookieHeader(name, value, maxAge = 0) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const max = maxAge > 0 ? `; Max-Age=${maxAge}` : '; Max-Age=0';
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax${max}${secure}`;
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

module.exports = async function handler(req, res) {
  const clientId = process.env.VERCEL_OAUTH_CLIENT_ID;
  const clientSecret = process.env.VERCEL_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.writeHead(302, { Location: '/projects/handoff/?error=oauth_not_configured' });
    return res.end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    client_id: clientId,
    client_secret: clientSecret,
    code,
    code_verifier: codeVerifier || '',
    redirect_uri: `${origin}/api/auth/vercel/callback`,
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

  const accessMaxAge = Math.min(tokenData.expires_in || 3600, 60 * 60 * 24); // max 24h
  const refreshMaxAge = 60 * 60 * 24 * 30; // 30 days

  const setCookies = [
    cookieHeader('oauth_state', '', 0),
    cookieHeader('oauth_nonce', '', 0),
    cookieHeader('oauth_code_verifier', '', 0),
    cookieHeader('vercel_access_token', tokenData.access_token, accessMaxAge),
    cookieHeader('vercel_refresh_token', tokenData.refresh_token || '', refreshMaxAge),
  ];

  res.setHeader('Set-Cookie', setCookies);
  res.writeHead(302, { Location: `${handoffUrl}?vercel_connected=1` });
  res.end();
};
