/**
 * Handoff deploy – deploys generated HTML to your Vercel account.
 * Requires VERCEL_TOKEN in Vercel environment variables.
 * Each deployment gets a unique project; custom domain can be added later.
 */


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

// All user sites deploy into one shared project to stay within Vercel Hobby's
// 10-project limit. Each deployment still gets its own unique URL.
const SHARED_PROJECT_NAME = (process.env.HANDOFF_DEPLOY_PREFIX || 'handoff').trim().replace(/[^a-zA-Z0-9-]/g, '') || 'handoff-sites';

module.exports = async function handler(req, res) {
    const { corsHeaders } = require('./_lib/cors.js');
    Object.entries(corsHeaders(req, 'POST, OPTIONS')).forEach(([k, v]) => res.setHeader(k, v));
    res.setHeader('Access-Control-Allow-Credentials', 'true');

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

    const { html } = body;
    if (!html || typeof html !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "html" in request body' });
    }
    if (html.length > 500000) {
        return res.status(413).json({ error: 'HTML too large', details: 'Max 500KB' });
    }

    const name = SHARED_PROJECT_NAME;

    const cookies = parseCookies(req.headers.cookie);
    const userToken = cookies.vercel_access_token;
    const token = userToken || process.env.VERCEL_TOKEN;
    if (!token) {
        return res.status(500).json({ error: 'VERCEL_TOKEN not configured. Connect your Vercel account or add VERCEL_TOKEN in Vercel → Settings → Environment Variables.' });
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
