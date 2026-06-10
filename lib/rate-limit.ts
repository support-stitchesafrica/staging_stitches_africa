/**
 * In-memory rate limiter using a rolling time window.
 * Suitable for single-instance Next.js deployments.
 * For multi-instance deployments, replace with a Redis-backed solution (e.g. Upstash).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Keyed by IP address
const store = new Map<string, RateLimitEntry>();

/**
 * Check whether the given IP is within the allowed request rate.
 * @param ip - The client IP address
 * @param maxRequests - Maximum requests allowed per window (default: 30)
 * @param windowMs - Rolling window duration in milliseconds (default: 60_000)
 * @returns true if the request is allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  ip: string,
  maxRequests = 30,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Reset the in-memory store. Used in tests to ensure a clean state.
 */
export function resetStore(): void {
  store.clear();
}
