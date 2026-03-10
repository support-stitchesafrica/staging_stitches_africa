/**
 * AI Theme Generator Service
 * Generates complete storefront themes based on brand analysis and user preferences
 * 
 * **Feature: merchant-storefront-upgrade, Property 3: AI Theme Generation Pipeline**
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { ThemeConfiguration, StorefrontTemplate } from '@/types/storefront';
import { BrandAnalysisResult, brandAnalyzer, BrandAsset } from './brand-analyzer';

export interface ThemeGenerationRequest {
  brandAssets: BrandAsset[];
  preferences?: {
    style?: 'luxury' | 'modern' | 'artisan' | 'minimal' | 'bold' | 'classic';
    colors?: string[];
    templateId?: string;
  };
  businessInfo?: {
    name: string;
    category: string;
    description?: string;
  };
}

export interface GeneratedTheme {
  theme: ThemeConfiguration;
  templateId: string;
  analysis: BrandAnalysisResult;
  confidence: number;
  alternatives: Array<{
    theme: ThemeConfiguration;
    templateId: string;
    reasoning: string;
  }>;
}

/**
 * AI-powered theme generator
 */
export class AIThemeGenerator {
  /**
   * Generates a complete theme based on brand assets and preferences
   */
  async generateTheme(request: ThemeGenerationRequest): Promise<GeneratedTheme> {
    try {
      // Step 1: Analyze brand assets
      const analysis = await brandAnalyzer.analyzeMultipleBrandAssets(request.brandAssets);
      
      // Step 2: Apply user preferences
      const refinedAnalysis = this.applyUserPreferences(analysis, request.preferences);
      
      // Step 3: Generate primary theme
      const primaryTheme = this.createThemeFromAnalysis(refinedAnalysis);
      const primaryTemplateId = this.selectBestTemplate(refinedAnalysis, request.preferences?.templateId);
      
      // Step 4: Generate alternative themes
      const alternatives = this.generateAlternativeThemes(refinedAnalysis);
      
      // Step 5: Calculate confidence score
      const confidence = this.calculateConfidence(analysis, request);
      
      return {
        theme: primaryTheme,
        templateId: primaryTemplateId,
        analysis: refinedAnalysis,
        confidence,
        alternatives,
      };
      
    } catch (error) {
      console.error('Theme generation failed:', error);
      
      // Return fallback theme
      return this.getFallbackTheme(request);
    }
  }

  /**
   * Generates complementary color palettes
   */
  generateColorPalettes(baseColor: string): Array<{
    name: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
  }> {
    const palettes = [];
    
    // Convert hex to HSL for manipulation
    const hsl = this.hexToHsl(baseColor);
    
    // Luxury Dark palette
    palettes.push({
      name: 'Luxury Dark',
      colors: {
        primary: baseColor,
        secondary: this.hslToHex(hsl.h, Math.max(hsl.s - 0.3, 0.2), Math.max(hsl.l - 0.4, 0.1)),
        accent: '#D4AF37', // Gold accent
        background: '#0F0F0F',
        text: '#F8F9FA',
      },
    });
    
    // Vibrant Modern palette
    palettes.push({
      name: 'Vibrant Modern',
      colors: {
        primary: this.hslToHex(hsl.h, Math.min(hsl.s + 0.2, 1), Math.min(hsl.l + 0.1, 0.6)),
        secondary: this.hslToHex((hsl.h + 60) % 360, hsl.s * 0.8, hsl.l),
        accent: this.hslToHex((hsl.h + 180) % 360, Math.min(hsl.s + 0.3, 1), 0.5),
        background: '#FFFFFF',
        text: '#1A1A1A',
      },
    });
    
    // Earthy Natural palette
    palettes.push({
      name: 'Earthy Natural',
      colors: {
        primary: this.hslToHex((hsl.h + 30) % 360, Math.max(hsl.s - 0.2, 0.3), Math.max(hsl.l - 0.1, 0.3)),
        secondary: '#8B7355', // Warm brown
        accent: '#DEB887', // Burlywood
        background: '#FFF8DC', // Cornsilk
        text: '#2F2F2F',
      },
    });
    
    // Cool Minimal palette
    palettes.push({
      name: 'Cool Minimal',
      colors: {
        primary: this.hslToHex(210, 0.6, 0.5), // Cool blue
        secondary: this.hslToHex(210, 0.3, 0.7), // Light blue-gray
        accent: this.hslToHex((hsl.h + 45) % 360, 0.8, 0.6),
        background: '#F8FAFC',
        text: '#334155',
      },
    });
    
    // Warm Artisan palette
    palettes.push({
      name: 'Warm Artisan',
      colors: {
        primary: this.hslToHex(25, 0.7, 0.4), // Warm orange-brown
        secondary: this.hslToHex(45, 0.5, 0.6), // Warm tan
        accent: this.hslToHex(15, 0.8, 0.5), // Terracotta
        background: '#FFFBF7',
        text: '#3C2415',
      },
    });
    
    // Bold Electric palette
    palettes.push({
      name: 'Bold Electric',
      colors: {
        primary: this.hslToHex(300, 0.8, 0.5), // Magenta
        secondary: this.hslToHex(180, 0.7, 0.4), // Teal
        accent: this.hslToHex(60, 0.9, 0.5), // Electric yellow
        background: '#FAFAFA',
        text: '#1F1F1F',
      },
    });
    
    return palettes;
  }

