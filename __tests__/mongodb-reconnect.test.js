/**
 * Unit tests for api/_lib/mongodb.js ping guard (SEC-04)
 * Tests that getDb() reconnects after a stale connection (ping failure).
 */

// Set a fake MONGODB_URI so the env check doesn't throw
process.env.MONGODB_URI = 'mongodb://fake-host:27017/test';

// Mocks must be defined at top level for jest.mock hoisting
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockPing = jest.fn();
const fakeAdminDb = { command: mockPing };
const fakeDb = { collection: jest.fn() };
const mockClientDb = jest.fn().mockImplementation((dbName) => {
  if (dbName === 'admin') return fakeAdminDb;
  return fakeDb;
});

jest.mock('mongodb', () => {
  const MockMongoClient = jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    db: mockClientDb,
  }));
  return { MongoClient: MockMongoClient };
});

const { MongoClient } = require('mongodb');

describe('getDb() ping guard', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // Re-mock after resetModules
    jest.mock('mongodb', () => {
      const MockMongoClient = jest.fn().mockImplementation(() => ({
        connect: mockConnect,
        db: mockClientDb,
      }));
      return { MongoClient: MockMongoClient };
    });
    mockConnect.mockResolvedValue(undefined);
  });

  it('first call creates a connection and returns db', async () => {
    mockPing.mockResolvedValue({ ok: 1 });
    const { getDb } = require('../api/_lib/mongodb.js');
    const db = await getDb();
    expect(db).toBeDefined();
  });

  it('returns cached db when ping succeeds (no reconnect)', async () => {
    mockPing.mockResolvedValue({ ok: 1 });
    const { MongoClient: MC } = require('mongodb');
    const { getDb } = require('../api/_lib/mongodb.js');

    await getDb(); // first call — creates connection
    const firstCallCount = MC.mock.calls.length;
    expect(firstCallCount).toBe(1);

    await getDb(); // second call — ping succeeds, reuses cache
    expect(MC.mock.calls.length).toBe(1); // no new MongoClient
  });

  it('reconnects when ping throws (stale connection)', async () => {
    // First ping succeeds, second ping throws
    mockPing
      .mockResolvedValueOnce({ ok: 1 })
      .mockRejectedValueOnce(new Error('connection lost'));

    const { MongoClient: MC } = require('mongodb');
    const { getDb } = require('../api/_lib/mongodb.js');

    await getDb(); // creates connection (1 MongoClient)
    expect(MC.mock.calls.length).toBe(1);

    await getDb(); // ping succeeds — cache reused (still 1 MongoClient)
    expect(MC.mock.calls.length).toBe(1);

    await getDb(); // ping throws — reconnect (2nd MongoClient created)
    expect(MC.mock.calls.length).toBe(2);
  });

  it('clears cached variable when ping fails so next call reconnects', async () => {
    mockPing
      .mockResolvedValueOnce({ ok: 1 })  // call 2: ping ok
      .mockRejectedValueOnce(new Error('stale')) // call 3: ping fails
      .mockResolvedValue({ ok: 1 }); // call 4+: ping ok

    const { MongoClient: MC } = require('../api/_lib/mongodb.js').constructor || {};
    const { getDb } = require('../api/_lib/mongodb.js');

    await getDb(); // call 1: connects (1 client, cache empty initially)
    await getDb(); // call 2: ping ok, reuses
    await getDb(); // call 3: ping fails, clears cache, reconnects

    const { MongoClient: MC2 } = require('mongodb');
    expect(MC2.mock.calls.length).toBe(2); // original + reconnect

    await getDb(); // call 4: new cache, ping ok
    expect(MC2.mock.calls.length).toBe(2); // no 3rd client
  });
});
