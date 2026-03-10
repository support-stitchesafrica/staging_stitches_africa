/**
 * Tests for AI Shopping Assistant Prompts
 */

import { describe, it, expect } from 'vitest';
import {
  buildSystemPrompt,
  getSpecializedPrompt,
  fillPromptTemplate,
  validatePromptLength,
  truncatePrompt,
  BASE_SYSTEM_PROMPT,
  PRODUCT_RECOMMENDATION_PROMPT,
  SIZING_ADVICE_PROMPT,
  AVATAR_CREATION_PROMPT,
  VENDOR_RECOMMENDATION_PROMPT,
} from '../prompts';
import { ChatContext } from '../openai-service';

describe('AI Shopping Assistant Prompts', () => {
  describe('Base System Prompt', () => {
    it('should contain core assistant personality', () => {
      expect(BASE_SYSTEM_PROMPT).toContain('Stitches Africa');
      expect(BASE_SYSTEM_PROMPT).toContain('shopping assistant');
      expect(BASE_SYSTEM_PROMPT).toContain('friendly');
    });

    it('should include special format instructions', () => {
      expect(BASE_SYSTEM_PROMPT).toContain('[PRODUCT:product_id]');
      expect(BASE_SYSTEM_PROMPT).toContain('[VENDOR:vendor_id]');
      expect(BASE_SYSTEM_PROMPT).toContain('[ACTION:');
    });

    it('should define core responsibilities', () => {
      expect(BASE_SYSTEM_PROMPT).toContain('discover products');
      expect(BASE_SYSTEM_PROMPT).toContain('sizing advice');
      expect(BASE_SYSTEM_PROMPT).toContain('recommendations');
    });
  });

  describe('Product Recommendation Prompt', () => {
    it('should include recommendation guidelines', () => {
      expect(PRODUCT_RECOMMENDATION_PROMPT).toContain('Product Recommendation');
      expect(PRODUCT_RECOMMENDATION_PROMPT).toContain('budget');
      expect(PRODUCT_RECOMMENDATION_PROMPT).toContain('style');
      expect(PRODUCT_RECOMMENDATION_PROMPT).toContain('occasion');
    });

    it('should include filtering logic', () => {
      expect(PRODUCT_RECOMMENDATION_PROMPT).toContain('Filtering Logic');
      expect(PRODUCT_RECOMMENDATION_PROMPT).toContain('availability');
    });
  });

  describe('Sizing Advice Prompt', () => {
    it('should include sizing guidelines', () => {
      expect(SIZING_ADVICE_PROMPT).toContain('Sizing Assistance');
      expect(SIZING_ADVICE_PROMPT).toContain('height');
      expect(SIZING_ADVICE_PROMPT).toContain('body type');
    });

    it('should include size conversion reference', () => {
      expect(SIZING_ADVICE_PROMPT).toContain('Size Conversion');
      expect(SIZING_ADVICE_PROMPT).toContain('XS:');
      expect(SIZING_ADVICE_PROMPT).toContain('Bust');
      expect(SIZING_ADVICE_PROMPT).toContain('Waist');
      expect(SIZING_ADVICE_PROMPT).toContain('Hips');
    });

    it('should mention virtual try-on', () => {
      expect(SIZING_ADVICE_PROMPT).toContain('virtual try-on');
      expect(SIZING_ADVICE_PROMPT).toContain('avatar');
    });
  });

  describe('Avatar Creation Prompt', () => {
    it('should include avatar creation guidelines', () => {
      expect(AVATAR_CREATION_PROMPT).toContain('Avatar Creation');
      expect(AVATAR_CREATION_PROMPT).toContain('height');
      expect(AVATAR_CREATION_PROMPT).toContain('body type');
      expect(AVATAR_CREATION_PROMPT).toContain('skin tone');
    });

    it('should include height conversions', () => {
      expect(AVATAR_CREATION_PROMPT).toContain('Height Conversions');
      expect(AVATAR_CREATION_PROMPT).toContain('Petite');
      expect(AVATAR_CREATION_PROMPT).toContain('Average');
      expect(AVATAR_CREATION_PROMPT).toContain('Tall');
    });

    it('should include body type mapping', () => {
      expect(AVATAR_CREATION_PROMPT).toContain('Body Type Mapping');
      expect(AVATAR_CREATION_PROMPT).toContain('slim');
      expect(AVATAR_CREATION_PROMPT).toContain('athletic');
      expect(AVATAR_CREATION_PROMPT).toContain('curvy');
      expect(AVATAR_CREATION_PROMPT).toContain('plus-size');
    });
  });

  describe('Vendor Recommendation Prompt', () => {
    it('should include vendor recommendation guidelines', () => {
      expect(VENDOR_RECOMMENDATION_PROMPT).toContain('Vendor Recommendation');
      expect(VENDOR_RECOMMENDATION_PROMPT).toContain('rating');
      expect(VENDOR_RECOMMENDATION_PROMPT).toContain('location');
      expect(VENDOR_RECOMMENDATION_PROMPT).toContain('specialties');
    });

    it('should prioritize quality vendors', () => {
      expect(VENDOR_RECOMMENDATION_PROMPT).toContain('4.0+');
      expect(VENDOR_RECOMMENDATION_PROMPT).toContain('verified');
    });
  });

  describe('buildSystemPrompt', () => {
    it('should build a complete prompt without context', () => {
      const prompt = buildSystemPrompt();
      
      expect(prompt).toContain('Stitches Africa');
      expect(prompt).toContain('Product Recommendation');
      expect(prompt).toContain('Sizing Assistance');
      expect(prompt).toContain('Avatar Creation');
      expect(prompt).toContain('Vendor Recommendation');
    });

    it('should include budget context when provided', () => {
      const context: ChatContext = {
        messages: [],
        budget: 50000,
      };
      
      const prompt = buildSystemPrompt(context);
      
      expect(prompt).toContain('50,000');
      expect(prompt).toContain('budget');
    });

    it('should include preferences context when provided', () => {
      const context: ChatContext = {
        messages: [],
        preferences: { style: 'traditional', color: 'blue' },
      };
      
      const prompt = buildSystemPrompt(context);
      
      expect(prompt).toContain('preferences');
      expect(prompt).toContain('traditional');
    });

    it('should include shopping history context', () => {
      const context: ChatContext = {
        messages: [],
        viewedProducts: ['prod1', 'prod2', 'prod3'],
        addedToCart: ['prod1'],
      };
      
      const prompt = buildSystemPrompt(context);
      
      expect(prompt).toContain('3');
      expect(prompt).toContain('viewed');
      expect(prompt).toContain('cart');
    });

    it('should handle new session context', () => {
      const context: ChatContext = {
        messages: [],
      };
      
      const prompt = buildSystemPrompt(context);
      
      expect(prompt).toContain('New session');
      expect(prompt).toContain('Welcome');
    });
  });

  describe('getSpecializedPrompt', () => {
    it('should return welcome prompt', () => {
      const prompt = getSpecializedPrompt('welcome');
      
      expect(prompt).toContain('Welcome');
      expect(prompt).toContain('help');
    });

    it('should return sizing prompt', () => {
      const prompt = getSpecializedPrompt('sizing');
      
      expect(prompt).toContain('sizing');
      expect(prompt).toContain('measurements');
    });

    it('should return checkout prompt', () => {
      const prompt = getSpecializedPrompt('checkout');
      
      expect(prompt).toContain('checkout');
      expect(prompt).toContain('cart');
    });

    it('should return help prompt', () => {
      const prompt = getSpecializedPrompt('help');
      
      expect(prompt).toContain('assistance');
      expect(prompt).toContain('help');
    });
  });

  describe('fillPromptTemplate', () => {
    it('should fill cart reminder template', () => {
      const result = fillPromptTemplate('cartReminder', { count: 3 });
      
      expect(result).toContain('3 item(s)');
      expect(result).toContain('cart');
    });

    it('should handle template without variables', () => {
      const result = fillPromptTemplate('noResults');
      
      expect(result).toContain('similar options');
    });
  });

  describe('validatePromptLength', () => {
    it('should validate short prompts', () => {
      const shortPrompt = 'This is a short prompt';
      
      expect(validatePromptLength(shortPrompt, 4000)).toBe(true);
    });

    it('should reject very long prompts', () => {
      const longPrompt = 'a'.repeat(20000);
      
      expect(validatePromptLength(longPrompt, 4000)).toBe(false);
    });

    it('should use default max tokens', () => {
      const mediumPrompt = 'a'.repeat(10000);
      
      expect(validatePromptLength(mediumPrompt)).toBe(true);
    });
  });

  describe('truncatePrompt', () => {
    it('should not truncate short prompts', () => {
      const shortPrompt = 'This is a short prompt';
      const result = truncatePrompt(shortPrompt, 4000);
      
      expect(result).toBe(shortPrompt);
    });

    it('should truncate long prompts', () => {
      const longPrompt = 'a'.repeat(20000);
      const result = truncatePrompt(longPrompt, 1000);
      
      expect(result.length).toBeLessThan(longPrompt.length);
      expect(result.length).toBeLessThanOrEqual(1000 * 4);
    });

    it('should try to truncate at paragraph breaks', () => {
      const prompt = 'First paragraph.\n\nSecond paragraph.\n\n' + 'a'.repeat(20000);
      const result = truncatePrompt(prompt, 100);
      
      expect(result).toContain('First paragraph');
    });
  });

  describe('Prompt Integration', () => {
    it('should create a complete system prompt with all components', () => {
      const context: ChatContext = {
        messages: [],
        userId: 'user123',
        budget: 75000,
        preferences: { style: 'modern', occasion: 'wedding' },
        viewedProducts: ['prod1', 'prod2'],
        addedToCart: ['prod1'],
      };
      
      const prompt = buildSystemPrompt(context);
      
      // Should include all major components
      expect(prompt).toContain('Stitches Africa');
      expect(prompt).toContain('Product Recommendation');
      expect(prompt).toContain('Sizing Assistance');
      expect(prompt).toContain('Avatar Creation');
      expect(prompt).toContain('Vendor Recommendation');
      
      // Should include context
      expect(prompt).toContain('75,000');
      expect(prompt).toContain('modern');
      expect(prompt).toContain('wedding');
      expect(prompt).toContain('2');
      expect(prompt).toContain('1');
    });

    it('should be within reasonable token limits', () => {
      const context: ChatContext = {
        messages: [],
        budget: 50000,
        preferences: { style: 'traditional' },
      };
      
      const prompt = buildSystemPrompt(context);
      
      // Should be under 8000 tokens (32000 chars)
      expect(prompt.length).toBeLessThan(32000);
    });
  });
});
