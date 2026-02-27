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

    const { system, messages, currentHtml, formEmail, paymentLink, user } = body;

    const hasHistory = Array.isArray(messages) && messages.length > 0;
    const hasUser = typeof user === 'string' && user.trim();
    if (!hasHistory && !hasUser) {
        return res.status(400).json({ error: 'Provide "user" (string) or "messages" (conversation history)' });
    }

    let systemContent = system || DEFAULT_SYSTEM;
    systemContent += `\n\nSCOPE:\n- Contact forms: When the user asks for a contact form, ask "What email should the contact form send submissions to?" Once they provide an email, use action="https://formsubmit.co/" + their email, method="POST", and include a _subject hidden field.\n- Out of scope: If the user asks for online ordering, checkout, payment processing, ecommerce, buy/donate buttons, or similar: respond with a short, friendly message like "Sorry, we don't support that yet. I can help you design the rest of your site though!" Do not output HTML for these requests.`;
    const extras = [];
    if (formEmail && typeof formEmail === 'string' && formEmail.trim()) {
        const email = formEmail.trim();
        extras.push(`The user provided their email for the contact form: ${email}. Use action="https://formsubmit.co/${encodeURIComponent(email)}" for the form.`);
    }
    if (extras.length) {
        systemContent += '\n\n' + extras.join('\n');
    }
    if (currentHtml && typeof currentHtml === 'string' && currentHtml.trim().length > 10) {
        systemContent += `\n\nCURRENT PAGE HTML (modify this, do not replace entirely unless the user asks for a completely new design):\n\`\`\`html\n${currentHtml.slice(0, 12000)}\n\`\`\``;
    }

    const groqMessages = [{ role: 'system', content: systemContent }];
    if (hasHistory) {
        messages.forEach(function (m) {
            if (m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') {
                groqMessages.push({ role: m.role, content: m.content });
            }
        });
    } else if (user && typeof user === 'string') {
        groqMessages.push({ role: 'user', content: user });
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
                messages: groqMessages,
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
