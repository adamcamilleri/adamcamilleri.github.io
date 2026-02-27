"use strict";
/**
 * TypeScript validation helpers for API payloads (shift-left, typed req/res)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSaveDesignPayload = validateSaveDesignPayload;
function validateSaveDesignPayload(body) {
    if (!body || typeof body !== 'object')
        return { valid: false, error: 'Invalid body' };
    const b = body;
    const html = b.html;
    const name = b.name;
    if (typeof html !== 'string' || !html.trim())
        return { valid: false, error: 'Missing or invalid "html"' };
    if (html.length > 500000)
        return { valid: false, error: 'HTML too large' };
    const safeName = (name && typeof name === 'string' && name.trim()) ? name.trim() : 'Untitled design';
    return { valid: true, html, name: safeName };
}
