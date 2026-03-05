/**
 * Vercel serverless function – handles chat and design generation requests.
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

function corsHeaders(req) {
    const origin = req.headers.origin || req.headers.Origin;
    const allowed = ALLOWED_ORIGINS.some(o => origin && (origin === o || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) ||
        (origin && (origin.endsWith('.vercel.app') || origin.endsWith('.github.io')));
    return {
        'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    };
}

const DEFAULT_SYSTEM = `You are a world-class web designer who builds beautiful, conversion-focused websites for small businesses. You write complete, polished single-page HTML using Tailwind CSS.

TECHNICAL REQUIREMENTS:
- ALWAYS include in <head>: <script src="https://cdn.tailwindcss.com"><\/script>
- Return a REPLY line first (BEFORE the HTML), then the full HTML. Format: REPLY: [one short, warm, natural sentence — like a designer chatting with their client. E.g. "Here you go! I went with a warm earthy palette to match the restaurant vibe — let me know what you think." or "Done! I've added your photo to the hero and made the heading bigger." or "Here's your site! I kept things clean and modern — want me to change anything?"]
- Output only: REPLY line + HTML. No markdown fences. No extra explanation.
- Self-contained — no external JS dependencies
- Forms: use action="https://formsubmit.co/[email]" method="POST" if email provided, otherwise placeholder action="#"
- Images: NEVER use external image URLs. Use styled placeholder divs for any new images. EXCEPTION: if the current HTML contains img tags with src values like [img1], [img2] etc., preserve them exactly — these are user-uploaded images embedded by the client. Do NOT replace them with placeholder divs.

DESIGN SYSTEM — follow these rules strictly:

Typography:
- Hero headline: text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none
- Section titles: text-3xl md:text-4xl font-bold tracking-tight
- Card titles: text-xl font-semibold
- Body: text-base md:text-lg text-gray-600 leading-relaxed
- Overline labels: text-sm font-semibold tracking-widest uppercase text-[accent-color]

Layout:
- Content container: max-w-6xl mx-auto px-6 md:px-8
- Section spacing: py-16 md:py-24
- Hero: min-h-screen flex flex-col justify-center (or min-h-[85vh])
- Always fully mobile-responsive — use sm:, md:, lg: prefixes throughout

Color palette — choose ONE that fits the business type. Apply it consistently:
- Warm/Food/Hospitality: white/stone-50 bg, gray-900 text, orange-500 or amber-600 accent
- Modern/Tech/SaaS: slate-900 bg, white text, violet-500 or indigo-500 accent
- Luxury/High-end: black bg, white text, yellow-400 or rose-300 accent
- Fresh/Health/Wellness: white bg, gray-900 text, emerald-500 or teal-500 accent
- Bold/Creative: gray-950 bg, white text, fuchsia-500 or cyan-400 accent

Navigation (include on EVERY page):
<nav class="fixed top-0 w-full z-50 bg-[base-color]/90 backdrop-blur-md border-b border-white/10">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    [Logo — bold wordmark]
    [Desktop nav links — 4-5 items, hidden on mobile: hidden md:flex]
    [CTA button — accent color, rounded-lg px-5 py-2.5 text-sm font-semibold]
    [Mobile hamburger or simple stacked links]
  </div>
</nav>
<div class="h-16"></div> <!-- spacer for fixed nav -->

Standard page structure:
1. Fixed Nav
2. Hero — punchy headline + subtext + 2 CTAs + large placeholder for key image
3. Social proof bar — "X years in business · X+ clients · X★ average rating" (use plausible numbers)
4. Services/Features — 3-column card grid
5. About section — text + image placeholder, visually interesting layout
6. Testimonials — 3 quote cards in a grid
7. CTA banner — solid accent-color background, centered headline + button
8. Contact/Footer — form (if needed) + address/hours + copyright

Image placeholders (ALWAYS use this pattern, never <img> with real URLs):
<div class="bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400 gap-2" style="min-height:280px">
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v13.5a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></svg>
  <span class="text-sm font-medium">[Description of image]</span>
</div>

COPY RULES:
- Write REAL, specific, compelling copy. NOT Lorem ipsum.
- Hero headline must be specific to the business: "Hand-Crafted Italian in the Heart of [City]" not "Welcome to Our Restaurant"
- Every section needs a punchy title + 1-2 supporting sentences
- Use realistic business details (address, hours, phone) as placeholders

OUT OF SCOPE — respond with a friendly short message only (no HTML):
- Online payments, checkout, ecommerce purchase flows
- User accounts/login
- Real-time features

When MODIFYING an existing site: change ONLY what was requested. Preserve all other sections exactly.`;

async function callChatApi(key, messages) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 8192, messages }),
    });
    return response;
}

function extractText(data) {
    return data.choices?.[0]?.message?.content ?? '';
}

module.exports = async function handler(req, res) {
    Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { checkApiKey } = require('./_lib/api-key.js');
    const keyCheck = checkApiKey(req);
    if (!keyCheck.ok) return res.status(401).json({ error: keyCheck.error });

    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch {
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    const { messages, currentHtml, formEmail, user, elementEdit, selectedElementHtml, instruction } = body;

    // Input validation
    if (user && typeof user === 'string' && user.length > 10000) {
        return res.status(400).json({ error: 'User message too long' });
    }
    if (currentHtml && typeof currentHtml === 'string' && currentHtml.length > 150000) {
        return res.status(400).json({ error: 'currentHtml too large' });
    }
    if (selectedElementHtml && typeof selectedElementHtml === 'string' && selectedElementHtml.length > 10000) {
        return res.status(400).json({ error: 'selectedElementHtml too large' });
    }
    if (instruction && typeof instruction === 'string' && instruction.length > 5000) {
        return res.status(400).json({ error: 'Instruction too long' });
    }

    const key = process.env.GROQ_API_KEY;
    if (!key) {
        return res.status(500).json({ error: 'API key not configured. Add it in Vercel → Settings → Environment Variables.' });
    }

    const { extractHtmlFromResponse } = require('./_lib/html-response.js');

    // Element edit path
    if (elementEdit && selectedElementHtml && instruction && typeof instruction === 'string' && instruction.trim()) {
        const pageHtml = (currentHtml && typeof currentHtml === 'string') ? currentHtml : '';
        if (!pageHtml || pageHtml.length < 50) {
            return res.status(400).json({ error: 'elementEdit requires currentHtml' });
        }
        const systemContent = 'You are a web design assistant. The user clicked on an element and wants to change it. Find that element in the full page HTML and modify it according to their instruction. Return the complete full-page HTML with only that one element changed. Keep everything else identical. Use Tailwind CSS. For images: use placeholder divs (e.g. a gray box with "Add image: description") - never use real image URLs. Output only the HTML, no markdown fences, no explanation.';
        const userContent = `The user selected this element (find it in the full page below) and said: "${instruction.trim()}"\n\nSelected element:\n${selectedElementHtml.slice(0, 4000)}\n\nFull page HTML to modify:\n${pageHtml.slice(0, 15000)}`;
        try {
            const response = await callChatApi(key, [
                { role: 'system', content: systemContent },
                { role: 'user', content: userContent },
            ]);
            if (!response.ok) {
                const err = await response.text();
                return res.status(response.status).json({ error: 'API error', details: err });
            }
            const data = await response.json();
            const text = extractText(data);
            const html = extractHtmlFromResponse(text);
            const summaryMatch = text.match(/^REPLY:\s*(.+)/m);
            const summary = summaryMatch ? summaryMatch[1].trim() : null;
            return res.status(200).json(html ? { reply: text, html, summary } : { reply: text });
        } catch (err) {
            return res.status(500).json({ error: 'Server error', details: err.message });
        }
    }

    // Main chat path
    const hasHistory = Array.isArray(messages) && messages.length > 0;
    const hasUser = typeof user === 'string' && user.trim();
    if (!hasHistory && !hasUser) {
        return res.status(400).json({ error: 'Provide "messages" array or "user" string' });
    }

    let systemContent = DEFAULT_SYSTEM;
    if (formEmail && typeof formEmail === 'string' && formEmail.trim()) {
        const email = formEmail.trim();
        systemContent += `\n\nThe user provided their email for the contact form: ${email}. Use action="https://formsubmit.co/${encodeURIComponent(email)}" method="POST" on the form.`;
    }
    if (currentHtml && typeof currentHtml === 'string' && currentHtml.trim().length > 10) {
        systemContent += `\n\nCURRENT PAGE HTML (modify this — do not replace entirely unless the user explicitly asks for a fresh design):\n\`\`\`html\n${currentHtml.slice(0, 14000)}\n\`\`\``;
    }

    const chatMessages = [{ role: 'system', content: systemContent }];
    if (hasHistory) {
        messages.forEach(function (m) {
            if (m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') {
                chatMessages.push({ role: m.role, content: m.content });
            }
        });
    } else {
        chatMessages.push({ role: 'user', content: user });
    }

    try {
        const response = await callChatApi(key, chatMessages);
        if (!response.ok) {
            const err = await response.text();
            return res.status(response.status).json({ error: 'API error', details: err });
        }
        const data = await response.json();
        const text = extractText(data);
        const html = extractHtmlFromResponse(text);
        const summaryMatch = text.match(/^REPLY:\s*(.+)/m);
        const summary = summaryMatch ? summaryMatch[1].trim() : null;
        return res.status(200).json(html ? { reply: text, html, summary } : { reply: text });
    } catch (err) {
        return res.status(500).json({ error: 'Server error', details: err.message });
    }
};
