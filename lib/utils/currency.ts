/**
 * Currency utility functions for USD formatting
 * All monetary values in the vendor analytics system use USD format
 * 
 * Validates: Requirements 23.1, 23.2, 23.3, 23.4, 23.5
 */

/**
 * Formats amount in USD currency with full precision
 * 
 * @param amount - The numeric amount to format
 * @returns Formatted string in USD format (e.g., "$12,345.67")
 * 
 * Validates: Requirements 23.1, 23.2, 23.4
 * 
 * @example
 * formatUSD(12345.67) // "$12,345.67"
 * formatUSD(0) // "$0.00"
 * formatUSD(-500.5) // "-$500.50"
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formats amount for charts with compact notation (shorter format)
 * Used for chart axes where space is limited
 * 
 * @param amount - The numeric amount to format
 * @returns Compact formatted string (e.g., "$1.2K", "$5.5M")
 * 
 * Validates: Requirements 23.2, 23.4
 * 
 * @example
 * formatUSDCompact(1234) // "$1.2K"
 * formatUSDCompact(1234567) // "$1.2M"
 * formatUSDCompact(500) // "$500"
 */
export function formatUSDCompact(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (absAmount >= 1000000) {
    return `${sign}$${(absAmount / 1000000).toFixed(1)}M`;
  }
  if (absAmount >= 1000) {
    return `${sign}$${(absAmount / 1000).toFixed(1)}K`;
  }
  return `${sign}$${absAmount.toFixed(0)}`;
}

/**
 * Parses USD formatted string to number
 * Removes currency symbols and commas to extract numeric value
 * 
 * @param usdString - USD formatted string (e.g., "$12,345.67")
 * @returns Numeric value
 * 
 * Validates: Requirements 23.4
 * 
 * @example
 * parseUSD("$12,345.67") // 12345.67
 * parseUSD("$1,000") // 1000
 * parseUSD("-$500.50") // -500.50
 */
export function parseUSD(usdString: string): number {
  // Remove all non-numeric characters except decimal point and minus sign
  const cleaned = usdString.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned);
}
