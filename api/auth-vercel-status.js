/**
 * Vercel OAuth status – returns whether the user has a valid access token cookie.
 * Path: /api/auth-vercel-status (flat path for Vercel deployment)
 */
const ALLOWED_ORIGINS = [
    'https://adamcamilleri.github.io',
    'https://adamcamilleri-github-io.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

function corsHeaders(req) {
    const origin = req.headers.origin || req.headers.Origin;
    const allowed = ALLOWED_ORIGINS.some(o => origin && (origin === o || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) ||
        (origin && (origin.endsWith('.vercel.app') || origin.endsWith('.github.io')));
    return {
        'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Credentials': 'true',
    };
}

function parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader) {
        cookieHeader.split(';').forEach(c => {
            const [k, v] = c.trim().split('=');
            if (k && v) cookies[k.trim()] = decodeURIComponent(v.trim());
        });
    }
    return cookies;
}

module.exports = async function handler(req, res) {
    Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const cookies = parseCookies(req.headers.cookie);
    const connected = !!cookies.vercel_access_token;
    return res.status(200).json({ connected });
};
