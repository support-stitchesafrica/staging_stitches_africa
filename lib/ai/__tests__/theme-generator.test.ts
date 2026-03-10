/**
 * AI Theme Generator Tests
 * Tests for the AI-powered theme generation functionality
 * 
 * **Feature: merchant-storefront-upgrade, Property 3: AI Theme Generation Pipeline**
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect } from 'vitest';
import { AIThemeGenerator } from '../theme-generator';

describe('AIThemeGenerator', () => {
  const themeGenerator = new AIThemeGenerator();

  describe('generateColorPalettes', () => {
    it('should generate multiple color palettes from base color', () => {
      const baseColor = '#3B82F6';
      const palettes = themeGenerator.generateColorPalettes(baseColor);

      expect(palettes).toBeInstanceOf(Array);
      expect(palettes.length).toBeGreaterThan(0);

      palettes.forEach(palette => {
        expect(palette).toMatchObject({
          name: expect.any(String),
          colors: expect.objectContaining({
            primary: expect.any(String),
            secondary: expect.any(String),
            accent: expect.any(String),
            background: expect.any(String),
            text: expect.any(String),
          }),
        });

        // Verify hex color format
        Object.values(palette.colors).forEach(color => {
          expect(color).toMatch(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
        });
      });
    });

    it('should include different palette types', () => {
      const baseColor = '#3B82F6';
      const palettes = themeGenerator.generateColorPalettes(baseColor);

      const paletteNames = palettes.map(p => p.name);
      expect(paletteNames).toContain('Monochromatic');
      expect(paletteNames).toContain('Complementary');
      expect(paletteNames).toContain('Triadic');
      expect(paletteNames).toContain('Analogous');
    });

    it('should generate valid hex colors for different base colors', () => {
      const testColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
      
      testColors.forEach(baseColor => {
        const palettes = themeGenerator.generateColorPalettes(baseColor);
        
        expect(palettes.length).toBeGreaterThan(0);
        
        palettes.forEach(palette => {
          Object.values(palette.colors).forEach(color => {
            expect(color).toMatch(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
          });
        });
      });
    });
  });

  describe('generateColorPalettes', () => {
    it('should generate multiple color palettes from base color', () => {
      const baseColor = '#3B82F6';
      const palettes = themeGenerator.generateColorPalettes(baseColor);

      expect(palettes).toBeInstanceOf(Array);
      expect(palettes.length).toBeGreaterThan(0);

      palettes.forEach(palette => {
        expect(palette).toMatchObject({
          name: expect.any(String),
          colors: expect.objectContaining({
            primary: expect.any(String),
            secondary: expect.any(String),
            accent: expect.any(String),
            background: expect.any(String),
            text: expect.any(String),
          }),
        });

        // Verify hex color format
        Object.values(palette.colors).forEach(color => {
          expect(color).toMatch(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/);
        });
      });
    });

    it('should include different palette types', () => {
      const baseColor = '#3B82F6';
      const palettes = themeGenerator.generateColorPalettes(baseColor);

      const paletteNames = palettes.map(p => p.name);
      expect(paletteNames).toContain('Monochromatic');
      expect(paletteNames).toContain('Complementary');
      expect(paletteNames).toContain('Triadic');
      expect(paletteNames).toContain('Analogous');
    });
  });
});