  /**
   * Applies user preferences to the brand analysis
   */
  private applyUserPreferences(
    analysis: BrandAnalysisResult,
    preferences?: ThemeGenerationRequest['preferences']
  ): BrandAnalysisResult {
    if (!preferences) return analysis;
    
    const refined = { ...analysis };
    
    // Override style category if specified
    if (preferences.style) {
      refined.style.category = preferences.style;
    }
    
    // Override colors if specified
    if (preferences.colors && preferences.colors.length > 0) {
      refined.colors.primary = preferences.colors[0];
      if (preferences.colors[1]) refined.colors.secondary = preferences.colors[1];
      if (preferences.colors[2]) refined.colors.accent = preferences.colors[2];
    }
    
    // Override template recommendation if specified
    if (preferences.templateId) {
      refined.recommendations.templateIds = [preferences.templateId];
    }
    
    return refined;
  }

  /**
   * Creates a theme configuration from brand analysis
   */
  private createThemeFromAnalysis(analysis: BrandAnalysisResult): ThemeConfiguration {
    return {
      colors: analysis.colors,
      typography: {
        headingFont: analysis.typography.headingFont,
        bodyFont: analysis.typography.bodyFont,
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
        },
      },
      layout: {
        headerStyle: this.getHeaderStyleForCategory(analysis.style.category),
        productCardStyle: this.getProductCardStyleForCategory(analysis.style.category),
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
        },
      },
      media: {},
    };
  }

  /**
   * Selects the best template based on analysis and preferences
   */
  private selectBestTemplate(
    analysis: BrandAnalysisResult,
    preferredTemplateId?: string
  ): string {
    if (preferredTemplateId) {
      return preferredTemplateId;
    }
    
    // Return the first recommended template or fallback
    return analysis.recommendations.templateIds[0] || 'modern-fashion';
  }

  /**
   * Generates alternative theme variations
   */
  private generateAlternativeThemes(analysis: BrandAnalysisResult): Array<{
    theme: ThemeConfiguration;
    templateId: string;
    reasoning: string;
  }> {
    const alternatives = [];
    
    // Generate diverse color variations
    const colorPalettes = this.generateColorPalettes(analysis.colors.primary);
    
    // Select 3 most distinct palettes
    const selectedPalettes = [
      colorPalettes[0], // Luxury Dark
      colorPalettes[1], // Vibrant Modern
      colorPalettes[2], // Earthy Natural
    ];
    
    selectedPalettes.forEach((palette, index) => {
      // Create theme with different typography for each alternative
      const altTypography = this.getAlternativeTypography(index);
      const altTheme = this.createThemeFromAnalysis({
        ...analysis,
        colors: palette.colors,
        typography: {
          ...analysis.typography,
          ...altTypography,
        },
      });
      
      // Use different templates for variety
      const templateIds = ['luxury-jewelry', 'modern-fashion', 'artisan-craft'];
      const templateId = templateIds[index] || analysis.recommendations.templateIds[0] || 'modern-fashion';
      
      alternatives.push({
        theme: altTheme,
        templateId,
        reasoning: `${palette.name} theme with ${altTypography.headingFont} typography`,
      });
    });
    
    return alternatives;
  }

  /**
   * Gets alternative typography combinations
   */
  private getAlternativeTypography(index: number): { headingFont: string; bodyFont: string } {
    const typographyCombinations = [
      { headingFont: 'Playfair Display', bodyFont: 'Source Sans Pro' }, // Elegant
      { headingFont: 'Montserrat', bodyFont: 'Open Sans' }, // Modern
      { headingFont: 'Merriweather', bodyFont: 'Lora' }, // Classic
    ];
    
    return typographyCombinations[index] || typographyCombinations[0];
  }

  /**
   * Calculates confidence score for the generated theme
   */
  private calculateConfidence(
    analysis: BrandAnalysisResult,
    request: ThemeGenerationRequest
  ): number {
    let confidence = 0.7; // Base confidence
    
    // Increase confidence if we have multiple brand assets
    if (request.brandAssets.length > 1) {
      confidence += 0.1;
    }
    
    // Increase confidence if user provided preferences
    if (request.preferences) {
      confidence += 0.1;
    }
    
    // Increase confidence if business info is provided
    if (request.businessInfo) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Returns fallback theme when generation fails
   */
  private getFallbackTheme(request: ThemeGenerationRequest): GeneratedTheme {
    // Generate multiple fallback themes based on preferences
    const style = request.preferences?.style || 'modern';
    const fallbackThemes = this.generateFallbackThemes(style);
    
    const primaryTheme = fallbackThemes[0];
    const alternatives = fallbackThemes.slice(1).map((theme, index) => ({
      theme: theme.theme,
      templateId: theme.templateId,
      reasoning: theme.reasoning,
    }));

    return {
      theme: primaryTheme.theme,
      templateId: primaryTheme.templateId,
      analysis: {
        colors: primaryTheme.theme.colors,
        style: {
          category: style,
          mood: ['professional', 'modern'],
          characteristics: ['clean', 'responsive'],
        },
        typography: {
          headingFont: primaryTheme.theme.typography.headingFont,
          bodyFont: primaryTheme.theme.typography.bodyFont,
          style: 'sans-serif',
        },
        recommendations: {
          templateIds: [primaryTheme.templateId],
          reasoning: `Fallback ${style} theme recommendation`,
        },
      },
      confidence: 0.6,
      alternatives,
    };
  }

  /**
   * Generates fallback themes for different styles
   */
  private generateFallbackThemes(style: string): Array<{
    theme: ThemeConfiguration;
    templateId: string;
    reasoning: string;
  }> {
    const baseLayout = {
      headerStyle: 'modern-clean',
      productCardStyle: 'minimal-card',
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
      },
    };

    const baseSizes = {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    };

    const themes = [
      {
        theme: {
          colors: {
            primary: '#6366F1', // Indigo
            secondary: '#8B5CF6', // Purple
            accent: '#F59E0B', // Amber
            background: '#FFFFFF',
            text: '#1F2937',
          },
          typography: {
            headingFont: 'Montserrat',
            bodyFont: 'Inter',
            sizes: baseSizes,
          },
          layout: baseLayout,
          media: {},
        },
        templateId: 'modern-fashion',
        reasoning: 'Modern vibrant theme with clean typography',
      },
      {
        theme: {
          colors: {
            primary: '#059669', // Emerald
            secondary: '#0D9488', // Teal
            accent: '#F97316', // Orange
            background: '#F8FAFC',
            text: '#0F172A',
          },
          typography: {
            headingFont: 'Poppins',
            bodyFont: 'Source Sans Pro',
            sizes: baseSizes,
          },
          layout: baseLayout,
          media: {},
        },
        templateId: 'artisan-craft',
        reasoning: 'Natural earth-tone theme with friendly typography',
      },
      {
        theme: {
          colors: {
            primary: '#DC2626', // Red
            secondary: '#7C2D12', // Brown
            accent: '#FBBF24', // Yellow
            background: '#FFFBEB',
            text: '#1C1917',
          },
          typography: {
            headingFont: 'Playfair Display',
            bodyFont: 'Merriweather',
            sizes: baseSizes,
          },
          layout: baseLayout,
          media: {},
        },
        templateId: 'luxury-jewelry',
        reasoning: 'Bold luxury theme with elegant serif typography',
      },
    ];

    return themes;
  }

  /**
   * Gets header style for category
   */
  private getHeaderStyleForCategory(category: string): string {
    const styleMap: Record<string, string> = {
      luxury: 'luxury',
      modern: 'modern-clean',
      artisan: 'artisan',
      minimal: 'minimal',
      bold: 'bold',
      classic: 'classic',
    };
    
    return styleMap[category] || 'modern-clean';
  }

  /**
   * Gets product card style for category
   */
  private getProductCardStyleForCategory(category: string): string {
    const styleMap: Record<string, string> = {
      luxury: 'elegant',
      modern: 'minimal-card',
      artisan: 'warm-card',
      minimal: 'minimal-card',
      bold: 'bold-card',
      classic: 'classic-card',
    };
    
    return styleMap[category] || 'minimal-card';
  }

  /**
   * Converts hex color to HSL
   */
  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s, l };
  }

  /**
   * Converts HSL to hex color
   */
  private hslToHex(h: number, s: number, l: number): string {
    h = h / 360;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
}

// Export singleton instance
export const aiThemeGenerator = new AIThemeGenerator();