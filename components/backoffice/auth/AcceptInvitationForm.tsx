/**
 * Back Office Accept Invitation Form Component
 * 
 * Allows invited users to accept their invitation and create their account.
 * Implements token validation, account creation, and password setup.
 * 
 * Requirements: 2.3, 2.4, 2.5
 */

'use client';

import React, { useState, useEffect, FormEvent, memo } from "react";
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Lock, User, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BackOfficeRole, Department } from '@/types/backoffice';

interface InvitationData {
  id: string;
  email: string;
  role: BackOfficeRole;
  departments: Department[];
  invitedBy: string;
  invitedByName: string;
  expiresAt: number; // Timestamp in milliseconds
  createdAt: number; // Timestamp in milliseconds
}

interface FormData {
  fullName: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  password?: string;
  confirmPassword?: string;
}

interface AcceptInvitationFormProps {
  token: string;
}

/**
 * Accept Invitation Form Component
 * Handles invitation validation and account creation
 */
function AcceptInvitationForm({ token }: AcceptInvitationFormProps) {
  const router = useRouter();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [validating, setValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Validate invitation token on component mount
   * Requirement: 2.3 - Validate token and display acceptance form
   * Requirement: 2.5 - Prevent acceptance of expired invitations
   */
  useEffect(() => {
    const validateToken = async () => {
      try {
        setValidating(true);
        setValidationError(null);
        
        const response = await fetch('/api/backoffice/invitations/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.isValid) {
          setValidationError(data.error || 'Invalid invitation token');
          return;
        }
        
        setInvitation(data.invitation);
      } catch (error) {
        console.error('Error validating invitation:', error);
        setValidationError('Failed to validate invitation. Please try again.');
      } finally {
        setValidating(false);
      }
    };
    
    validateToken();
  }, [token]);

  /**
   * Validate form fields
   * Requirement: 2.4 - Account creation with password setup
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }
    
    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input field changes
   * Clears field-specific errors when user types
   */
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear accept error when user starts typing
    if (acceptError) {
      setAcceptError(null);
    }
  };

  /**
   * Handle form submission
   * Requirement: 2.4 - Create account with assigned role and permissions
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    setAcceptError(null);
    
    try {
      const response = await fetch('/api/backoffice/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          fullName: formData.fullName.trim(),
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }
      
      // Show success message
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/backoffice/login?message=Account created successfully. Please sign in.');
      }, 2000);
    } catch (err) {
      console.error('Accept invitation error:', err);
      setAcceptError(err instanceof Error ? err.message : 'Failed to accept invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format role for display
   */
  const formatRole = (role: string): string => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  /**
   * Format departments for display
   */
  const formatDepartments = (departments: string[]): string => {
    return departments
      .map(dept => dept.charAt(0).toUpperCase() + dept.slice(1))
      .join(', ');
  };

  /**
   * Calculate days until expiration
   */
  const getDaysUntilExpiration = (): number => {
    if (!invitation) return 0;
    
    const expiresAt = invitation.expiresAt;
    const now = Date.now();
    const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysRemaining);
  };

  // Loading state while validating token
  if (validating) {
    return (
      <div className="w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Validating Invitation
        </h1>
        <p className="text-slate-400">
          Please wait while we verify your invitation...
        </p>
      </div>
    );
  }

  // Error state if validation failed
  if (validationError) {
    return (
      <div className="w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900/20 rounded-2xl mb-4 border-2 border-red-800">
          <XCircle className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Invalid Invitation
        </h1>
        <p className="text-slate-400 mb-6">
          {validationError}
        </p>
        <Button
          onClick={() => router.push('/backoffice/login')}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  // Success state after accepting invitation
  if (success) {
    return (
      <div className="w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/20 rounded-2xl mb-4 border-2 border-green-800">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Account Created Successfully!
        </h1>
        <p className="text-slate-400 mb-4">
          Your back office account has been created.
        </p>
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Redirecting to login...</span>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-white font-bold text-2xl">BO</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Accept Invitation
        </h1>
        <p className="text-slate-400">
          Create your back office account
        </p>
      </div>

      {/* Invitation Details */}
      {invitation && (
        <div className="mb-6 p-4 bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border border-blue-800/50 rounded-lg">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Email:</span>
              <span className="text-white font-medium">{invitation.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Role:</span>
              <span className="text-white font-medium">{formatRole(invitation.role)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Departments:</span>
              <span className="text-white font-medium">{formatDepartments(invitation.departments)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Invited by:</span>
              <span className="text-white font-medium">{invitation.invitedByName}</span>
            </div>
          </div>
          
          {/* Expiration Warning */}
          {getDaysUntilExpiration() <= 2 && (
            <div className="mt-3 pt-3 border-t border-blue-800/50 flex items-center gap-2 text-yellow-400">
              <Clock className="h-4 w-4" />
              <span className="text-xs">
                Expires in {getDaysUntilExpiration()} {getDaysUntilExpiration() === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {acceptError && (
        <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-800 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{acceptError}</AlertDescription>
        </Alert>
      )}

      {/* Accept Invitation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name Field */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-slate-200 font-medium">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full name"
              disabled={loading}
              className={`
                pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500
                focus:border-blue-500 focus:ring-blue-500/20
                ${errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              `}
              autoFocus
              autoComplete="name"
            />
          </div>
          {errors.fullName && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-200 font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Create a strong password"
              disabled={loading}
              className={`
                pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500
                focus:border-blue-500 focus:ring-blue-500/20
                ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              `}
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-slate-200"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.password}
            </p>
          )}
          <p className="text-xs text-slate-500">
            Must be at least 8 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-slate-200 font-medium">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              disabled={loading}
              className={`
                pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500
                focus:border-blue-500 focus:ring-blue-500/20
                ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              `}
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-slate-200"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Accept Invitation & Create Account'
          )}
        </Button>
      </form>

      {/* Help Text */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500">
          By creating an account, you agree to the STITCHES Africa Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default memo(AcceptInvitationForm);
