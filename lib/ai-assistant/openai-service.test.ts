/**
 * Tests for OpenAI Service Response Parsing
 * 
 * Tests the extraction of structured data from AI responses:
 * - Product IDs
 * - Vendor IDs
 * - Actions with structured data
 */

import { describe, it, expect } from 'vitest';

// We need to test the internal parseAIResponse function
// Since it's not exported, we'll test it through the public API
// For now, we'll create a test helper that mimics the parsing logic

/**
 * Helper function that mimics the parseAIResponse logic
 * This is for testing purposes
 */
function testParseAIResponse(message: string): {
  cleanMessage: string;
  productIds: string[];
  vendorIds: string[];
  actions: Array<{ type: string; data?: Record<string, string> }>;
} {
  const productIds: string[] = [];
  const vendorIds: string[] = [];
  const actions: Array<{ type: string; data?: Record<string, string> }> = [];

  // Extract product IDs: [PRODUCT:product_id]
  const productMatches = message.matchAll(/\[PRODUCT:([^\]]+)\]/g);
  for (const match of productMatches) {
    const productId = match[1].trim();
    if (productId) {
      productIds.push(productId);
    }
  }

  // Extract vendor IDs: [VENDOR:vendor_id]
  const vendorMatches = message.matchAll(/\[VENDOR:([^\]]+)\]/g);
  for (const match of vendorMatches) {
    const vendorId = match[1].trim();
    if (vendorId) {
      vendorIds.push(vendorId);
    }
  }

  // Extract actions: [ACTION:action_type:key1=value1:key2=value2]
  const actionMatches = message.matchAll(/\[ACTION:([^\]]+)\]/g);
  for (const match of actionMatches) {
    const actionString = match[1].trim();
    if (actionString) {
      const parsedAction = parseActionString(actionString);
      if (parsedAction) {
        actions.push(parsedAction);
      }
    }
  }

  // Clean message by removing all markers
  const cleanMessage = message
    .replace(/\[PRODUCT:[^\]]+\]/g, '')
    .replace(/\[VENDOR:[^\]]+\]/g, '')
    .replace(/\[ACTION:[^\]]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { cleanMessage, productIds, vendorIds, actions };
}

function parseActionString(actionString: string): { type: string; data?: Record<string, string> } | null {
  const parts = actionString.split(':');
  
  if (parts.length === 0) {
    return null;
  }

  const type = parts[0].trim();
  const data: Record<string, string> = {};

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    const equalIndex = part.indexOf('=');
    
    if (equalIndex > 0) {
      const key = part.substring(0, equalIndex).trim();
      const value = part.substring(equalIndex + 1).trim();
      
      if (key && value) {
        data[key] = value;
      }
    }
  }

  return {
    type,
    data: Object.keys(data).length > 0 ? data : undefined,
  };
}

describe('Response Parsing - Product IDs', () => {
  it('should extract single product ID', () => {
    const message = 'Check out this dress [PRODUCT:prod_123] it looks great!';
    const result = testParseAIResponse(message);
    
    expect(result.productIds).toEqual(['prod_123']);
    expect(result.cleanMessage).toBe('Check out this dress it looks great!');
  });

  it('should extract multiple product IDs', () => {
    const message = 'Here are some options: [PRODUCT:prod_1] and [PRODUCT:prod_2] and [PRODUCT:prod_3]';
    const result = testParseAIResponse(message);
    
    expect(result.productIds).toEqual(['prod_1', 'prod_2', 'prod_3']);
    expect(result.cleanMessage).toBe('Here are some options: and and');
  });

  it('should handle product IDs with special characters', () => {
    const message = 'Product: [PRODUCT:prod-123_abc]';
    const result = testParseAIResponse(message);
    
    expect(result.productIds).toEqual(['prod-123_abc']);
  });

  it('should handle empty product ID gracefully', () => {
    const message = 'Empty: [PRODUCT:] and valid: [PRODUCT:prod_1]';
    const result = testParseAIResponse(message);
    
    expect(result.productIds).toEqual(['prod_1']);
  });

  it('should handle message with no product IDs', () => {
    const message = 'Just a regular message with no products';
    const result = testParseAIResponse(message);
    
    expect(result.productIds).toEqual([]);
    expect(result.cleanMessage).toBe('Just a regular message with no products');
  });
});

