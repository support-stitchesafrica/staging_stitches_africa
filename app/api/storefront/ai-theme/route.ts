/**
 * AI Theme Generation API
 * Handles AI-powered theme generation requests for merchant storefronts
 * 
 * **Feature: merchant-storefront-upgrade, Property 3: AI Theme Generation Pipeline**
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiThemeGenerator, ThemeGenerationRequest } from '@/lib/ai/theme-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { brandAssets = [] } = body;
    
    // Brand assets are optional - we can generate themes without them
    if (brandAssets && !Array.isArray(brandAssets)) {
      return NextResponse.json(
        { error: 'brandAssets must be an array' },
        { status: 400 }
      );
    }

    // Validate brand assets if provided
    if (brandAssets && brandAssets.length > 0) {
      for (const asset of brandAssets) {
        if (!asset.url || !asset.type) {
          return NextResponse.json(
            { error: 'Each brand asset must have a url and type' },
            { status: 400 }
          );
        }
        
        if (!['logo', 'image'].includes(asset.type)) {
          return NextResponse.json(
            { error: 'Asset type must be either "logo" or "image"' },
            { status: 400 }
          );
        }
      }
    }

    // Create theme generation request
    const themeRequest: ThemeGenerationRequest = {
      brandAssets,
      preferences: body.preferences,
      businessInfo: body.businessInfo,
    };

    // Generate theme using AI
    const generatedTheme = await aiThemeGenerator.generateTheme(themeRequest);

    return NextResponse.json({
      success: true,
      data: generatedTheme,
    });
    
  } catch (error) {
    console.error('AI theme generation error:', error);
    
    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate theme. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseColor = searchParams.get('baseColor');
    
    if (!baseColor) {
      return NextResponse.json(
        { error: 'baseColor parameter is required' },
        { status: 400 }
      );
    }

    // Validate hex color format
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(baseColor)) {
      return NextResponse.json(
        { error: 'baseColor must be a valid hex color (e.g., #FF0000)' },
        { status: 400 }
      );
    }

    // Generate color palettes
    const palettes = aiThemeGenerator.generateColorPalettes(baseColor);

    return NextResponse.json({
      success: true,
      data: {
        baseColor,
        palettes,
      },
    });
    
  } catch (error) {
    console.error('Color palette generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate color palettes' },
      { status: 500 }
    );
  }
}