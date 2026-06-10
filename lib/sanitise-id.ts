/**
 * Strips all characters except alphanumeric and dash, trims whitespace,
 * and caps the result at 64 characters to prevent injection attacks.
 *
 * Valid for Order IDs (e.g. STITCH-2026-001) and DHL tracking numbers
 * (alphanumeric only).
 */
export function sanitiseId(raw: string): string {
  return raw.trim().replace(/[^A-Za-z0-9\-]/g, '').slice(0, 64);
}