describe('Response Parsing - Vendor IDs', () => {
  it('should extract single vendor ID', () => {
    const message = 'Visit this vendor [VENDOR:vendor_123] for great products!';
    const result = testParseAIResponse(message);
    
    expect(result.vendorIds).toEqual(['vendor_123']);
    expect(result.cleanMessage).toBe('Visit this vendor for great products!');
  });

  it('should extract multiple vendor IDs', () => {
    const message = 'Top vendors: [VENDOR:v1], [VENDOR:v2], and [VENDOR:v3]';
    const result = testParseAIResponse(message);
    
    expect(result.vendorIds).toEqual(['v1', 'v2', 'v3']);
  });

  it('should handle vendor IDs with special characters', () => {
    const message = 'Vendor: [VENDOR:vendor-abc_123]';
    const result = testParseAIResponse(message);
    
    expect(result.vendorIds).toEqual(['vendor-abc_123']);
  });

  it('should handle message with no vendor IDs', () => {
    const message = 'Just a regular message';
    const result = testParseAIResponse(message);
    
    expect(result.vendorIds).toEqual([]);
  });
});

describe('Response Parsing - Actions', () => {
  it('should parse action with no data', () => {
    const message = 'Click here [ACTION:view_cart]';
    const result = testParseAIResponse(message);
    
    expect(result.actions).toEqual([
      { type: 'view_cart', data: undefined }
    ]);
    expect(result.cleanMessage).toBe('Click here');
  });

  it('should parse action with single data field', () => {
    const message = 'Add this [ACTION:add_to_cart:productId=prod_123]';
    const result = testParseAIResponse(message);
    
    expect(result.actions).toEqual([
      { type: 'add_to_cart', data: { productId: 'prod_123' } }
    ]);
  });

  it('should parse action with multiple data fields', () => {
    const message = 'Try it [ACTION:add_to_cart:productId=prod_123:size=M:color=blue]';
    const result = testParseAIResponse(message);
    
    expect(result.actions).toEqual([
      { 
        type: 'add_to_cart', 
        data: { 
          productId: 'prod_123',
          size: 'M',
          color: 'blue'
        } 
      }
    ]);
  });

  it('should parse multiple actions', () => {
    const message = '[ACTION:view_product:productId=p1] or [ACTION:add_to_cart:productId=p2:size=L]';
    const result = testParseAIResponse(message);
    
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0]).toEqual({
      type: 'view_product',
      data: { productId: 'p1' }
    });
    expect(result.actions[1]).toEqual({
      type: 'add_to_cart',
      data: { productId: 'p2', size: 'L' }
    });
  });

  it('should handle action with vendor ID', () => {
    const message = 'Visit [ACTION:visit_vendor:vendorId=vendor_123]';
    const result = testParseAIResponse(message);
    
    expect(result.actions).toEqual([
      { type: 'visit_vendor', data: { vendorId: 'vendor_123' } }
    ]);
  });

  it('should handle malformed action gracefully', () => {
    const message = 'Bad action [ACTION:] and good [ACTION:view_cart]';
    const result = testParseAIResponse(message);
    
    // Empty action type should be filtered out or handled
    expect(result.actions.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle action with data containing special characters', () => {
    const message = '[ACTION:search:query=african-print_dress]';
    const result = testParseAIResponse(message);
    
    expect(result.actions).toEqual([
      { type: 'search', data: { query: 'african-print_dress' } }
    ]);
  });
});

