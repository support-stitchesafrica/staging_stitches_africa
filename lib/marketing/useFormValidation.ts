/**
 * React Hook for Form Validation
 * Client-side form validation hook for marketing dashboard
 * Requirements: 16.5
 */

'use client';

import { useState, useCallback } from 'react';
import { FormValidator, ValidationRule, ValidationResult } from './form-validator';

export interface UseFormValidationReturn {
  errors: Record<string, string>;
  fieldErrors: Map<string, string[]>;
  isValid: boolean;
  validate: (data: Record<string, any>, rules: ValidationRule[]) => boolean;
  validateField: (fieldName: string, value: any, rules: ValidationRule['rules']) => boolean;
  setFieldError: (fieldName: string, error: string) => void;
  clearErrors: () => void;
  clearFieldError: (fieldName: string) => void;
  getFieldError: (fieldName: string) => string | undefined;
  hasFieldError: (fieldName: string) => boolean;
}

/**
 * Custom hook for form validation
 */
export function useFormValidation(): UseFormValidationReturn {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Map<string, string[]>>(new Map());
  const [isValid, setIsValid] = useState(true);

  const validator = new FormValidator();

  /**
   * Validate entire form
   */
  const validate = useCallback((data: Record<string, any>, rules: ValidationRule[]): boolean => {
    const result: ValidationResult = validator.validate(data, rules);
    
    setErrors(result.errors);
    setFieldErrors(result.fieldErrors);
    setIsValid(result.isValid);

    return result.isValid;
  }, []);

  /**
   * Validate single field
   */
  const validateField = useCallback((
    fieldName: string,
    value: any,
    rules: ValidationRule['rules']
  ): boolean => {
    const fieldErrorsList = validator.validateField(fieldName, value, rules);
    
    if (fieldErrorsList.length > 0) {
      setErrors(prev => ({ ...prev, [fieldName]: fieldErrorsList[0] }));
      setFieldErrors(prev => {
        const newMap = new Map(prev);
        newMap.set(fieldName, fieldErrorsList);
        return newMap;
      });
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      setFieldErrors(prev => {
        const newMap = new Map(prev);
        newMap.delete(fieldName);
        return newMap;
      });
      return true;
    }
  }, []);

  /**
   * Set error for a specific field
   */
  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    setFieldErrors(prev => {
      const newMap = new Map(prev);
      newMap.set(fieldName, [error]);
      return newMap;
    });
    setIsValid(false);
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
    setFieldErrors(new Map());
    setIsValid(true);
  }, []);

  /**
   * Clear error for a specific field
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    setFieldErrors(prev => {
      const newMap = new Map(prev);
      newMap.delete(fieldName);
      return newMap;
    });
  }, []);

  /**
   * Get error for a specific field
   */
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return errors[fieldName];
  }, [errors]);

  /**
   * Check if field has error
   */
  const hasFieldError = useCallback((fieldName: string): boolean => {
    return fieldName in errors;
  }, [errors]);

  return {
    errors,
    fieldErrors,
    isValid,
    validate,
    validateField,
    setFieldError,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasFieldError
  };
}

/**
 * Hook for real-time field validation
 */
export function useFieldValidation(
  fieldName: string,
  rules: ValidationRule['rules']
) {
  const [error, setError] = useState<string | undefined>();
  const [isValid, setIsValid] = useState(true);

  const validator = new FormValidator();

  const validate = useCallback((value: any): boolean => {
    const errors = validator.validateField(fieldName, value, rules);
    
    if (errors.length > 0) {
      setError(errors[0]);
      setIsValid(false);
      return false;
    } else {
      setError(undefined);
      setIsValid(true);
      return true;
    }
  }, [fieldName, rules]);

  const clearError = useCallback(() => {
    setError(undefined);
    setIsValid(true);
  }, []);

  return {
    error,
    isValid,
    validate,
    clearError
  };
}

/**
 * Hook for form submission with validation
 */
export function useValidatedForm<T extends Record<string, any>>(
  validationRules: ValidationRule[],
  onSubmit: (data: T) => Promise<void> | void
) {
  const { validate, errors, clearErrors, setFieldError } = useFormValidation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const handleSubmit = useCallback(async (data: T) => {
    // Clear previous errors
    clearErrors();
    setSubmitError(undefined);

    // Validate form
    const isValid = validate(data, validationRules);
    
    if (!isValid) {
      return;
    }

    // Submit form
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setSubmitError(errorMessage);
      
      // Try to extract field-specific errors from error message
      // This is a simple implementation - can be enhanced based on error format
      if (errorMessage.includes(':')) {
        const [field, message] = errorMessage.split(':').map(s => s.trim());
        if (field && message) {
          setFieldError(field, message);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, validationRules, onSubmit, clearErrors, setFieldError]);

  return {
    handleSubmit,
    errors,
    submitError,
    isSubmitting,
    clearErrors
  };
}
