/**
 * Handoff deploy – deploys generated HTML to your Vercel account.
 * Requires VERCEL_TOKEN in Vercel environment variables.
 * Each deployment gets a unique project; custom domain can be added later.
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
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

function slug() {
    return 'handoff-' + Math.random().toString(36).slice(2, 10);
}

module.exports = async function handler(req, res) {
    Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    } catch {
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    const { html, projectName } = body;
    if (!html || typeof html !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "html" in request body' });
    }
    if (html.length > 500000) {
        return res.status(413).json({ error: 'HTML too large', details: 'Max 500KB' });
    }

    const name = (projectName && String(projectName).trim()) || slug();
    if (name.length > 64 || !/^[a-zA-Z0-9-]+$/.test(name)) {
        return res.status(400).json({ error: 'projectName must be alphanumeric + hyphens, max 64 chars' });
    }

    const token = process.env.VERCEL_TOKEN;
    if (!token) {
        return res.status(500).json({ error: 'VERCEL_TOKEN not configured. Add it in Vercel → Settings → Environment Variables.' });
    }

    const vercelJson = JSON.stringify({
        buildCommand: null,
        outputDirectory: '.',
        framework: null,
    });

    try {
        const deploymentRes = await fetch('https://api.vercel.com/v13/deployments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify({
                name,
                files: [
                    { file: 'index.html', data: html, encoding: 'utf-8' },
                    { file: 'vercel.json', data: vercelJson, encoding: 'utf-8' },
                ],
                projectSettings: {
                    buildCommand: null,
                    framework: null,
                },
            }),
        });

        if (!deploymentRes.ok) {
            const err = await deploymentRes.text();
            return res.status(deploymentRes.status).json({ error: 'Vercel deploy failed', details: err });
        }

        const data = await deploymentRes.json();
        const url = data.url ? `https://${data.url}` : (data.readyState === 'READY' && data.alias?.[0]) || null;

        return res.status(200).json({
            url: url || `https://${name}.vercel.app`,
            projectName: name,
            deploymentId: data.id,
        });
    } catch (err) {
        return res.status(500).json({ error: 'Deploy error', details: err.message });
    }
};
