import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

// Mock the storefront service
vi.mock('@/lib/storefront/storefront-service', () => ({
  getStorefrontByVendorId: vi.fn(),
  createStorefront: vi.fn(),
  updateStorefront: vi.fn(),
}));

describe('/api/storefront/config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return error when vendorId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/storefront/config');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Vendor ID is required');
    });

    it('should return storefront config when found', async () => {
      const mockStorefront = {
        id: 'test-id',
        vendorId: 'vendor-123',
        handle: 'test-store',
        isPublic: true,
        templateId: 'default'
      };

      const { getStorefrontByVendorId } = await import('@/lib/storefront/storefront-service');
      vi.mocked(getStorefrontByVendorId).mockResolvedValue(mockStorefront as any);

      const request = new NextRequest('http://localhost:3000/api/storefront/config?vendorId=vendor-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockStorefront);
    });

    it('should return null when storefront not found', async () => {
      const { getStorefrontByVendorId } = await import('@/lib/storefront/storefront-service');
      vi.mocked(getStorefrontByVendorId).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/storefront/config?vendorId=vendor-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeNull();
    });
  });

  describe('POST', () => {
    it('should return error when required fields are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/storefront/config', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Vendor ID and handle are required');
    });

    it('should create new storefront when none exists', async () => {
      const { getStorefrontByVendorId, createStorefront } = await import('@/lib/storefront/storefront-service');
      vi.mocked(getStorefrontByVendorId).mockResolvedValue(null);
      vi.mocked(createStorefront).mockResolvedValue('new-storefront-id');

      const request = new NextRequest('http://localhost:3000/api/storefront/config', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: 'vendor-123',
          handle: 'test-store',
          isPublic: true
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('new-storefront-id');
      expect(data.data.handle).toBe('test-store');
    });

    it('should update existing storefront', async () => {
      const mockExistingStorefront = {
        id: 'existing-id',
        vendorId: 'vendor-123',
        handle: 'old-handle',
        isPublic: false,
        templateId: 'default'
      };

      const { getStorefrontByVendorId, updateStorefront } = await import('@/lib/storefront/storefront-service');
      vi.mocked(getStorefrontByVendorId).mockResolvedValue(mockExistingStorefront as any);
      vi.mocked(updateStorefront).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/storefront/config', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: 'vendor-123',
          handle: 'new-handle',
          isPublic: true
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.handle).toBe('new-handle');
      expect(data.data.isPublic).toBe(true);
    });
  });
});