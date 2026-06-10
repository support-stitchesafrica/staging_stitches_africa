import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Feature: ai-dimension-weight-generation

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/ai/dimensions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/ai/dimensions', () => {
  describe('unit tests — 2.3', () => {
    it('returns 400 when both title and imageUrls are missing', async () => {
      const req = makeRequest({});
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeTruthy();
    });

    it('returns 400 when title is empty string and imageUrls is empty array', async () => {
      const req = makeRequest({ title: '', imageUrls: [] });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when only description is provided (no title or imageUrls)', async () => {
      const req = makeRequest({ description: 'A nice dress' });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 200 with full estimate when title is provided', async () => {
      const req = makeRequest({ title: 'Ankara Dress', description: 'Beautiful dress' });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.estimate).toBeDefined();
      expect(data.estimate.lengthCm).toBeGreaterThan(0);
      expect(data.estimate.widthCm).toBeGreaterThan(0);
      expect(data.estimate.heightCm).toBeGreaterThan(0);
      expect(data.estimate.actualWeightKg).toBeGreaterThan(0);
      expect(data.estimate.volumetricWeight).toBeGreaterThan(0);
      expect(data.estimate.chargeableWeight).toBeGreaterThan(0);
      expect(typeof data.estimate.confidenceScore).toBe('number');
    });

    it('returns 200 when only imageUrls is provided', async () => {
      const req = makeRequest({ imageUrls: ['https://example.com/image.jpg'] });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.estimate).toBeDefined();
    });

    it('does not expose stack traces on 500 errors', async () => {
      // Simulate a malformed body that causes a parse error
      const req = new NextRequest('http://localhost/api/ai/dimensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-valid-json',
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('Dimension estimation failed');
      expect(JSON.stringify(data)).not.toContain('stack');
      expect(JSON.stringify(data)).not.toContain('at ');
    });
  });

  describe('Property 3: Response completeness — 2.2', () => {
    // Feature: ai-dimension-weight-generation, Property 3: Response completeness
    it('for any valid POST with at least title or imageUrls, response contains all seven fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.record({ title: fc.string({ minLength: 1 }) }),
            fc.record({ imageUrls: fc.array(fc.webUrl(), { minLength: 1, maxLength: 3 }) }),
            fc.record({
              title: fc.string({ minLength: 1 }),
              imageUrls: fc.array(fc.webUrl(), { minLength: 1, maxLength: 3 }),
            })
          ),
          async (body) => {
            const req = makeRequest(body);
            const res = await POST(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            const est = data.estimate;
            expect(typeof est.lengthCm).toBe('number');
            expect(typeof est.widthCm).toBe('number');
            expect(typeof est.heightCm).toBe('number');
            expect(typeof est.actualWeightKg).toBe('number');
            expect(typeof est.volumetricWeight).toBe('number');
            expect(typeof est.chargeableWeight).toBe('number');
            expect(typeof est.confidenceScore).toBe('number');
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
