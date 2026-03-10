/**
 * Form Validation Service for Marketing Dashboard
 * Provides client-side and server-side validation utilities
 * Requirements: 16.5
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  fieldErrors: Map<string, string[]>;
}

export interface ValidationRule {
  field: string;
  rules: Array<{
    type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
    value?: any;
    message: string;
    validator?: (value: any) => boolean;
  }>;
}

/**
 * Form Validator Class
 * Provides comprehensive form validation
 */
export class FormValidator {
  private errors: Record<string, string> = {};
  private fieldErrors: Map<string, string[]> = new Map();

  /**
   * Validate a single field
   */
  validateField(fieldName: string, value: any, rules: ValidationRule['rules']): string[] {
    const errors: string[] = [];

    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (!this.isRequired(value)) {
            errors.push(rule.message);
          }
          break;

        case 'email':
          if (value && !this.isValidEmail(value)) {
            errors.push(rule.message);
          }
          break;

        case 'minLength':
          if (value && !this.hasMinLength(value, rule.value)) {
            errors.push(rule.message);
          }
          break;

        case 'maxLength':
          if (value && !this.hasMaxLength(value, rule.value)) {
            errors.push(rule.message);
          }
          break;

        case 'pattern':
          if (value && !this.matchesPattern(value, rule.value)) {
            errors.push(rule.message);
          }
          break;

        case 'custom':
          if (rule.validator && !rule.validator(value)) {
            errors.push(rule.message);
          }
          break;
      }
    }

    return errors;
  }

  /**
   * Validate multiple fields
   */
  validate(data: Record<string, any>, validationRules: ValidationRule[]): ValidationResult {
    this.errors = {};
    this.fieldErrors = new Map();

    for (const rule of validationRules) {
      const value = data[rule.field];
      const fieldErrors = this.validateField(rule.field, value, rule.rules);

      if (fieldErrors.length > 0) {
        this.errors[rule.field] = fieldErrors[0]; // First error for simple display
        this.fieldErrors.set(rule.field, fieldErrors); // All errors for detailed display
      }
    }

    return {
      isValid: Object.keys(this.errors).length === 0,
      errors: this.errors,
      fieldErrors: this.fieldErrors
    };
  }

  /**
   * Check if value is required (not empty)
   */
  private isRequired(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return true;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check minimum length
   */
  private hasMinLength(value: string, minLength: number): boolean {
    return value.length >= minLength;
  }

  /**
   * Check maximum length
   */
  private hasMaxLength(value: string, maxLength: number): boolean {
    return value.length <= maxLength;
  }

  /**
   * Check if value matches pattern
   */
  private matchesPattern(value: string, pattern: RegExp): boolean {
    return pattern.test(value);
  }

  /**
   * Get all errors
   */
  getErrors(): Record<string, string> {
    return this.errors;
  }

  /**
   * Get errors for a specific field
   */
  getFieldErrors(fieldName: string): string[] {
    return this.fieldErrors.get(fieldName) || [];
  }

  /**
   * Check if a specific field has errors
   */
  hasFieldError(fieldName: string): boolean {
    return this.fieldErrors.has(fieldName);
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = {};
    this.fieldErrors = new Map();
  }

  /**
   * Clear errors for a specific field
   */
  clearFieldError(fieldName: string): void {
    delete this.errors[fieldName];
    this.fieldErrors.delete(fieldName);
  }
}

/**
 * Common validation rules for marketing dashboard forms
 */
export const CommonValidationRules = {
  /**
   * Team form validation rules
   */
  team: {
    name: [
      { type: 'required' as const, message: 'Team name is required' },
      { type: 'minLength' as const, value: 2, message: 'Team name must be at least 2 characters' },
      { type: 'maxLength' as const, value: 100, message: 'Team name must be less than 100 characters' }
    ],
    description: [
      { type: 'maxLength' as const, value: 500, message: 'Description must be less than 500 characters' }
    ],
    leadUserId: [
      { type: 'required' as const, message: 'Team lead is required' }
    ]
  },

  /**
   * User invitation form validation rules
   */
  invitation: {
    name: [
      { type: 'required' as const, message: 'Name is required' },
      { type: 'minLength' as const, value: 2, message: 'Name must be at least 2 characters' },
      { type: 'maxLength' as const, value: 100, message: 'Name must be less than 100 characters' }
    ],
    email: [
      { type: 'required' as const, message: 'Email is required' },
      { type: 'email' as const, message: 'Invalid email format' }
    ],
    role: [
      { type: 'required' as const, message: 'Role is required' }
    ]
  },

  /**
   * Vendor assignment form validation rules
   */
  assignment: {
    vendorId: [
      { type: 'required' as const, message: 'Vendor is required' }
    ],
    userId: [
      { type: 'required' as const, message: 'User is required' }
    ],
    notes: [
      { type: 'maxLength' as const, value: 1000, message: 'Notes must be less than 1000 characters' }
    ]
  },

  /**
   * User profile form validation rules
   */
  userProfile: {
    displayName: [
      { type: 'required' as const, message: 'Display name is required' },
      { type: 'minLength' as const, value: 2, message: 'Display name must be at least 2 characters' },
      { type: 'maxLength' as const, value: 100, message: 'Display name must be less than 100 characters' }
    ],
    email: [
      { type: 'required' as const, message: 'Email is required' },
      { type: 'email' as const, message: 'Invalid email format' }
    ]
  }
};

