/**
 * Vercel serverless function – proxies chat requests to OpenAI.
 * Requires OPENAI_API_KEY in Vercel environment variables.
 * New OpenAI accounts get free trial credits; gpt-4o-mini is cost-effective.
 */

const ALLOWED_ORIGINS = [
    'https://adamcamilleri.github.io',
    'https://www.adamcamilleri.github.io',
    'https://adamcamilleri-github-io.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
];

function corsHeaders(req) {
    const origin = req.headers.origin || req.headers.Origin;
    const allowed = ALLOWED_ORIGINS.some(o => origin && (origin === o || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) ||
        (origin && (origin.endsWith('.vercel.app') || origin.endsWith('.github.io')));
    return {
        'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

const DEFAULT_SYSTEM = 'You are a helpful web design assistant. When asked to design or modify a webpage, respond with a complete single-page HTML document (with inline CSS). Output only the HTML, no markdown code fences or explanation.';

module.exports = async function handler(req, res) {
    Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
        return res.status(500).json({ error: 'OPENAI_API_KEY not configured. Add it in Vercel → Settings → Environment Variables.' });
    }

    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch {
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    const { system, user } = body;
    if (!user || typeof user !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "user" in request body' });
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + key,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                max_tokens: 8192,
                messages: [
                    { role: 'system', content: system || DEFAULT_SYSTEM },
                    { role: 'user', content: user },
                ],
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            return res.status(response.status).json({ error: 'OpenAI API error', details: err });
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content ?? '';

        return res.status(200).json({ reply: text });
    } catch (err) {
        return res.status(500).json({ error: 'Server error', details: err.message });
    }
};
