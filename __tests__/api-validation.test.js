/**
 * Unit tests for API validation (shift-left testing)
 * Run: npm test
 */
const request = require('supertest');
const { app } = require('../server');

describe('API validation', () => {
  describe('POST /api/chat', () => {
    test('rejects missing user and messages', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/user|messages/i);
    });

    test('rejects user message too long', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .send({ user: 'x'.repeat(10001) });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/too long/i);
    });

    test('rejects invalid JSON', async () => {
      const res = await request(app)
        .post('/api/chat')
        .set('Origin', 'http://localhost:3000')
        .set('Content-Type', 'application/json')
        .send('not json');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/deploy', () => {
    test('rejects missing html', async () => {
      const res = await request(app)
        .post('/api/deploy')
        .set('Origin', 'http://localhost:3000')
        .send({});
      expect(res.status).toBe(400);
    });

    test('rejects html too large', async () => {
      const res = await request(app)
        .post('/api/deploy')
        .set('Origin', 'http://localhost:3000')
        .send({ html: 'x'.repeat(500001) });
      expect(res.status).toBe(413);
    });
  });

});
