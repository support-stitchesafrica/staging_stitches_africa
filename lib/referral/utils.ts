import { randomBytes } from 'crypto';

/**
 * Generate a unique referral code
 * Creates an 8-character alphanumeric code (uppercase)
 * Requirements: 1.4
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(8);
  let code = '';
  
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  
  return code;
}

/**
 * Validate referral code format
 * Checks if code is 8 characters and alphanumeric
 * Requirements: 1.4, 3.1
 */
export function isValidReferralCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // Must be exactly 8 characters
  if (code.length !== 8) {
    return false;
  }
  
  // Must be alphanumeric (uppercase)
  const alphanumericRegex = /^[A-Z0-9]{8}$/;
  return alphanumericRegex.test(code);
}

/**
 * Format referral link
 * Creates a complete referral URL with the code
 * Requirements: 3.1
 */
export function formatReferralLink(code: string, baseUrl?: string): string {
  const url = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${url}/signup?ref=${code}`;
}

/**
 * Extract referral code from URL
 * Parses the referral code from a URL query parameter
 */
export function extractReferralCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('ref');
  } catch {
    return null;
  }
}

/**
 * Format points display
 * Formats points with commas for readability
 */
export function formatPoints(points: number): string {
  return points.toLocaleString('en-US');
}

/**
 * Format currency
 * Formats currency values with proper decimal places
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format percentage
 * Formats percentage values with specified decimal places
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate conversion rate
 * Calculates the percentage of referrals that converted
 */
export function calculateConversionRate(converted: number, total: number): number {
  if (total === 0) return 0;
  return (converted / total) * 100;
}

/**
 * Calculate commission from purchase amount
 * Returns 5% of the purchase amount
 * Requirements: 7.2
 */
export function calculateCommission(amount: number): number {
  const COMMISSION_RATE = 0.05; // 5%
  return amount * COMMISSION_RATE;
}

/**
 * Calculate points from purchase amount
 * Points are equal to 5% of purchase amount (1 point = $1)
 * Requirements: 7.2
 */
export function calculatePurchasePoints(amount: number): number {
  const commission = calculateCommission(amount);
  return Math.floor(commission); // Round down to whole points
}

/**
 * Get signup points
 * Returns the fixed points awarded for sign-ups
 * Requirements: 7.1
 */
export function getSignupPoints(): number {
  return parseInt(process.env.REFERRAL_SIGNUP_POINTS || '1', 10);
}

/**
 * Validate email format
 * Basic email validation
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize user input
 * Removes potentially harmful characters
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Format date for display
 * Formats timestamp to readable date string
 */
export function formatDate(date: Date | { toDate: () => Date }): string {
  const dateObj = date instanceof Date ? date : date.toDate();
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Format date and time for display
 * Formats timestamp to readable date and time string
 */
export function formatDateTime(date: Date | { toDate: () => Date }): string {
  const dateObj = date instanceof Date ? date : date.toDate();
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Get date range for analytics
 * Returns start and end dates based on range type
 */
export function getDateRange(range: '7days' | '30days' | '90days' | 'all'): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  switch (range) {
    case '7days':
      start.setDate(end.getDate() - 7);
      break;
    case '30days':
      start.setDate(end.getDate() - 30);
      break;
    case '90days':
      start.setDate(end.getDate() - 90);
      break;
    case 'all':
      start.setFullYear(2020, 0, 1); // Set to a far past date
      break;
  }
  
  return { start, end };
}

/**
 * Generate date-based ID
 * Creates an ID in YYYY-MM-DD format for analytics
 */
export function generateDateId(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validate password strength
 * Checks if password meets minimum requirements
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

/**
 * Truncate text
 * Truncates text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate share URLs for social media
 * Creates shareable links for different platforms
 * Requirements: 3.5
 */
export function generateShareUrls(referralLink: string, referrerName: string) {
  const message = `Join me on Stitches Africa! Use my referral code to get started.`;
  const encodedLink = encodeURIComponent(referralLink);
  const encodedMessage = encodeURIComponent(message);
  
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,
    whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedLink}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
    email: `mailto:?subject=${encodeURIComponent('Join Stitches Africa')}&body=${encodedMessage}%20${encodedLink}`,
  };
}
