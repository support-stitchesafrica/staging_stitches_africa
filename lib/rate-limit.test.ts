import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { checkRateLimit, resetStore } from './rate-limit';

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('checkRateLimit — unit tests', () => {
  beforeEach(() => {
    resetStore();
  });

  it('allows the first request for a new IP', () => {
    expect(checkRateLimit('1.2.3.4')).toBe(true);
  });

  it('allows exactly 30 requests within the window', () => {
    const ip = '10.0.0.1';
    for (let i = 0; i < 30; i++) {
      expect(checkRateLimit(ip)).toBe(true);
    }
  });

  it('blocks the 31st request within the same window', () => {
    const ip = '10.0.0.2';
    for (let i = 0; i < 30; i++) {
      checkRateLimit(ip);
    }
    expect(checkRateLimit(ip)).toBe(false);
  });

  it('blocks all requests beyond 30 within the same window', () => {
    const ip = '10.0.0.3';
    for (let i = 0; i < 30; i++) {
      checkRateLimit(ip);
    }
    // 31st through 35th should all be blocked
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(ip)).toBe(false);
    }
  });

  it('tracks different IPs independently', () => {
    const ip1 = '192.168.1.1';
    const ip2 = '192.168.1.2';

    // Exhaust ip1
    for (let i = 0; i < 30; i++) {
      checkRateLimit(ip1);
    }
    expect(checkRateLimit(ip1)).toBe(false);

    // ip2 should still be allowed
    expect(checkRateLimit(ip2)).toBe(true);
  });

  it('resets the window after the time period expires', () => {
    const ip = '172.16.0.1';
    // Use a very short window (1 ms) to test reset
    for (let i = 0; i < 30; i++) {
      checkRateLimit(ip, 30, 1);
    }
    // Wait for window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(checkRateLimit(ip, 30, 1)).toBe(true);
        resolve();
      }, 10);
    });
  });

  it('resetStore clears all entries so previously blocked IPs are allowed again', () => {
    const ip = '10.10.10.10';
    for (let i = 0; i < 30; i++) {
      checkRateLimit(ip);
    }
    expect(checkRateLimit(ip)).toBe(false);

    resetStore();

    expect(checkRateLimit(ip)).toBe(true);
  });

  it('allows custom maxRequests parameter', () => {
    const ip = '5.5.5.5';
    expect(checkRateLimit(ip, 5)).toBe(true); // 1
    expect(checkRateLimit(ip, 5)).toBe(true); // 2
    expect(checkRateLimit(ip, 5)).toBe(true); // 3
    expect(checkRateLimit(ip, 5)).toBe(true); // 4
    expect(checkRateLimit(ip, 5)).toBe(true); // 5
    expect(checkRateLimit(ip, 5)).toBe(false); // 6 — blocked
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// Property 2: Rate limiter blocks excess requests
// Validates: Requirements 8.5
// ---------------------------------------------------------------------------

describe('checkRateLimit — Property 2: Rate limiter blocks excess requests', () => {
  beforeEach(() => {
    resetStore();
  });

  it('after exactly 30 accepted requests, the 31st is always rejected for any IP', () => {
    /**
     * **Validates: Requirements 8.5**
     *
     * For any IP address, after exactly 30 accepted requests within a
     * 60-second window, all subsequent requests within that same window
     * must be rejected (return false).
     */
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (ip) => {
        resetStore();
        for (let i = 0; i < 30; i++) {
          expect(checkRateLimit(ip)).toBe(true);
        }
        return checkRateLimit(ip) === false;
      }),
      { numRuns: 100 }
    );
  });

  it('the first request for any IP is always allowed', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (ip) => {
        resetStore();
        return checkRateLimit(ip) === true;
      }),
      { numRuns: 100 }
    );
  });

  it('requests 1 through 30 are all allowed for any IP', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.integer({ min: 1, max: 30 }),
        (ip, n) => {
          resetStore();
          let allAllowed = true;
          for (let i = 0; i < n; i++) {
            if (!checkRateLimit(ip)) {
              allAllowed = false;
              break;
            }
          }
          return allAllowed;
        }
      ),
      { numRuns: 100 }
    );
  });
});
