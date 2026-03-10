/**
 * Domain Validation Service for Marketing Dashboard
 * Validates email domains to ensure only company emails are allowed
 * Requirements: 4.1, 4.2
 */

export interface DomainValidationResult {
  isValid: boolean;
  error?: string;
}

export class DomainValidator {
  private static readonly ALLOWED_DOMAINS = [
    '@stitchesafrica.com',
    '@stitchesafrica.pro'
  ];

  /**
   * Validates if an email domain is allowed for the marketing dashboard
   * @param email - The email address to validate
   * @returns DomainValidationResult with validation status and error message
   */
  static validateEmailDomain(email: string): DomainValidationResult {
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        error: 'Email is required and must be a valid string'
      };
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if email has @ symbol
    if (!normalizedEmail.includes('@')) {
      return {
        isValid: false,
        error: 'Invalid email format'
      };
    }

    // Check if email ends with any of the allowed domains
    const isValidDomain = this.ALLOWED_DOMAINS.some(domain => 
      normalizedEmail.endsWith(domain)
    );

    if (!isValidDomain) {
      return {
        isValid: false,
        error: 'Only company emails are allowed. Contact an administrator.'
      };
    }

    return {
      isValid: true
    };
  }

  /**
   * Extracts the domain from an email address
   * @param email - The email address
   * @returns The domain part of the email (including @)
   */
  static extractDomain(email: string): string {
    if (!email || !email.includes('@')) {
      return '';
    }
    
    const parts = email.toLowerCase().trim().split('@');
    return parts.length > 1 ? `@${parts[1]}` : '';
  }

  /**
   * Gets the list of allowed domains
   * @returns Array of allowed domain strings
   */
  static getAllowedDomains(): string[] {
    return [...this.ALLOWED_DOMAINS];
  }

  /**
   * Validates multiple email addresses at once
   * @param emails - Array of email addresses to validate
   * @returns Array of validation results in the same order
   */
  static validateMultipleEmails(emails: string[]): DomainValidationResult[] {
    return emails.map(email => this.validateEmailDomain(email));
  }

  /**
   * Checks if a domain is in the allowed list
   * @param domain - The domain to check (should include @)
   * @returns boolean indicating if domain is allowed
   */
  static isDomainAllowed(domain: string): boolean {
    const normalizedDomain = domain.toLowerCase().trim();
    return this.ALLOWED_DOMAINS.includes(normalizedDomain);
  }
}

/**
 * Convenience function for quick domain validation
 * @param email - Email address to validate
 * @returns boolean indicating if email domain is valid
 */
export function isValidCompanyEmail(email: string): boolean {
  return DomainValidator.validateEmailDomain(email).isValid;
}

/**
 * Middleware helper function for domain validation
 * Throws an error if domain is invalid
 * @param email - Email address to validate
 * @throws Error with appropriate message if domain is invalid
 */
export function validateDomainOrThrow(email: string): void {
  const result = DomainValidator.validateEmailDomain(email);
  if (!result.isValid) {
    throw new Error(result.error || 'Invalid email domain');
  }
}