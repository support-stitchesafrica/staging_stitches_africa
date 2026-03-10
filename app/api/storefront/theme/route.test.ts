import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT, GET } from './route';

// Mock Firebase
vi.mock('@/firebase', () => ({
  db: {}
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ id: 'test-doc' })),
  getDoc: vi.fn(() => Promise.resolve({ 
    exists: () => true, 
    data: () => ({
      vendorId: 'vendor123',
      templateId: 'modern',
      theme: mockTheme,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  })),
  setDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => new Date())
}));

const mockTheme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#64748B',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#1F2937'
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    }
  },
  layout: {
    headerStyle: 'clean',
    productCardStyle: 'modern',
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    }
  },
  media: {}
};

describe('Storefront Theme API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PUT /api/storefront/theme', () => {
    it('should save theme configuration successfully', async () => {
      const request = {
        json: vi.fn(() => Promise.resolve({
          vendorId: 'vendor123',
          templateId: 'modern',
          theme: mockTheme
        }))
      } as unknown as NextRequest;

      const response = await PUT(request);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Theme configuration saved successfully');
    });

    it('should validate required fields', async () => {
      const request = {
        json: vi.fn(() => Promise.resolve({
          templateId: 'modern',
          theme: mockTheme
          // Missing vendorId
        }))
      } as unknown as NextRequest;

      const response = await PUT(request);
      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Vendor ID is required');
    });

    it('should validate theme configuration', async () => {
      const invalidTheme = {
        colors: {
          primary: '#3B82F6'
          // Missing required colors
        }
      };

      const request = {
        json: vi.fn(() => Promise.resolve({
          vendorId: 'vendor123',
          templateId: 'modern',
          theme: invalidTheme
        }))
      } as unknown as NextRequest;

      const response = await PUT(request);
      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid theme configuration');
      expect(result.details).toBeDefined();
    });
  });

  describe('GET /api/storefront/theme', () => {
    it('should fetch theme configuration successfully', async () => {
      const url = new URL('http://localhost:3000/api/storefront/theme?vendorId=vendor123');
      const request = { url: url.toString() } as NextRequest;

      const response = await GET(request);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.templateId).toBe('modern');
      expect(result.data.theme).toEqual(mockTheme);
    });

    it('should require vendor ID', async () => {
      const url = new URL('http://localhost:3000/api/storefront/theme');
      const request = { url: url.toString() } as NextRequest;

      const response = await GET(request);
      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Vendor ID is required');
    });
  });
});