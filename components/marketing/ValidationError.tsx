/**
 * Validation Error Display Component
 * Shows validation errors in a user-friendly format
 * Requirements: 16.5
 */

'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ValidationErrorProps {
  error?: string;
  errors?: string[];
  className?: string;
  onDismiss?: () => void;
}

/**
 * Single validation error display
 */
export function ValidationError({ error, errors, className = '', onDismiss }: ValidationErrorProps) {
  const errorList = errors || (error ? [error] : []);

  if (errorList.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm ${className}`}>
      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        {errorList.length === 1 ? (
          <p className="text-red-800">{errorList[0]}</p>
        ) : (
          <ul className="list-disc list-inside text-red-800 space-y-1">
            {errorList.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800 flex-shrink-0"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Field-level validation error display
 */
export function FieldError({ error, className = '' }: { error?: string; className?: string }) {
  if (!error) {
    return null;
  }

  return (
    <p className={`text-sm text-red-600 mt-1 ${className}`}>
      {error}
    </p>
  );
}

/**
 * Form-level validation errors display
 */
export function FormErrors({ 
  errors, 
  className = '',
  title = 'Please fix the following errors:',
  onDismiss 
}: { 
  errors: Record<string, string>; 
  className?: string;
  title?: string;
  onDismiss?: () => void;
}) {
  const errorList = Object.values(errors);

  if (errorList.length === 0) {
    return null;
  }

  return (
    <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-2">{title}</h3>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {errorList.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 flex-shrink-0"
            aria-label="Dismiss errors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Success message display
 */
export function SuccessMessage({ 
  message, 
  className = '',
  onDismiss 
}: { 
  message: string; 
  className?: string;
  onDismiss?: () => void;
}) {
  return (
    <div className={`flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-sm ${className}`}>
      <div className="flex-1">
        <p className="text-green-800">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-600 hover:text-green-800 flex-shrink-0"
          aria-label="Dismiss message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Input wrapper with validation error display
 */
export function ValidatedInput({
  label,
  error,
  required = false,
  children,
  className = ''
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      <FieldError error={error} />
    </div>
  );
}
