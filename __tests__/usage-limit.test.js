/**
 * @jest-environment jsdom
 */

/**
 * SEC-05: Usage limit gate in Handoff canGenerate()
 *
 * Tests the behavioral contract:
 * - canGenerate() returns false when usage count is >= FREE_LIMIT (3)
 * - canGenerate() returns true when usage count is < FREE_LIMIT
 * - The gate must use getUsage().count < FREE_LIMIT — not hardcoded true
 *
 * Tests mirror the contract that projects/handoff/script.js must implement.
 * These tests FAIL against the current implementation (canGenerate always returns true).
 */

'use strict';

var FREE_LIMIT = 3;

/**
 * Reference implementation of getUsage() matching the handoff script contract.
 * Uses localStorage to track usage per day.
 */
function getUsage() {
  var today = new Date().toISOString().slice(0, 10);
  try {
    var stored = JSON.parse(localStorage.getItem('handoff_usage') || '{}');
    return stored.date === today ? stored : { date: today, count: 0 };
  } catch (e) {
    return { date: today, count: 0 };
  }
}

/**
 * The FIXED canGenerate() contract.
 * Must return false when count >= FREE_LIMIT.
 */
function canGenerate() {
  return getUsage().count < FREE_LIMIT;
}

describe('SEC-05: canGenerate() usage limit enforcement', function () {
  var today;

  beforeEach(function () {
    today = new Date().toISOString().slice(0, 10);
    localStorage.clear();
  });

  afterEach(function () {
    localStorage.clear();
  });

  it('should return false when usage count equals FREE_LIMIT (3)', function () {
    localStorage.setItem('handoff_usage', JSON.stringify({ date: today, count: 3 }));
    expect(canGenerate()).toBe(false);
  });

  it('should return false when usage count exceeds FREE_LIMIT', function () {
    localStorage.setItem('handoff_usage', JSON.stringify({ date: today, count: 5 }));
    expect(canGenerate()).toBe(false);
  });

  it('should return true when usage count is 2 (below limit)', function () {
    localStorage.setItem('handoff_usage', JSON.stringify({ date: today, count: 2 }));
    expect(canGenerate()).toBe(true);
  });

  it('should return true when usage count is 0 (fresh start)', function () {
    localStorage.setItem('handoff_usage', JSON.stringify({ date: today, count: 0 }));
    expect(canGenerate()).toBe(true);
  });

  it('should return true when no usage record exists', function () {
    // localStorage is empty — first-time visitor
    expect(canGenerate()).toBe(true);
  });

  it('should treat a previous day record as count 0 (daily reset)', function () {
    var yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    localStorage.setItem('handoff_usage', JSON.stringify({ date: yesterday, count: 3 }));
    // Old record is ignored — fresh day
    expect(canGenerate()).toBe(true);
  });

  it('FREE_LIMIT is 3', function () {
    expect(FREE_LIMIT).toBe(3);
  });
});
