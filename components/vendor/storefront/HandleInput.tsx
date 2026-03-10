'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { HandleValidationResult } from '@/types/storefront';
import { sanitizeHandle, generateStorefrontUrl } from '@/lib/storefront/client-url-service';

interface HandleInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, isAvailable: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function HandleInput({ 
  value, 
  onChange, 
  onValidationChange,
  disabled = false,
  className = '' 
}: HandleInputProps) {
  const [validationResult, setValidationResult] = useState<HandleValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Debounced validation function
  const validateHandle = useCallback(async (handle: string) => {
    if (!handle.trim()) {
      setValidationResult(null);
      onValidationChange?.(false, false);
      return;
    }

    setIsValidating(true);

    try {
      const response = await fetch('/api/storefront/validate-handle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle }),
      });

      const result = await response.json();

      if (result.success) {
        setValidationResult(result.data);
        onValidationChange?.(result.data.isValid, result.data.isAvailable);
      } else {
        setValidationResult({
          isValid: false,
          isAvailable: false,
          errors: [result.error || 'Validation failed']
        });
        onValidationChange?.(false, false);
      }
    } catch (error) {
      console.error('Handle validation error:', error);
      setValidationResult({
        isValid: false,
        isAvailable: false,
        errors: ['Unable to validate handle. Please try again.']
      });
      onValidationChange?.(false, false);
    } finally {
      setIsValidating(false);
    }
  }, [onValidationChange]);

  // Handle input changes with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // Set new timeout for validation
    const timeout = setTimeout(() => {
      validateHandle(newValue);
    }, 500); // 500ms debounce

    setValidationTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    validateHandle(suggestion);
  };

  // Generate preview URL
  const previewUrl = value ? generateStorefrontUrl(sanitizeHandle(value)) : '';

  // Determine validation status
  const getValidationStatus = () => {
    if (!value.trim()) return null;
    if (isValidating) return 'validating';
    if (!validationResult) return null;
    if (!validationResult.isValid) return 'invalid';
    if (!validationResult.isAvailable) return 'taken';
    return 'available';
  };

  const validationStatus = getValidationStatus();

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="storefront-handle" className="text-sm font-medium">
          Storefront Handle
        </Label>
        <div className="relative">
          <div className="flex">
            <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
              /store/
            </span>
            <Input
              id="storefront-handle"
              type="text"
              value={value}
              onChange={handleInputChange}
              disabled={disabled}
              placeholder="your-store-name"
              className={`rounded-l-none ${
                validationStatus === 'available' ? 'border-green-500 focus:border-green-500' :
                validationStatus === 'invalid' || validationStatus === 'taken' ? 'border-red-500 focus:border-red-500' :
                'border-gray-300'
              }`}
            />
          </div>
          
          {/* Validation indicator */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValidating && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
            {validationStatus === 'available' && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {(validationStatus === 'invalid' || validationStatus === 'taken') && (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Preview URL */}
        {previewUrl && validationStatus === 'available' && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Preview:</span>
            <a 
              href={previewUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
            >
              {previewUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Validation messages */}
      {validationResult && (
        <div className="space-y-2">
          {/* Error messages */}
          {validationResult.errors && validationResult.errors.length > 0 && (
            <div className="space-y-1">
              {validationResult.errors.map((error, index) => (
                <p key={index} className="text-sm text-red-600 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  {error}
                </p>
              ))}
            </div>
          )}

          {/* Success message */}
          {validationResult.isValid && validationResult.isAvailable && (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Handle is available!
            </p>
          )}

          {/* Handle taken message with suggestions */}
          {validationResult.isValid && !validationResult.isAvailable && (
            <div className="space-y-2">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Handle is already taken
              </p>
              
              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Try these available alternatives:</p>
                  <div className="flex flex-wrap gap-2">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Handle must be 3-50 characters long and contain only letters, numbers, and hyphens.
      </p>
    </div>
  );
}