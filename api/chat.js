/**
 * Vercel serverless function – proxies chat requests to Groq.
 * Requires GROQ_API_KEY in Vercel environment variables.
 * Groq's free tier: no credit card, thousands of tokens/min. Sign up at console.groq.com
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

    const key = process.env.GROQ_API_KEY;
    if (!key) {
        return res.status(500).json({ error: 'GROQ_API_KEY not configured. Add it in Vercel → Settings → Environment Variables.' });
    }

    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch {
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    const { system, user, formEmail, paymentLink } = body;
    if (!user || typeof user !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "user" in request body' });
    }

    let systemContent = system || DEFAULT_SYSTEM;
    const extras = [];
    if (formEmail && typeof formEmail === 'string' && formEmail.trim()) {
        const email = formEmail.trim();
        extras.push(`CONTACT FORM: The user wants a contact form. Use action="https://formsubmit.co/${encodeURIComponent(email)}" for the form. Include method="POST" and a _subject field for the email subject.`);
    }
    if (paymentLink && typeof paymentLink === 'string' && paymentLink.trim()) {
        extras.push(`PAYMENT: The user wants a buy/donate button. Use this exact URL for the button href: ${paymentLink.trim()}`);
    }
    if (extras.length) {
        systemContent += '\n\n' + extras.join('\n\n');
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + key,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                max_tokens: 8192,
                messages: [
                    { role: 'system', content: systemContent },
                    { role: 'user', content: user },
                ],
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            return res.status(response.status).json({ error: 'Groq API error', details: err });
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content ?? '';

        return res.status(200).json({ reply: text });
    } catch (err) {
        return res.status(500).json({ error: 'Server error', details: err.message });
    }
};
