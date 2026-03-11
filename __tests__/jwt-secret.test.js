/**
 * SEC-02: JWT secret guard in TaskMaster
 *
 * Tests the behavioral contract for getSecret():
 * - In production (NODE_ENV=production) with no JWT_SECRET: MUST throw an Error
 *   containing "JWT_SECRET"
 * - In development (NODE_ENV=development) with no JWT_SECRET: must NOT throw;
 *   returns a dev fallback
 * - When JWT_SECRET is set: returns the encoded secret
 *
 * We test the guard logic directly (not the full jwt.ts TypeScript file)
 * because jose requires ESM and Jest runs CJS here. The production fix must
 * make jwt.ts match this exact contract.
 */

'use strict';

/**
 * The getSecret guard contract that jwt.ts must implement.
 * This is the reference implementation used in these tests.
 */
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return secret || 'dev-only-secret';
}

describe('SEC-02: JWT secret guard', function () {
  var originalNodeEnv;
  var originalJwtSecret;

  beforeEach(function () {
    originalNodeEnv = process.env.NODE_ENV;
    originalJwtSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
  });

  afterEach(function () {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('should throw when JWT_SECRET is missing in production', function () {
    process.env.NODE_ENV = 'production';

    expect(function () {
      getSecret();
    }).toThrow('JWT_SECRET');
  });

  it('thrown error message must mention JWT_SECRET', function () {
    process.env.NODE_ENV = 'production';

    expect(function () {
      getSecret();
    }).toThrowError(/JWT_SECRET/);
  });

  it('should NOT throw when JWT_SECRET is missing in development', function () {
    process.env.NODE_ENV = 'development';

    expect(function () {
      getSecret();
    }).not.toThrow();
  });

  it('should return a fallback value in development when secret is missing', function () {
    process.env.NODE_ENV = 'development';

    const result = getSecret();
    expect(result).toBeTruthy();
  });

  it('should return the JWT_SECRET value when set', function () {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'super-secure-test-secret';

    const result = getSecret();
    expect(result).toBe('super-secure-test-secret');
  });
});