/**
 * Utility functions for form validation
 */
export const FormValidationUtils = {
  /**
   * Validate team form data
   */
  validateTeamForm(data: { name: string; description?: string; leadUserId: string }): ValidationResult {
    const validator = new FormValidator();
    return validator.validate(data, [
      { field: 'name', rules: CommonValidationRules.team.name },
      { field: 'description', rules: CommonValidationRules.team.description },
      { field: 'leadUserId', rules: CommonValidationRules.team.leadUserId }
    ]);
  },

  /**
   * Validate invitation form data
   */
  validateInvitationForm(data: { name: string; email: string; role: string }): ValidationResult {
    const validator = new FormValidator();
    return validator.validate(data, [
      { field: 'name', rules: CommonValidationRules.invitation.name },
      { field: 'email', rules: CommonValidationRules.invitation.email },
      { field: 'role', rules: CommonValidationRules.invitation.role }
    ]);
  },

  /**
   * Validate assignment form data
   */
  validateAssignmentForm(data: { vendorId: string; userId: string; notes?: string }): ValidationResult {
    const validator = new FormValidator();
    return validator.validate(data, [
      { field: 'vendorId', rules: CommonValidationRules.assignment.vendorId },
      { field: 'userId', rules: CommonValidationRules.assignment.userId },
      { field: 'notes', rules: CommonValidationRules.assignment.notes }
    ]);
  },

  /**
   * Validate user profile form data
   */
  validateUserProfileForm(data: { displayName: string; email: string }): ValidationResult {
    const validator = new FormValidator();
    return validator.validate(data, [
      { field: 'displayName', rules: CommonValidationRules.userProfile.displayName },
      { field: 'email', rules: CommonValidationRules.userProfile.email }
    ]);
  },

  /**
   * Format validation errors for display
   */
  formatErrors(errors: Record<string, string>): string {
    return Object.values(errors).join('. ');
  },

  /**
   * Get first error message
   */
  getFirstError(errors: Record<string, string>): string | null {
    const keys = Object.keys(errors);
    return keys.length > 0 ? errors[keys[0]] : null;
  },

  /**
   * Check if form has any errors
   */
  hasErrors(errors: Record<string, string>): boolean {
    return Object.keys(errors).length > 0;
  }
};

/**
 * React hook for form validation (client-side)
 */
export function useFormValidation() {
  const validator = new FormValidator();

  const validate = (data: Record<string, any>, rules: ValidationRule[]): ValidationResult => {
    return validator.validate(data, rules);
  };

  const validateField = (fieldName: string, value: any, rules: ValidationRule['rules']): string[] => {
    return validator.validateField(fieldName, value, rules);
  };

  const clearErrors = () => {
    validator.clearErrors();
  };

  const clearFieldError = (fieldName: string) => {
    validator.clearFieldError(fieldName);
  };

  return {
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    getErrors: () => validator.getErrors(),
    getFieldErrors: (fieldName: string) => validator.getFieldErrors(fieldName),
    hasFieldError: (fieldName: string) => validator.hasFieldError(fieldName)
  };
}

/**
 * Server-side validation helper
 */
export class ServerSideValidator {
  /**
   * Validate and sanitize input data
   */
  static validateAndSanitize<T extends Record<string, any>>(
    data: T,
    rules: ValidationRule[]
  ): { isValid: boolean; sanitizedData: T; errors: Record<string, string> } {
    const validator = new FormValidator();
    const validation = validator.validate(data, rules);

    // Sanitize data (trim strings, remove null/undefined)
    const sanitizedData = { ...data };
    for (const key in sanitizedData) {
      if (typeof sanitizedData[key] === 'string') {
        sanitizedData[key] = sanitizedData[key].trim();
      }
    }

    return {
      isValid: validation.isValid,
      sanitizedData,
      errors: validation.errors
    };
  }

  /**
   * Throw error if validation fails
   */
  static validateOrThrow(data: Record<string, any>, rules: ValidationRule[]): void {
    const validator = new FormValidator();
    const validation = validator.validate(data, rules);

    if (!validation.isValid) {
      const errorMessage = FormValidationUtils.formatErrors(validation.errors);
      throw new Error(errorMessage);
    }
  }
}

/**
 * Export utility for creating custom validation rules
 */
export function createValidationRule(
  field: string,
  rules: ValidationRule['rules']
): ValidationRule {
  return { field, rules };
}

/**
 * Export utility for creating custom validators
 */
export function createCustomValidator(
  message: string,
  validator: (value: any) => boolean
): ValidationRule['rules'][0] {
  return {
    type: 'custom',
    message,
    validator
  };
}
