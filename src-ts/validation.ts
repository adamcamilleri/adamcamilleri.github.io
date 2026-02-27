/**
 * TypeScript validation helpers for API payloads (shift-left, typed req/res)
 */

export interface SaveDesignPayload {
  html: string;
  name?: string;
}

export function validateSaveDesignPayload(body: unknown): { valid: true; html: string; name: string } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') return { valid: false, error: 'Invalid body' };
  const b = body as Record<string, unknown>;
  const html = b.html;
  const name = b.name;

  if (typeof html !== 'string' || !html.trim()) return { valid: false, error: 'Missing or invalid "html"' };
  if (html.length > 500000) return { valid: false, error: 'HTML too large' };

  const safeName = (name && typeof name === 'string' && name.trim()) ? name.trim() : 'Untitled design';
  return { valid: true, html, name: safeName };
}
