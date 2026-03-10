'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CheckCircle, AlertCircle, Users, TrendingUp } from 'lucide-react';

interface MotherInfluencerRegistrationProps {
  // No props needed - component handles success/error internally
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  profileImage?: string;
  businessName?: string;
  businessType?: string;
  socialMediaHandles: string;
  expectedMonthlyReferrals?: number;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  businessName?: string;
  socialMediaHandles?: string;
  expectedMonthlyReferrals?: string;
  general?: string;
}

/**
 * Mother Influencer Registration Component
 * Requirements: 1.1, 3.1
 */
export function MotherInfluencerRegistration() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    profileImage: '',
    businessName: '',
    businessType: '',
    socialMediaHandles: '',
    expectedMonthlyReferrals: undefined
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Business name validation (optional but recommended)
    if (formData.businessName && formData.businessName.trim().length < 2) {
      newErrors.businessName = 'Business name must be at least 2 characters';
    }

    // Social media handles validation
    if (formData.socialMediaHandles && formData.socialMediaHandles.trim()) {
      const handles = formData.socialMediaHandles.split(',').map(h => h.trim());
      if (handles.some(handle => handle.length < 2)) {
        newErrors.socialMediaHandles = 'Each social media handle must be at least 2 characters';
      }
    }

    // Expected monthly referrals validation
    if (formData.expectedMonthlyReferrals !== undefined && formData.expectedMonthlyReferrals < 0) {
      newErrors.expectedMonthlyReferrals = 'Expected monthly referrals cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const verificationData = {
        businessName: formData.businessName || undefined,
        businessType: formData.businessType || undefined,
        socialMediaHandles: formData.socialMediaHandles 
          ? formData.socialMediaHandles.split(',').map(h => h.trim()).filter(h => h.length > 0)
          : undefined,
        expectedMonthlyReferrals: formData.expectedMonthlyReferrals
      };

      const response = await fetch('/api/hierarchical-referral/mother-influencer/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          profileImage: formData.profileImage || undefined,
          verificationData: Object.values(verificationData).some(v => v !== undefined) 
            ? verificationData 
            : undefined
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        // Component handles success internally
      } else {
        const errorMessage = result.error?.message || 'Registration failed. Please try again.';
        setErrors({ general: errorMessage });
        // Component handles error internally
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setErrors({ general: errorMessage });
      // Component handles error internally
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Registration Submitted!</h3>
              <p className="text-sm text-gray-600 mt-2">
                Your Mother Influencer application has been submitted for review. 
                You'll receive an email notification once your account is verified and activated.
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>What's next?</strong><br />
                  • Our team will review your application within 24-48 hours<br />
                  • Once approved, you'll get access to your dashboard<br />
                  • You can then generate sub-referral codes for Mini Influencers
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Become a Mother Influencer
        </CardTitle>
        <CardDescription>
          Join our hierarchical referral program and build your own network of Mini Influencers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Basic Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Create a password (min. 6 characters)"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileImage">Profile Image URL (Optional)</Label>
              <Input
                id="profileImage"
                type="url"
                value={formData.profileImage}
                onChange={(e) => handleInputChange('profileImage', e.target.value)}
                placeholder="https://example.com/your-photo.jpg"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Business Information (Optional)
            </h4>
            <p className="text-sm text-gray-600">
              Providing business information helps us verify your application faster.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Your business or brand name"
                  disabled={isLoading}
                />
                {errors.businessName && (
                  <p className="text-sm text-red-500">{errors.businessName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Input
                  id="businessType"
                  type="text"
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  placeholder="e.g., Fashion, Tech, Lifestyle"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialMediaHandles">Social Media Handles</Label>
              <Textarea
                id="socialMediaHandles"
                value={formData.socialMediaHandles}
                onChange={(e) => handleInputChange('socialMediaHandles', e.target.value)}
                placeholder="@instagram, @twitter, @tiktok (separate with commas)"
                disabled={isLoading}
                rows={2}
              />
              {errors.socialMediaHandles && (
                <p className="text-sm text-red-500">{errors.socialMediaHandles}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedMonthlyReferrals">Expected Monthly Referrals</Label>
              <Input
                id="expectedMonthlyReferrals"
                type="number"
                min="0"
                value={formData.expectedMonthlyReferrals || ''}
                onChange={(e) => handleInputChange('expectedMonthlyReferrals', 
                  e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="How many referrals do you expect per month?"
                disabled={isLoading}
              />
              {errors.expectedMonthlyReferrals && (
                <p className="text-sm text-red-500">{errors.expectedMonthlyReferrals}</p>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Application...
              </>
            ) : (
              'Submit Mother Influencer Application'
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            By registering, you agree to our terms and conditions. 
            Your application will be reviewed within 24-48 hours.
          </div>
        </form>
      </CardContent>
    </Card>
  );
}