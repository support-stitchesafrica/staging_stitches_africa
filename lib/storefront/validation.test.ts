import { 
  validateHandleFormat, 
  sanitizeHandle, 
  generateHandleSuggestions,
  validateThemeConfiguration,
  validateStorefrontConfig
} from './validation';
import type { StorefrontConfig, ThemeConfiguration } from './types';

describe('Storefront Validation', () => {
  describe('validateHandleFormat', () => {
    it('should validate correct handles', () => {
      const result = validateHandleFormat('my-shop');
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject handles that are too short', () => {
      const result = validateHandleFormat('ab');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Handle must be at least 3 characters long');
    });

    it('should reject handles with invalid characters', () => {
      const result = validateHandleFormat('my_shop!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Handle can only contain lowercase letters, numbers, and hyphens');
    });

    it('should reject reserved handles', () => {
      const result = validateHandleFormat('admin');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('This handle is reserved and cannot be used');
    });

    it('should reject handles with consecutive hyphens', () => {
      const result = validateHandleFormat('my--shop');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Handle cannot contain consecutive hyphens');
    });
  });

  describe('sanitizeHandle', () => {
    it('should sanitize input correctly', () => {
      expect(sanitizeHandle('My Shop!')).toBe('my-shop');
      expect(sanitizeHandle('test_store')).toBe('test-store');
      expect(sanitizeHandle('  fashion   boutique  ')).toBe('fashion-boutique');
    });

    it('should remove invalid characters', () => {
      expect(sanitizeHandle('shop@123')).toBe('shop123');
      expect(sanitizeHandle('my-shop$%^')).toBe('my-shop');
    });
  });

  describe('generateHandleSuggestions', () => {
    it('should generate valid suggestions', () => {
      const suggestions = generateHandleSuggestions('fashion store');
      expect(suggestions).toContain('fashion-store');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should avoid existing handles', () => {
      const existing = ['fashion-store', 'fashion-store-1'];
      const suggestions = generateHandleSuggestions('fashion store', existing);
      expect(suggestions).not.toContain('fashion-store');
      expect(suggestions).not.toContain('fashion-store-1');
    });
  });

  describe('validateThemeConfiguration', () => {
    it('should validate correct theme configuration', () => {
      const theme: Partial<ThemeConfiguration> = {
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          accent: '#0000ff',
          background: '#ffffff',
          text: '#000000'
        },
        typography: {
          headingFont: 'Arial',
          bodyFont: 'Helvetica',
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
        }
      };

      const result = validateThemeConfiguration(theme);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid color formats', () => {
      const theme: Partial<ThemeConfiguration> = {
        colors: {
          primary: 'invalid-color',
          secondary: '#00ff00',
          accent: '#0000ff',
          background: '#ffffff',
          text: '#000000'
        }
      };

      const result = validateThemeConfiguration(theme);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid color format for primary: invalid-color');
    });
  });

  describe('validateStorefrontConfig', () => {
    it('should validate correct storefront configuration', () => {
      const config: Partial<StorefrontConfig> = {
        vendorId: 'vendor123',
        handle: 'my-shop',
        templateId: 'template1'
      };

      const result = validateStorefrontConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require vendor ID', () => {
      const config: Partial<StorefrontConfig> = {
        handle: 'my-shop',
        templateId: 'template1'
      };

      const result = validateStorefrontConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Vendor ID is required');
    });

    it('should require handle', () => {
      const config: Partial<StorefrontConfig> = {
        vendorId: 'vendor123',
        templateId: 'template1'
      };

      const result = validateStorefrontConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Handle is required');
    });
  });
});