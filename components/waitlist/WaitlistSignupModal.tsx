/**
 * Waitlist Signup Modal Component
 * Modal form for joining waitlists
 */

"use client";

import React, { useState } from 'react';
import { Waitlist, WaitlistSignupForm } from '@/types/waitlist';
import { X, Mail, MessageCircle, User, Loader2 } from 'lucide-react';

interface WaitlistSignupModalProps {
  waitlist: Waitlist;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WaitlistSignupModal({ waitlist, onClose, onSuccess }: WaitlistSignupModalProps) {
  const [formData, setFormData] = useState<WaitlistSignupForm>({
    fullName: '',
    email: '',
    whatsapp: '',
    waitlistId: waitlist.id
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof WaitlistSignupForm, value: string) => {
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
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!formData.whatsapp.trim()) {
      setError('WhatsApp number is required');
      return false;
    }
    
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = formData.whatsapp.replace(/\s/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid WhatsApp number (include country code)');
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
      const response = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signup-source': 'landing_page'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to join waitlist');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error('Signup error:', err);
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
    handleInputChange('whatsapp', formatted);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Join the Waitlist</h2>
            <p className="text-sm text-gray-600 mt-1">{waitlist.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email address"
                required
                disabled={loading}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MessageCircle className="w-4 h-4 inline mr-1" />
                WhatsApp Number *
              </label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+234 801 234 5678"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +234 for Nigeria)
              </p>
            </div>
          </div>

          {/* Notification Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              You'll receive notifications via:
            </h4>
            <div className="space-y-1">
              {(waitlist.notificationChannels.includes('EMAIL') || waitlist.notificationChannels.includes('BOTH')) && (
                <div className="flex items-center text-sm text-blue-800">
                  <Mail className="w-4 h-4 mr-2" />
                  Email updates and launch notifications
                </div>
              )}
              {(waitlist.notificationChannels.includes('WHATSAPP') || waitlist.notificationChannels.includes('BOTH')) && (
                <div className="flex items-center text-sm text-blue-800">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp messages and exclusive content
                </div>
              )}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-4 text-xs text-gray-500">
            By joining this waitlist, you agree to receive notifications about this collection. 
            We respect your privacy and won't spam you.
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Waitlist'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}