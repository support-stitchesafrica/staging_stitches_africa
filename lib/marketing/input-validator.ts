/**
 * Input Validation and Sanitization Service for Marketing Dashboard
 * Provides comprehensive validation and XSS/injection protection
 * Requirements: All requirements - security aspect
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

export interface FieldValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  customErrorMessage?: string;
}

/**
 * Input Validator Class
 * Provides validation and sanitization for all user inputs
 */
export class InputValidator {
  /**
   * Sanitize string input to prevent XSS attacks
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Remove HTML tags and dangerous characters
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    // Trim whitespace
    return sanitized.trim();
  }

  /**
   * Sanitize HTML content (for rich text fields)
   */
  static sanitizeHTML(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Remove dangerous tags and attributes
    let sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
    
    return sanitized;
  }

  /**
   * Validate and sanitize email
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        errors: ['Email is required']
      };
    }

    const sanitized = this.sanitizeString(email).toLowerCase();
    
    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitized)) {
      errors.push('Invalid email format');
    }

    // Check for SQL injection patterns
    if (this.containsSQLInjection(sanitized)) {
      errors.push('Invalid characters in email');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }

  /**
   * Validate and sanitize name
   */
  static validateName(name: string, fieldName: string = 'Name'): ValidationResult {
    const errors: string[] = [];
    
    if (!name || typeof name !== 'string') {
      return {
        isValid: false,
        errors: [`${fieldName} is required`]
      };
    }

    const sanitized = this.sanitizeString(name);
    
    // Length validation
    if (sanitized.length < 2) {
      errors.push(`${fieldName} must be at least 2 characters`);
    }
    
    if (sanitized.length > 100) {
      errors.push(`${fieldName} must be less than 100 characters`);
    }

    // Only allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!nameRegex.test(sanitized)) {
      errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
    }

