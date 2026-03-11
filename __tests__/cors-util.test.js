/**
 * Unit tests for api/_lib/cors.js (SEC-03)
 * These tests describe the contract for the shared CORS utility.
 * Will fail with "Cannot find module '../api/_lib/cors.js'" until the module is created.
 */
const { corsHeaders, ALLOWED_ORIGINS } = require('../api/_lib/cors.js');

function makeReq(origin) {
  return { headers: { origin } };
}

describe('corsHeaders', () => {
  it('returns the request origin for an allowed origin', () => {
    const req = makeReq('https://adamcamilleri.github.io');
    const headers = corsHeaders(req, 'POST, OPTIONS');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://adamcamilleri.github.io');
  });

  it('returns first allowed origin for unknown origins', () => {
    const req = makeReq('https://unknown-site.com');
    const headers = corsHeaders(req, 'POST, OPTIONS');
    expect(headers['Access-Control-Allow-Origin']).toBe(ALLOWED_ORIGINS[0]);
  });

  it('allows localhost with any port', () => {
    const req = makeReq('http://localhost:8080');
    const headers = corsHeaders(req, 'GET, OPTIONS');
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:8080');
  });

  it('allows 127.0.0.1 with any port', () => {
    const req = makeReq('http://127.0.0.1:9000');
    const headers = corsHeaders(req, 'GET, OPTIONS');
    expect(headers['Access-Control-Allow-Origin']).toBe('http://127.0.0.1:9000');
  });

  it('accepts allowedMethods parameter', () => {
    const req = makeReq('https://adamcamilleri.com');
    const headersPost = corsHeaders(req, 'POST, OPTIONS');
    const headersGet = corsHeaders(req, 'GET, OPTIONS');
    expect(headersPost['Access-Control-Allow-Methods']).toBe('POST, OPTIONS');
    expect(headersGet['Access-Control-Allow-Methods']).toBe('GET, OPTIONS');
  });

  it('includes Content-Type and X-API-Key in allowed headers', () => {
    const req = makeReq('https://adamcamilleri.github.io');
    const headers = corsHeaders(req, 'POST, OPTIONS');
    expect(headers['Access-Control-Allow-Headers']).toMatch(/Content-Type/);
    expect(headers['Access-Control-Allow-Headers']).toMatch(/X-API-Key/);
  });

  it('allows .vercel.app origins', () => {
    const req = makeReq('https://adamcamilleri-github-io.vercel.app');
    const headers = corsHeaders(req, 'POST, OPTIONS');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://adamcamilleri-github-io.vercel.app');
  });

  it('allows .github.io origins', () => {
    const req = makeReq('https://someuser.github.io');
    const headers = corsHeaders(req, 'POST, OPTIONS');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://someuser.github.io');
  });
});
