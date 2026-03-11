/**
 * Creates a Stripe Payment Link for Handoff buy/donate buttons.
 * Requires STRIPE_SECRET_KEY in Vercel environment variables.
 */

module.exports = async function handler(req, res) {
    const { corsHeaders } = require('./_lib/cors.js');
    Object.entries(corsHeaders(req, 'POST, OPTIONS')).forEach(([k, v]) => res.setHeader(k, v));

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

    const amount = Math.round(Number(body.amount) || 0);
    const label = (body.label && String(body.label).trim()) || 'Payment';

    if (amount <= 0) {
        return res.status(400).json({ error: 'Provide a positive "amount" (in cents, e.g. 2000 for $20)' });
    }
    if (amount > 99999999) {
        return res.status(400).json({ error: 'Amount exceeds maximum' });
    }
    if (label.length > 200) {
        return res.status(400).json({ error: 'Label too long' });
    }

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        return res.status(500).json({
            error: 'Stripe not configured. Add STRIPE_SECRET_KEY in Vercel environment variables for payment buttons.',
            paymentLink: null
        });
    }

    try {
        const response = await fetch('https://api.stripe.com/v1/payment_links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer ' + key,
            },
            body: new URLSearchParams({
                'line_items[0][price_data][currency]': 'usd',
                'line_items[0][price_data][unit_amount]': String(amount),
                'line_items[0][price_data][product_data][name]': label,
                'line_items[0][quantity]': '1',
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            return res.status(response.status).json({ error: 'Stripe error', details: err });
        }

        const data = await response.json();
        const url = data.url || null;

        return res.status(200).json({ paymentLink: url });
    } catch (err) {
        return res.status(500).json({ error: 'Payment link error', details: err.message });
    }
};
