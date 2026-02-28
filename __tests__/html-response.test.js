/**
 * Unit tests for AI response HTML extraction and sanitization (shift-left, XSS prevention)
 * Run: npm test
 */
const { extractHtmlFromResponse, fixImagePlaceholders } = require('../api/lib/html-response.js');

describe('extractHtmlFromResponse', () => {
  test('extracts HTML from plain text', () => {
    const text = 'Here is the design:\n\n<html><body><h1>Hello</h1></body></html>';
    expect(extractHtmlFromResponse(text)).toContain('<html>');
    expect(extractHtmlFromResponse(text)).toContain('<h1>Hello</h1>');
  });

  test('returns null for empty or non-string input', () => {
    expect(extractHtmlFromResponse(null)).toBeNull();
    expect(extractHtmlFromResponse('')).toBeNull();
    expect(extractHtmlFromResponse(123)).toBeNull();
  });

  test('returns null when no HTML tags present', () => {
    expect(extractHtmlFromResponse('Just plain text with no tags')).toBeNull();
  });

  test('extracts from first < to last >', () => {
    const text = 'prefix <div>content</div> suffix';
    const result = extractHtmlFromResponse(text);
    expect(result).toBe('<div>content</div>');
  });

  test('replaces img tags with safe placeholder divs', () => {
    const text = '<html><body><img src="https://evil.com/xss.jpg" alt="pic"></body></html>';
    const result = extractHtmlFromResponse(text);
    expect(result).not.toContain('evil.com');
    expect(result).not.toContain('<img');
    expect(result).toContain('Add image: pic');
  });
});

describe('fixImagePlaceholders', () => {
  test('replaces img with placeholder using alt text', () => {
    const html = '<img src="https://example.com/photo.jpg" alt="My photo">';
    const result = fixImagePlaceholders(html);
    expect(result).not.toContain('example.com');
    expect(result).toContain('Add image: My photo');
  });

  test('uses "image" when no alt attribute', () => {
    const html = '<img src="http://bad.com/x.png">';
    const result = fixImagePlaceholders(html);
    expect(result).toContain('Add image: image');
  });

  test('handles empty string and null', () => {
    expect(fixImagePlaceholders('')).toBe('');
    expect(fixImagePlaceholders(null)).toBe(null);
  });

  test('leaves non-img HTML unchanged', () => {
    const html = '<div class="box"><p>No images</p></div>';
    expect(fixImagePlaceholders(html)).toBe(html);
  });

  test('handles multiple img tags', () => {
    const html = '<body><img src="a.jpg" alt="1"><img src="b.png" alt="2"></body>';
    const result = fixImagePlaceholders(html);
    expect(result).toContain('Add image: 1');
    expect(result).toContain('Add image: 2');
    expect(result).not.toContain('a.jpg');
    expect(result).not.toContain('b.png');
  });
});
