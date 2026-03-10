/**
 * Collection Subscription Modal Component
 * Modal form for subscribing to collection waitlists
 */

"use client";

import React, { useState } from 'react';
import { CollectionWaitlist, SubscriptionForm } from '@/types/vendor-waitlist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  X, 
  Mail, 
  Phone, 
  User, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Users,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface CollectionSubscriptionModalProps {
  collection: CollectionWaitlist;
  slug: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CollectionSubscriptionModal({ 
  collection, 
  slug, 
  onClose, 
  onSuccess 
}: CollectionSubscriptionModalProps) {
  const [formData, setFormData] = useState<SubscriptionForm>({
    fullName: '',
    email: '',
    phoneNumber: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');

  const handleInputChange = (field: keyof SubscriptionForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    
    if (formData.fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = formData.phoneNumber.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid phone number (include country code)');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/collection-waitlists/${slug}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-subscription-source': 'collection_page'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setStep('success');
        // Auto-close and trigger success after showing success message
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(result.error || 'Failed to join waitlist');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Subscription error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits except +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with + if it doesn't already
    if (cleaned && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    }
    
    return cleaned;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('phoneNumber', formatted);
  };

  const progressPercentage = Math.min(
    (collection.currentSubscribers / collection.minSubscribers) * 100,
    100
  );

  if (step === 'success') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You're In!</h2>
            <p className="text-gray-600 mb-4">
              Welcome to the {collection.name} waitlist!
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                Check your email for confirmation and exclusive updates.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Join the Waitlist</DialogTitle>
          <DialogDescription>
            Get notified when {collection.name} launches
          </DialogDescription>
        </DialogHeader>

        {/* Collection Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <img
              src={collection.imageUrl}
              alt={collection.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{collection.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {collection.description}
              </p>
            </div>
          </div>
          
          {/* Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Users className="h-4 w-4" />
                Progress to Launch
              </span>
              <span className="font-medium">
                {collection.currentSubscribers} / {collection.minSubscribers}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {progressPercentage.toFixed(1)}% complete
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name *
            </Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={loading}
              className="transition-colors"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              required
              disabled={loading}
              className="transition-colors"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number *
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+234 801 234 5678"
              required
              disabled={loading}
              className="transition-colors"
            />
            <p className="text-xs text-gray-500">
              Include country code (e.g., +234 for Nigeria)
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
              <Star className="h-4 w-4" />
              What you'll get:
            </h4>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-blue-800">
                <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                Early access when the collection launches
              </div>
              <div className="flex items-center text-sm text-blue-800">
                <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                Exclusive updates and behind-the-scenes content
              </div>
              <div className="flex items-center text-sm text-blue-800">
                <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                Special offers and member-only discounts
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            By joining this waitlist, you agree to receive notifications about this collection. 
            We respect your privacy and won't spam you. You can unsubscribe at any time.
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Waitlist'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}