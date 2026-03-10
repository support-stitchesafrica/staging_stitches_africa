import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveThemeConfiguration, getThemeConfiguration } from '../theme-service';
import { ThemeConfiguration } from '@/types/storefront';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockTheme: ThemeConfiguration = {
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
    headerStyle: 'modern',
    productCardStyle: 'card',
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

describe('Theme Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveThemeConfiguration', () => {
    it('should save theme configuration successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Theme configuration saved successfully'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await saveThemeConfiguration({
        vendorId: 'test-vendor',
        templateId: 'modern',
        theme: mockTheme
      });

      expect(fetch).toHaveBeenCalledWith('/api/storefront/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: 'test-vendor',
          templateId: 'modern',
          theme: mockTheme
        }),
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle save errors', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Validation failed',
        details: ['Invalid color format']
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse
      });

      const result = await saveThemeConfiguration({
        vendorId: 'test-vendor',
        templateId: 'modern',
        theme: mockTheme
      });

      expect(result).toEqual({
        success: false,
        error: 'Validation failed',
        details: ['Invalid color format']
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await saveThemeConfiguration({
        vendorId: 'test-vendor',
        templateId: 'modern',
        theme: mockTheme
      });

      expect(result).toEqual({
        success: false,
        error: 'Network error occurred while saving theme configuration'
      });
    });
  });

  describe('getThemeConfiguration', () => {
    it('should fetch theme configuration successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          templateId: 'modern',
          theme: mockTheme
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await getThemeConfiguration('test-vendor');

      expect(fetch).toHaveBeenCalledWith('/api/storefront/theme?vendorId=test-vendor', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result).toEqual(mockResponse);
    });

    it('should handle fetch errors', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Storefront not found'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse
      });

      const result = await getThemeConfiguration('test-vendor');

      expect(result).toEqual({
        success: false,
        error: 'Storefront not found'
      });
    });
  });
});