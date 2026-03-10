/**
 * Response Parser Utility
 * 
 * Utilities for parsing structured data from AI responses.
 * Extracts product IDs, vendor IDs, and actions from formatted text.
 * 
 * Format specifications:
 * - Product IDs: [PRODUCT:product_id]
 * - Vendor IDs: [VENDOR:vendor_id]
 * - Actions: [ACTION:action_type:key1=value1:key2=value2]
 */

export interface ParsedAction {
  type: 'add_to_cart' | 'view_product' | 'visit_vendor' | 'view_details' | 'try_on' | string;
  data?: Record<string, string>;
}

export interface ParsedResponse {
  cleanMessage: string;
  productIds: string[];
  vendorIds: string[];
  actions: ParsedAction[];
}

/**
 * Parse AI response to extract all structured data
 * 
 * @param message - The raw message from AI containing markers
 * @returns Parsed response with extracted data and cleaned message
 * 
 * @example
 * ```typescript
 * const result = parseAIResponse(
 *   'Check out [PRODUCT:dress_123] from [VENDOR:tailor_01] [ACTION:add_to_cart:productId=dress_123:size=M]'
 * );
 * // result.productIds = ['dress_123']
 * // result.vendorIds = ['tailor_01']
 * // result.actions = [{ type: 'add_to_cart', data: { productId: 'dress_123', size: 'M' } }]
 * // result.cleanMessage = 'Check out from'
 * ```
 */
export function parseAIResponse(message: string): ParsedResponse {
  const productIds = extractProductIds(message);
  const vendorIds = extractVendorIds(message);
  const actions = extractActions(message);
  const cleanMessage = cleanMessageMarkers(message);

  return {
    cleanMessage,
    productIds,
    vendorIds,
    actions,
  };
}

/**
 * Extract product IDs from message
 * Format: [PRODUCT:product_id]
 */
export function extractProductIds(message: string): string[] {
  const productIds: string[] = [];
  const matches = message.matchAll(/\[PRODUCT:([^\]]+)\]/g);
  
  for (const match of matches) {
    const productId = match[1].trim();
    if (productId) {
      productIds.push(productId);
    }
  }
  
  return productIds;
}

/**
 * Extract vendor IDs from message
 * Format: [VENDOR:vendor_id]
 */
export function extractVendorIds(message: string): string[] {
  const vendorIds: string[] = [];
  const matches = message.matchAll(/\[VENDOR:([^\]]+)\]/g);
  
  for (const match of matches) {
    const vendorId = match[1].trim();
    if (vendorId) {
      vendorIds.push(vendorId);
    }
  }
  
  return vendorIds;
}

/**
 * Extract actions from message
 * Format: [ACTION:action_type:key1=value1:key2=value2]
 * 
 * @example
 * ```typescript
 * extractActions('[ACTION:add_to_cart:productId=123:size=M]')
 * // Returns: [{ type: 'add_to_cart', data: { productId: '123', size: 'M' } }]
 * ```
 */
export function extractActions(message: string): ParsedAction[] {
  const actions: ParsedAction[] = [];
  const matches = message.matchAll(/\[ACTION:([^\]]+)\]/g);
  
  for (const match of matches) {
    const actionString = match[1].trim();
    if (actionString) {
      const parsedAction = parseActionString(actionString);
      if (parsedAction) {
        actions.push(parsedAction);
      }
    }
  }
  
  return actions;
}

/**
 * Parse action string into structured action object
 * Format: action_type:key1=value1:key2=value2
 * 
 * @param actionString - The action string without brackets
 * @returns Parsed action object or null if invalid
 */
export function parseActionString(actionString: string): ParsedAction | null {
  const parts = actionString.split(':');
  
  if (parts.length === 0) {
    return null;
  }

  const type = parts[0].trim();
  
  if (!type) {
    return null;
  }

  const data: Record<string, string> = {};

  // Parse key=value pairs from remaining parts
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

/**
 * Remove all structured data markers from message
 * Cleans up [PRODUCT:...], [VENDOR:...], and [ACTION:...] markers
 * and normalizes whitespace
 */
export function cleanMessageMarkers(message: string): string {
  return message
    .replace(/\[PRODUCT:[^\]]+\]/g, '')
    .replace(/\[VENDOR:[^\]]+\]/g, '')
    .replace(/\[ACTION:[^\]]+\]/g, '')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Check if a message contains any structured data markers
 */
export function hasStructuredData(message: string): boolean {
  return /\[(PRODUCT|VENDOR|ACTION):[^\]]+\]/.test(message);
}

/**
 * Get count of structured data elements in message
 */
export function countStructuredData(message: string): {
  products: number;
  vendors: number;
  actions: number;
  total: number;
} {
  const products = (message.match(/\[PRODUCT:[^\]]+\]/g) || []).length;
  const vendors = (message.match(/\[VENDOR:[^\]]+\]/g) || []).length;
  const actions = (message.match(/\[ACTION:[^\]]+\]/g) || []).length;

  return {
    products,
    vendors,
    actions,
    total: products + vendors + actions,
  };
}
