/**
 * Response Parser Integration Tests
 * 
 * Tests for parsing AI responses and extracting structured data
 */

import { describe, it, expect } from 'vitest';
import { parseAIResponse } from '../response-parser';

describe('Response Parser Integration', () => {
  describe('Product ID Extraction', () => {
    it('should extract single product ID from response', () => {
      const response = 'Check out this beautiful dress [PRODUCT:dress_001]';
      const parsed = parseAIResponse(response);
      
      expect(parsed.productIds).toEqual(['dress_001']);
      expect(parsed.cleanMessage).not.toContain('[PRODUCT:');
    });

    it('should extract multiple product IDs', () => {
      const response = 'Here are some options: [PRODUCT:prod1], [PRODUCT:prod2], and [PRODUCT:prod3]';
      const parsed = parseAIResponse(response);
      
      expect(parsed.productIds).toHaveLength(3);
      expect(parsed.productIds).toEqual(['prod1', 'prod2', 'prod3']);
    });

    it('should handle product IDs with special characters', () => {
      const response = 'Product: [PRODUCT:prod-123_abc-xyz]';
      const parsed = parseAIResponse(response);
      
      expect(parsed.productIds).toContain('prod-123_abc-xyz');
    });
  });

  describe('Vendor ID Extraction', () => {
    it('should extract vendor IDs from response', () => {
      const response = 'Visit this vendor [VENDOR:vendor_123] for great products';
      const parsed = parseAIResponse(response);
      
      expect(parsed.vendorIds).toEqual(['vendor_123']);
    });

    it('should extract multiple vendor IDs', () => {
      const response = 'Top vendors: [VENDOR:v1], [VENDOR:v2], [VENDOR:v3]';
      const parsed = parseAIResponse(response);
      
      expect(parsed.vendorIds).toHaveLength(3);
    });
  });

  describe('Action Extraction', () => {
    it('should parse simple action', () => {
      const response = 'Click here [ACTION:view_cart]';
      const parsed = parseAIResponse(response);
      
      expect(parsed.actions).toHaveLength(1);
      expect(parsed.actions[0].type).toBe('view_cart');
    });

    it('should parse action with data', () => {
      const response = 'Add this [ACTION:add_to_cart:productId=prod_123:size=M]';
      const parsed = parseAIResponse(response);
      
      expect(parsed.actions).toHaveLength(1);
      expect(parsed.actions[0].type).toBe('add_to_cart');
      expect(parsed.actions[0].data).toEqual({
        productId: 'prod_123',
        size: 'M',
      });
    });

    it('should parse multiple actions', () => {
      const response = '[ACTION:view:id=1] or [ACTION:add:id=2]';
      const parsed = parseAIResponse(response);
      
      expect(parsed.actions).toHaveLength(2);
    });
  });

  describe('Message Cleaning', () => {
    it('should remove all markers from message', () => {
      const response = 'Check [PRODUCT:p1] from [VENDOR:v1] [ACTION:view]';
      const parsed = parseAIResponse(response);
      
      expect(parsed.cleanMessage).not.toContain('[PRODUCT:');
      expect(parsed.cleanMessage).not.toContain('[VENDOR:');
      expect(parsed.cleanMessage).not.toContain('[ACTION:');
    });

    it('should normalize whitespace', () => {
      const response = 'Text   [PRODUCT:p1]   with   spaces';
      const parsed = parseAIResponse(response);
      
      expect(parsed.cleanMessage).toBe('Text with spaces');
    });
  });

  describe('Complex Responses', () => {
    it('should handle real-world AI response', () => {
      const response = `
        I found these beautiful dresses for you:
        
        1. Traditional Ankara Dress [PRODUCT:dress_001] - $25,000
        2. Modern Kaftan [PRODUCT:dress_002] - $30,000
        
        These are from highly-rated vendor [VENDOR:tailor_lagos_01].
        
        Would you like to add one to your cart? [ACTION:add_to_cart:productId=dress_001:size=M]
      `;
      
      const parsed = parseAIResponse(response);
      
      expect(parsed.productIds).toHaveLength(2);
      expect(parsed.vendorIds).toHaveLength(1);
      expect(parsed.actions).toHaveLength(1);
      expect(parsed.cleanMessage).toContain('Traditional Ankara Dress');
      expect(parsed.cleanMessage).not.toContain('[PRODUCT:');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response', () => {
      const parsed = parseAIResponse('');
      
      expect(parsed.productIds).toEqual([]);
      expect(parsed.vendorIds).toEqual([]);
      expect(parsed.actions).toEqual([]);
      expect(parsed.cleanMessage).toBe('');
    });

    it('should handle response with no markers', () => {
      const response = 'Just a regular message';
      const parsed = parseAIResponse(response);
      
      expect(parsed.productIds).toEqual([]);
      expect(parsed.vendorIds).toEqual([]);
      expect(parsed.actions).toEqual([]);
      expect(parsed.cleanMessage).toBe('Just a regular message');
    });

    it('should handle malformed markers gracefully', () => {
      const response = 'Bad [PRODUCT:] and good [PRODUCT:prod1]';
      const parsed = parseAIResponse(response);
      
      // Should only extract valid product IDs
      expect(parsed.productIds).toContain('prod1');
    });
  });
});
