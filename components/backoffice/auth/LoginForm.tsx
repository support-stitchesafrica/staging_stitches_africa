/**
 * Back Office Login Form Component
 * 
 * Provides email/password authentication for back office users.
 * Implements Bumpa-style design with gradients and modern UI.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

'use client';

import React, { useState, FormEvent, memo } from "react";
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * Login Form Component
 * Handles user authentication with email and password
 */
function LoginForm() {
  const router = useRouter();
  const { signIn, error: authError, clearError } = useBackOfficeAuth();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Validate form fields
   * Requirement: 1.2 - Form validation
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
    
    // Clear auth error when user starts typing
    if (authError) {
      clearError();
    }
  };

  /**
   * Handle form submission
   * Requirement: 1.1 - Email/password authentication
   * Requirement: 1.3 - Load user role and permissions
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      // Sign in using auth context
      await signIn(formData.email.trim(), formData.password);
      
      // Redirect to dashboard on success
      // The auth context will handle loading user permissions
      router.push('/backoffice');
    } catch (err) {
      console.error('Login error:', err);
      // Error is handled by auth context
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle forgot password
   * Sends password reset email
   */
  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setErrors({ email: 'Please enter your email address first' });
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }
    
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      const { auth } = await import('@/firebase');
      
      await sendPasswordResetEmail(auth, formData.email.trim());
      
      alert(`Password reset email sent to ${formData.email.trim()}. Please check your inbox.`);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      setErrors({ email: errorMessage });
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-white font-bold text-2xl">BO</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Back Office
        </h1>
        <p className="text-slate-400">
          Sign in to access your dashboard
        </p>
      </div>

      {/* Error Alert */}
      {authError && (
        <Alert variant="destructive" className="mb-6 bg-red-900/20 border-red-800 text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-200 font-medium">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              className={`
                pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500
                focus:border-blue-500 focus:ring-blue-500/20
                ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              `}
              autoFocus
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.email}
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
              placeholder="Enter your password"
              disabled={loading}
              className={`
                pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500
                focus:border-blue-500 focus:ring-blue-500/20
                ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              `}
              autoComplete="current-password"
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
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={handleForgotPassword}
            disabled={loading}
            className="p-0 h-auto text-sm text-blue-400 hover:text-blue-300"
          >
            Forgot your password?
          </Button>
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
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      {/* Help Text */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-500">
          By signing in, you agree to the STITCHES Africa Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default memo(LoginForm);
