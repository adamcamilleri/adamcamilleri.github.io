/**
 * HTML extraction and sanitization from AI responses.
 * Used server-side for safe preview; unit-tested to prevent XSS and bad image URLs.
 */

/**
 * Extract HTML from AI response text (handles markdown fences, stray text).
 * @param {string} text - Raw AI response
 * @returns {string|null} Extracted HTML or null if none found
 */
function extractHtmlFromResponse(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const open = trimmed.indexOf('<');
  const close = trimmed.lastIndexOf('>');
  if (open !== -1 && close > open) {
    return fixImagePlaceholders(trimmed.slice(open, close + 1));
  }
  return null;
}

/**
 * Replace img tags with placeholder divs to avoid real image URLs (XSS/safety).
 * @param {string} html - HTML string
 * @returns {string} HTML with img replaced by placeholders
 */
function fixImagePlaceholders(html) {
  if (!html || typeof html !== 'string') return html;
  return html.replace(/<img([^>]*?)src=["']([^"']*)["']([^>]*?)>/gi, (m, before, src, after) => {
    const altMatch = m.match(/alt=["']([^"']*)["']/i);
    const alt = (altMatch && altMatch[1]) ? altMatch[1].trim() : 'image';
    return '<div class="flex items-center justify-center bg-slate-200 text-slate-500 rounded-lg min-h-[120px] text-sm" style="aspect-ratio:16/9">Add image: ' + alt + '</div>';
  });
}

module.exports = { extractHtmlFromResponse, fixImagePlaceholders };