    // Check for XSS patterns
    if (this.containsXSS(sanitized)) {
      errors.push(`${fieldName} contains invalid characters`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }

  /**
   * Validate and sanitize phone number
   */
  static validatePhoneNumber(phone: string): ValidationResult {
    const errors: string[] = [];
    
    if (!phone || typeof phone !== 'string') {
      return {
        isValid: false,
        errors: ['Phone number is required']
      };
    }

    const sanitized = this.sanitizeString(phone);
    
    // Allow only digits, spaces, hyphens, parentheses, and plus sign
    const phoneRegex = /^[\d\s\-\(\)\+]{10,20}$/;
    if (!phoneRegex.test(sanitized)) {
      errors.push('Invalid phone number format');
    }

    // Check for injection patterns
    if (this.containsSQLInjection(sanitized)) {
      errors.push('Invalid characters in phone number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }

  /**
   * Validate and sanitize URL
   */
  static validateURL(url: string): ValidationResult {
    const errors: string[] = [];
    
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        errors: ['URL is required']
      };
    }

    const sanitized = this.sanitizeString(url);
    
    try {
      const urlObj = new URL(sanitized);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('Only HTTP and HTTPS URLs are allowed');
      }
    } catch (e) {
      errors.push('Invalid URL format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }

  /**
   * Validate generic text field
   */
  static validateTextField(
    value: string,
    fieldName: string,
    rules: FieldValidationRule = {}
  ): ValidationResult {
    const errors: string[] = [];
    
    // Required check
    if (rules.required && (!value || typeof value !== 'string' || value.trim().length === 0)) {
      return {
        isValid: false,
        errors: [`${fieldName} is required`]
      };
    }

    if (!value) {
      return { isValid: true, errors: [], sanitizedValue: '' };
    }

    const sanitized = this.sanitizeString(value);
    
    // Length validation
    if (rules.minLength && sanitized.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
    }
    
    if (rules.maxLength && sanitized.length > rules.maxLength) {
      errors.push(`${fieldName} must be less than ${rules.maxLength} characters`);
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(sanitized)) {
      errors.push(rules.customErrorMessage || `${fieldName} format is invalid`);
    }

    // Custom validator
    if (rules.customValidator && !rules.customValidator(sanitized)) {
      errors.push(rules.customErrorMessage || `${fieldName} validation failed`);
    }

    // Security checks
    if (this.containsXSS(sanitized)) {
      errors.push(`${fieldName} contains invalid characters`);
    }

    if (this.containsSQLInjection(sanitized)) {
      errors.push(`${fieldName} contains invalid characters`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }

  /**
   * Validate role
   */
  static validateRole(role: string): ValidationResult {
    const validRoles = ['super_admin', 'team_lead', 'bdm', 'team_member'];
    
    if (!role || typeof role !== 'string') {
      return {
        isValid: false,
        errors: ['Role is required']
      };
    }

    const sanitized = this.sanitizeString(role).toLowerCase();
    
    if (!validRoles.includes(sanitized)) {
      return {
        isValid: false,
        errors: ['Invalid role specified']
      };
    }

    return {
      isValid: true,
      errors: [],
      sanitizedValue: sanitized
    };
  }

  /**
   * Validate object with multiple fields
   */
  static validateObject(
    data: Record<string, any>,
    schema: Record<string, FieldValidationRule>
  ): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: Record<string, any> = {};

    for (const [fieldName, rules] of Object.entries(schema)) {
      const value = data[fieldName];
      
      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${fieldName} is required`);
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      // Validate based on type
      if (typeof value === 'string') {
        const result = this.validateTextField(value, fieldName, rules);
        if (!result.isValid) {
          errors.push(...result.errors);
        } else {
          sanitizedData[fieldName] = result.sanitizedValue;
        }
      } else {
        sanitizedData[fieldName] = value;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitizedData
    };
  }

  /**
   * Check for XSS patterns
   */
  private static containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers like onclick=
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /eval\(/gi,
      /expression\(/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Check for SQL injection patterns
   */
  private static containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(--|\;|\/\*|\*\/)/g,
      /(\bOR\b.*=.*)/gi,
      /(\bAND\b.*=.*)/gi,
      /'.*OR.*'/gi,
      /".*OR.*"/gi,
      /\bUNION\b.*\bSELECT\b/gi
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize object recursively
   */
  static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page?: number, limit?: number): ValidationResult {
    const errors: string[] = [];
    const sanitized: any = {};

    if (page !== undefined) {
      const pageNum = Number(page);
      if (isNaN(pageNum) || pageNum < 1) {
        errors.push('Page must be a positive number');
      } else {
        sanitized.page = pageNum;
      }
    }

    if (limit !== undefined) {
      const limitNum = Number(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push('Limit must be between 1 and 100');
      } else {
        sanitized.limit = limitNum;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }

  /**
   * Validate ID format (Firestore document ID)
   */
  static validateId(id: string, fieldName: string = 'ID'): ValidationResult {
    const errors: string[] = [];
    
    if (!id || typeof id !== 'string') {
      return {
        isValid: false,
        errors: [`${fieldName} is required`]
      };
    }

    const sanitized = this.sanitizeString(id);
    
    // Firestore IDs should be alphanumeric with underscores and hyphens
    const idRegex = /^[a-zA-Z0-9_-]+$/;
    if (!idRegex.test(sanitized)) {
      errors.push(`${fieldName} format is invalid`);
    }

    if (sanitized.length > 1500) {
      errors.push(`${fieldName} is too long`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }
}

/**
 * Form Validator Class
 * Validates complete form submissions
 */
export class FormValidator {
  /**
   * Validate user creation form
   */
  static validateUserCreation(data: any): ValidationResult {
    const errors: string[] = [];
    const sanitized: any = {};

    // Validate email
    const emailResult = InputValidator.validateEmail(data.email);
    if (!emailResult.isValid) {
      errors.push(...emailResult.errors);
    } else {
      sanitized.email = emailResult.sanitizedValue;
    }

    // Validate name
    const nameResult = InputValidator.validateName(data.name, 'Name');
    if (!nameResult.isValid) {
      errors.push(...nameResult.errors);
    } else {
      sanitized.name = nameResult.sanitizedValue;
    }

    // Validate phone (optional)
    if (data.phoneNumber) {
      const phoneResult = InputValidator.validatePhoneNumber(data.phoneNumber);
      if (!phoneResult.isValid) {
        errors.push(...phoneResult.errors);
      } else {
        sanitized.phoneNumber = phoneResult.sanitizedValue;
      }
    }

    // Validate role
    const roleResult = InputValidator.validateRole(data.role);
    if (!roleResult.isValid) {
      errors.push(...roleResult.errors);
    } else {
      sanitized.role = roleResult.sanitizedValue;
    }

    // Validate teamId (optional)
    if (data.teamId) {
      const teamIdResult = InputValidator.validateId(data.teamId, 'Team ID');
      if (!teamIdResult.isValid) {
        errors.push(...teamIdResult.errors);
      } else {
        sanitized.teamId = teamIdResult.sanitizedValue;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }

  /**
   * Validate invitation creation form
   */
  static validateInvitationCreation(data: any): ValidationResult {
    const errors: string[] = [];
    const sanitized: any = {};

    // Validate email
    const emailResult = InputValidator.validateEmail(data.email);
    if (!emailResult.isValid) {
      errors.push(...emailResult.errors);
    } else {
      sanitized.email = emailResult.sanitizedValue;
    }

    // Validate name
    const nameResult = InputValidator.validateName(data.name, 'Name');
    if (!nameResult.isValid) {
      errors.push(...nameResult.errors);
    } else {
      sanitized.name = nameResult.sanitizedValue;
    }

    // Validate role
    const roleResult = InputValidator.validateRole(data.role);
    if (!roleResult.isValid) {
      errors.push(...roleResult.errors);
    } else {
      sanitized.role = roleResult.sanitizedValue;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }

  /**
   * Validate vendor assignment form
   */
  static validateVendorAssignment(data: any): ValidationResult {
    const errors: string[] = [];
    const sanitized: any = {};

    // Validate vendor ID
    const vendorIdResult = InputValidator.validateId(data.vendorId, 'Vendor ID');
    if (!vendorIdResult.isValid) {
      errors.push(...vendorIdResult.errors);
    } else {
      sanitized.vendorId = vendorIdResult.sanitizedValue;
    }

    // Validate assigned user ID
    const userIdResult = InputValidator.validateId(data.assignedToUserId, 'User ID');
    if (!userIdResult.isValid) {
      errors.push(...userIdResult.errors);
    } else {
      sanitized.assignedToUserId = userIdResult.sanitizedValue;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: sanitized
    };
  }
}

// Export utility functions
export const validationUtils = {
  sanitizeString: InputValidator.sanitizeString,
  sanitizeHTML: InputValidator.sanitizeHTML,
  sanitizeObject: InputValidator.sanitizeObject,
  validateEmail: InputValidator.validateEmail,
  validateName: InputValidator.validateName,
  validatePhoneNumber: InputValidator.validatePhoneNumber,
  validateURL: InputValidator.validateURL,
  validateRole: InputValidator.validateRole,
  validateId: InputValidator.validateId
};
