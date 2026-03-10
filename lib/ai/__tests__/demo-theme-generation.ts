/**
 * AI Theme Generation Demo
 * Demonstrates the AI theme generation functionality
 * 
 * **Feature: merchant-storefront-upgrade, Property 3: AI Theme Generation Pipeline**
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { AIThemeGenerator } from '../theme-generator';

async function demoThemeGeneration() {
  console.log('🎨 AI Theme Generation Demo\n');
  
  const themeGenerator = new AIThemeGenerator();
  
  // Demo 1: Color Palette Generation
  console.log('1. Generating color palettes from base color #3B82F6...');
  const palettes = themeGenerator.generateColorPalettes('#3B82F6');
  
  palettes.forEach((palette, index) => {
    console.log(`\n   ${palette.name} Palette:`);
    console.log(`   Primary: ${palette.colors.primary}`);
    console.log(`   Secondary: ${palette.colors.secondary}`);
    console.log(`   Accent: ${palette.colors.accent}`);
    console.log(`   Background: ${palette.colors.background}`);
    console.log(`   Text: ${palette.colors.text}`);
  });
  
  // Demo 2: Theme Generation (will use fallback without OpenAI API key)
  console.log('\n\n2. Generating theme from brand assets...');
  
  try {
    const generatedTheme = await themeGenerator.generateTheme({
      brandAssets: [
        {
          type: 'logo',
          url: 'https://example.com/logo.png',
          description: 'Modern tech company logo'
        }
      ],
      preferences: {
        style: 'modern',
        colors: ['#3B82F6']
      },
      businessInfo: {
        name: 'TechCorp',
        category: 'Technology',
        description: 'Innovative technology solutions'
      }
    });
    
    console.log('\n   Generated Theme:');
    console.log(`   Template ID: ${generatedTheme.templateId}`);
    console.log(`   Confidence: ${Math.round(generatedTheme.confidence * 100)}%`);
    console.log(`   Style Category: ${generatedTheme.analysis.style.category}`);
    console.log(`   Mood: ${generatedTheme.analysis.style.mood.join(', ')}`);
    console.log(`   Primary Color: ${generatedTheme.theme.colors.primary}`);
    console.log(`   Typography: ${generatedTheme.theme.typography.headingFont} / ${generatedTheme.theme.typography.bodyFont}`);
    console.log(`   Alternatives: ${generatedTheme.alternatives.length} options`);
    
  } catch (error) {
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  console.log('\n✅ Demo completed!');
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demoThemeGeneration().catch(console.error);
}

export { demoThemeGeneration };