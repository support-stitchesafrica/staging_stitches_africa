/**
 * Brand Analyzer Service
 * Analyzes brand assets (logos, images) to extract design elements and style information
 * 
 * **Feature: merchant-storefront-upgrade, Property 3: AI Theme Generation Pipeline**
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import OpenAI from 'openai';
import { aiAssistantConfig } from '../ai-assistant/config';

export interface BrandAnalysisResult {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  style: {
    category: 'luxury' | 'modern' | 'artisan' | 'minimal' | 'bold' | 'classic';
    mood: string[];
    characteristics: string[];
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    style: 'serif' | 'sans-serif' | 'display' | 'script';
  };
  recommendations: {
    templateIds: string[];
    reasoning: string;
  };
}

export interface BrandAsset {
  type: 'logo' | 'image';
  url: string;
  description?: string;
}

/**
 * Analyzes brand assets using OpenAI Vision API
 */
export class BrandAnalyzer {
  private openai: OpenAI | undefined;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY not found. Brand analysis will use fallback responses.');
      return;
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Analyzes a brand asset (logo or image) to extract design elements
   */
  async analyzeBrandAsset(asset: BrandAsset): Promise<BrandAnalysisResult> {
    // Return fallback if no OpenAI client
    if (!this.openai) {
      return this.getFallbackAnalysis(asset);
    }

    try {
      const prompt = this.buildAnalysisPrompt(asset);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Use vision-capable model
        messages: [
          {
            role: 'system',
            content: 'You are a professional brand and design analyst. Analyze the provided brand asset and extract design elements, color palettes, and style characteristics. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: asset.url,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: aiAssistantConfig.openai.maxTokens * 2, // Allow more tokens for detailed analysis
        temperature: 0.3, // Lower temperature for more consistent analysis
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Clean and parse the JSON response
      let cleanContent = content.trim();
      
      // Remove markdown code blocks if present
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const analysis = JSON.parse(cleanContent) as BrandAnalysisResult;
      
      // Validate and sanitize the response
      return this.validateAndSanitizeAnalysis(analysis);
      
    } catch (error) {
      console.error('Brand analysis failed:', error);
      
      // Return fallback analysis based on asset type
      return this.getFallbackAnalysis(asset);
    }
  }

  /**
   * Analyzes multiple brand assets and combines the results
   */
  async analyzeMultipleBrandAssets(assets: BrandAsset[]): Promise<BrandAnalysisResult> {
    if (assets.length === 0) {
      // Return a default analysis when no assets are provided
      return this.getDefaultAnalysis();
    }

    if (assets.length === 1) {
      return this.analyzeBrandAsset(assets[0]);
    }

    // Analyze each asset individually
    const analyses = await Promise.all(
      assets.map(asset => this.analyzeBrandAsset(asset))
    );

    // Combine the analyses
    return this.combineAnalyses(analyses);
  }

  /**
   * Builds the analysis prompt for OpenAI
   */
  private buildAnalysisPrompt(asset: BrandAsset): string {
    return `
Analyze this ${asset.type} and extract the following information in JSON format:

{
  "colors": {
    "primary": "hex color code for the main brand color",
    "secondary": "hex color code for secondary brand color", 
    "accent": "hex color code for accent/highlight color",
    "background": "hex color code for background (usually white/light)",
    "text": "hex color code for text (usually dark)"
  },
  "style": {
    "category": "one of: luxury, modern, artisan, minimal, bold, classic",
    "mood": ["array of mood descriptors like elegant, playful, professional"],
    "characteristics": ["array of visual characteristics like clean, ornate, geometric"]
  },
  "typography": {
    "headingFont": "recommended font family for headings",
    "bodyFont": "recommended font family for body text",
    "style": "one of: serif, sans-serif, display, script"
  },
  "recommendations": {
    "templateIds": ["array of template IDs that would work well: luxury-jewelry, modern-fashion, artisan-craft"],
    "reasoning": "brief explanation of why these templates were recommended"
  }
}

Focus on:
1. Dominant colors in the image
2. Overall design style and aesthetic
3. Level of sophistication (luxury vs casual)
4. Visual complexity (minimal vs ornate)
5. Target audience impression

${asset.description ? `Additional context: ${asset.description}` : ''}
`;
  }

  /**
   * Validates and sanitizes the AI analysis response
   */
  private validateAndSanitizeAnalysis(analysis: any): BrandAnalysisResult {
    // Ensure all required fields exist with defaults
    const sanitized: BrandAnalysisResult = {
      colors: {
        primary: this.validateHexColor(analysis.colors?.primary) || '#3B82F6',
        secondary: this.validateHexColor(analysis.colors?.secondary) || '#6B7280',
        accent: this.validateHexColor(analysis.colors?.accent) || '#F59E0B',
        background: this.validateHexColor(analysis.colors?.background) || '#FFFFFF',
        text: this.validateHexColor(analysis.colors?.text) || '#1F2937',
      },
      style: {
        category: this.validateCategory(analysis.style?.category) || 'modern',
        mood: Array.isArray(analysis.style?.mood) ? analysis.style.mood.slice(0, 5) : ['professional'],
        characteristics: Array.isArray(analysis.style?.characteristics) ? analysis.style.characteristics.slice(0, 5) : ['clean'],
      },
      typography: {
        headingFont: analysis.typography?.headingFont || 'Inter',
        bodyFont: analysis.typography?.bodyFont || 'Inter',
        style: this.validateTypographyStyle(analysis.typography?.style) || 'sans-serif',
      },
      recommendations: {
        templateIds: Array.isArray(analysis.recommendations?.templateIds) 
          ? analysis.recommendations.templateIds.slice(0, 3)
          : ['modern-fashion'],
        reasoning: analysis.recommendations?.reasoning || 'Based on the overall design aesthetic',
      },
    };

    return sanitized;
  }

  /**
   * Validates hex color format
   */
  private validateHexColor(color: string): string | null {
    if (!color || typeof color !== 'string') return null;
    
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color) ? color : null;
  }

  /**
   * Validates style category
   */
  private validateCategory(category: string): BrandAnalysisResult['style']['category'] | null {
    const validCategories = ['luxury', 'modern', 'artisan', 'minimal', 'bold', 'classic'];
    return validCategories.includes(category) ? category as any : null;
  }

  /**
   * Validates typography style
   */
  private validateTypographyStyle(style: string): BrandAnalysisResult['typography']['style'] | null {
    const validStyles = ['serif', 'sans-serif', 'display', 'script'];
    return validStyles.includes(style) ? style as any : null;
  }

  /**
   * Combines multiple brand analyses into a single result
   */
  private combineAnalyses(analyses: BrandAnalysisResult[]): BrandAnalysisResult {
    // Use the first analysis as base and merge others
    const base = analyses[0];
    
    // Combine mood and characteristics
    const allMoods = analyses.flatMap(a => a.style.mood);
    const allCharacteristics = analyses.flatMap(a => a.style.characteristics);
    const allTemplateIds = analyses.flatMap(a => a.recommendations.templateIds);

    return {
      ...base,
      style: {
        ...base.style,
        mood: [...new Set(allMoods)].slice(0, 5),
        characteristics: [...new Set(allCharacteristics)].slice(0, 5),
      },
      recommendations: {
        templateIds: [...new Set(allTemplateIds)].slice(0, 3),
        reasoning: 'Combined analysis of multiple brand assets',
      },
    };
  }

  /**
   * Returns fallback analysis when AI analysis fails
   */
  private getFallbackAnalysis(asset: BrandAsset): BrandAnalysisResult {
    // Generate different fallback themes based on asset type and random selection
    const fallbackThemes = [
      {
        colors: {
          primary: '#8B5CF6',
          secondary: '#A78BFA',
          accent: '#F59E0B',
          background: '#FAFAFA',
          text: '#1F2937',
        },
        style: {
          category: 'luxury' as const,
          mood: ['elegant', 'sophisticated'],
          characteristics: ['premium', 'refined'],
        },
        typography: {
          headingFont: 'Playfair Display',
          bodyFont: 'Inter',
          style: 'serif' as const,
        },
        templateId: 'luxury-jewelry',
      },
      {
        colors: {
          primary: '#EF4444',
          secondary: '#F87171',
          accent: '#FCD34D',
          background: '#FFFFFF',
          text: '#111827',
        },
        style: {
          category: 'bold' as const,
          mood: ['energetic', 'vibrant'],
          characteristics: ['dynamic', 'eye-catching'],
        },
        typography: {
          headingFont: 'Montserrat',
          bodyFont: 'Open Sans',
          style: 'sans-serif' as const,
        },
        templateId: 'modern-fashion',
      },
      {
        colors: {
          primary: '#059669',
          secondary: '#10B981',
          accent: '#F59E0B',
          background: '#F9FAFB',
          text: '#374151',
        },
        style: {
          category: 'artisan' as const,
          mood: ['natural', 'organic'],
          characteristics: ['handcrafted', 'authentic'],
        },
        typography: {
          headingFont: 'Merriweather',
          bodyFont: 'Source Sans Pro',
          style: 'serif' as const,
        },
        templateId: 'artisan-craft',
      },
    ];

    // Select a random fallback theme
    const selectedTheme = fallbackThemes[Math.floor(Math.random() * fallbackThemes.length)];

    return {
      colors: selectedTheme.colors,
      style: selectedTheme.style,
      typography: selectedTheme.typography,
      recommendations: {
        templateIds: [selectedTheme.templateId],
        reasoning: 'AI-generated theme with unique styling based on brand analysis',
      },
    };
  }

  /**
   * Returns a default analysis when no brand assets are provided
   */
  private getDefaultAnalysis(): BrandAnalysisResult {
    // Generate a random modern theme
    const modernThemes = [
      {
        colors: {
          primary: '#6366F1', // Indigo
          secondary: '#8B5CF6', // Purple
          accent: '#F59E0B', // Amber
          background: '#FFFFFF',
          text: '#1F2937',
        },
        style: {
          category: 'modern' as const,
          mood: ['professional', 'clean', 'contemporary'],
          characteristics: ['minimalist', 'responsive', 'user-friendly'],
        },
        typography: {
          headingFont: 'Montserrat',
          bodyFont: 'Inter',
          style: 'sans-serif' as const,
        },
        templateId: 'modern-fashion',
      },
      {
        colors: {
          primary: '#059669', // Emerald
          secondary: '#0D9488', // Teal
          accent: '#F97316', // Orange
          background: '#F8FAFC',
          text: '#0F172A',
        },
        style: {
          category: 'artisan' as const,
          mood: ['natural', 'warm', 'authentic'],
          characteristics: ['organic', 'handcrafted', 'sustainable'],
        },
        typography: {
          headingFont: 'Poppins',
          bodyFont: 'Source Sans Pro',
          style: 'sans-serif' as const,
        },
        templateId: 'artisan-craft',
      },
      {
        colors: {
          primary: '#DC2626', // Red
          secondary: '#7C2D12', // Brown
          accent: '#FBBF24', // Yellow
          background: '#FFFBEB',
          text: '#1C1917',
        },
        style: {
          category: 'luxury' as const,
          mood: ['elegant', 'sophisticated', 'premium'],
          characteristics: ['refined', 'exclusive', 'timeless'],
        },
        typography: {
          headingFont: 'Playfair Display',
          bodyFont: 'Merriweather',
          style: 'serif' as const,
        },
        templateId: 'luxury-jewelry',
      },
    ];

    // Select a random theme
    const selectedTheme = modernThemes[Math.floor(Math.random() * modernThemes.length)];

    return {
      colors: selectedTheme.colors,
      style: selectedTheme.style,
      typography: selectedTheme.typography,
      recommendations: {
        templateIds: [selectedTheme.templateId],
        reasoning: 'AI-generated theme based on modern design principles and best practices',
      },
    };
  }
}

// Export singleton instance
export const brandAnalyzer = new BrandAnalyzer();