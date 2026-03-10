import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from '../route';
import { NextRequest } from 'next/server';

// Mock Firebase
vi.mock('@/firebase', () => ({
  app: {}
}));

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  uploadBytes: vi.fn(() => Promise.resolve()),
  getDownloadURL: vi.fn(() => Promise.resolve('https://example.com/uploaded-file.jpg')),
  deleteObject: vi.fn(() => Promise.resolve())
}));

// Mock Sharp
vi.mock('sharp', () => {
  const mockSharp = vi.fn(() => ({
    metadata: vi.fn(() => Promise.resolve({ width: 800, height: 600 })),
    resize: vi.fn(() => ({
      jpeg: vi.fn(() => ({
        toBuffer: vi.fn(() => Promise.resolve(Buffer.from('processed-image')))
      }))
    }))
  }));
  return { default: mockSharp };
});

describe('/api/media/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('returns error when no file is provided', async () => {
      const formData = new FormData();
      formData.append('vendorId', 'test-vendor');
      formData.append('uploadType', 'logo');

      const request = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No file provided');
    });

    it('returns error when no vendorId is provided', async () => {
      const formData = new FormData();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('uploadType', 'logo');

      const request = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Vendor ID is required');
    });

    it('returns error for unsupported file type', async () => {
      const formData = new FormData();
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      formData.append('file', file);
      formData.append('vendorId', 'test-vendor');
      formData.append('uploadType', 'logo');

      const request = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unsupported file type. Please upload JPG, PNG, WebP, MP4, or WebM files.');
    });

    it('returns error for oversized image file', async () => {
      const formData = new FormData();
      // Create a file larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const file = new File([largeBuffer], 'large.jpg', { type: 'image/jpeg' });
      formData.append('file', file);
      formData.append('vendorId', 'test-vendor');
      formData.append('uploadType', 'logo');

      const request = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Image file too large. Maximum size is 10MB.');
    });
  });

  describe('DELETE', () => {
    it('returns error when filePath is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/media/upload?vendorId=test-vendor', {
        method: 'DELETE'
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('File path and vendor ID are required');
    });

    it('returns error when vendorId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/media/upload?filePath=test/path', {
        method: 'DELETE'
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('File path and vendor ID are required');
    });

    it('returns error for unauthorized file deletion', async () => {
      const request = new NextRequest('http://localhost:3000/api/media/upload?filePath=storefronts/other-vendor/logos/test.jpg&vendorId=test-vendor', {
        method: 'DELETE'
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized to delete this file');
    });
  });
});