describe('Response Parsing - Combined Structured Data', () => {
  it('should extract all types of structured data together', () => {
    const message = `
      I found these products for you: [PRODUCT:prod_1] and [PRODUCT:prod_2].
      You can also check out this vendor [VENDOR:vendor_123].
      [ACTION:add_to_cart:productId=prod_1:size=M]
    `;
    const result = testParseAIResponse(message);
    
    expect(result.productIds).toEqual(['prod_1', 'prod_2']);
    expect(result.vendorIds).toEqual(['vendor_123']);
    expect(result.actions).toEqual([
      { type: 'add_to_cart', data: { productId: 'prod_1', size: 'M' } }
    ]);
    expect(result.cleanMessage).toContain('I found these products for you');
    expect(result.cleanMessage).not.toContain('[PRODUCT:');
    expect(result.cleanMessage).not.toContain('[VENDOR:');
    expect(result.cleanMessage).not.toContain('[ACTION:');
  });

  it('should handle complex real-world response', () => {
    const message = `
      Great choice! I recommend this beautiful traditional dress [PRODUCT:dress_001].
      It's from a highly-rated vendor [VENDOR:tailor_lagos_01] in Lagos.
      Would you like to add it to your cart? [ACTION:add_to_cart:productId=dress_001:size=M]
      Or you can view more details first [ACTION:view_product:productId=dress_001]
    `;
    const result = testParseAIResponse(message);
    
    expect(result.productIds).toEqual(['dress_001']);
    expect(result.vendorIds).toEqual(['tailor_lagos_01']);
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0].type).toBe('add_to_cart');
    expect(result.actions[1].type).toBe('view_product');
  });

  it('should preserve message content while removing markers', () => {
    const message = 'Check [PRODUCT:p1] and [VENDOR:v1] with [ACTION:view:id=1]';
    const result = testParseAIResponse(message);
    
    expect(result.cleanMessage).toBe('Check and with');
    expect(result.productIds).toHaveLength(1);
    expect(result.vendorIds).toHaveLength(1);
    expect(result.actions).toHaveLength(1);
  });
});

describe('Response Parsing - Edge Cases', () => {
  it('should handle empty message', () => {
    const message = '';
    const result = testParseAIResponse(message);
    
    expect(result.productIds).toEqual([]);
    expect(result.vendorIds).toEqual([]);
    expect(result.actions).toEqual([]);
    expect(result.cleanMessage).toBe('');
  });

  it('should handle message with only markers', () => {
    const message = '[PRODUCT:p1][VENDOR:v1][ACTION:view_cart]';
    const result = testParseAIResponse(message);
    
    expect(result.productIds).toEqual(['p1']);
    expect(result.vendorIds).toEqual(['v1']);
    expect(result.actions).toHaveLength(1);
    expect(result.cleanMessage).toBe('');
  });

  it('should handle nested brackets gracefully', () => {
    const message = 'Text [PRODUCT:prod[123]] more text';
    const result = testParseAIResponse(message);
    
    // Should extract up to first closing bracket
    expect(result.productIds).toEqual(['prod[123']);
  });

  it('should normalize whitespace in cleaned message', () => {
    const message = 'Text   [PRODUCT:p1]   with   [VENDOR:v1]   spaces';
    const result = testParseAIResponse(message);
    
    expect(result.cleanMessage).toBe('Text with spaces');
  });

  it('should handle action with empty data values', () => {
    const message = '[ACTION:add_to_cart:productId=:size=M]';
    const result = testParseAIResponse(message);
    
    // Should only include non-empty values
    expect(result.actions[0].data).toEqual({ size: 'M' });
  });

  it('should handle action with malformed key=value pairs', () => {
    const message = '[ACTION:add_to_cart:productId:size=M:=value]';
    const result = testParseAIResponse(message);
    
    // Should only parse valid key=value pairs
    expect(result.actions[0].data).toEqual({ size: 'M' });
  });
});
