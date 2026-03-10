/**
 * Create Event Form Component
 * 
 * Form for creating new promotional events with validation and Bumpa-style design.
 * Integrates with promotional_events collection and handles event creation workflow.
 * 
 * Requirements: 11.3, 12.3, 12.4, 14.5, 16.2, 16.3
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBackOfficeAuth } from '@/contexts/BackOfficeAuthContext';
import { PromotionalEventService } from '@/lib/promotionals/event-service';
import DashboardCard from '@/components/backoffice/DashboardCard';

/**
 * Form data interface
 */
interface EventFormData {
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

/**
 * Form validation errors
 */
interface FormErrors {
  name?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  general?: string;
}

export default function CreateEventForm() {
  const router = useRouter();
  const { backOfficeUser, hasPermission } = useBackOfficeAuth();

  // Check permissions
  const canWrite = hasPermission('promotions', 'write');

  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    startDate: '',
    endDate: '',
    startTime: '00:00',
    endTime: '23:59',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle input changes
   */
  const handleInputChange = useCallback((field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  /**
   * Validate form data
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Event name must be at least 3 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Event name must be less than 100 characters';
    }

    // Validate dates
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    // Validate date range
    if (formData.startDate && formData.endDate) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      const now = new Date();

      if (startDateTime >= endDateTime) {
        newErrors.endDate = 'End date must be after start date';
      }

      // Allow events to start in the past (for testing purposes)
      // but warn if it's more than a day in the past
      if (startDateTime < new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
        newErrors.startDate = 'Start date is more than 24 hours in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canWrite) {
      toast.error('You do not have permission to create events');
      return;
    }

    if (!backOfficeUser) {
      toast.error('You must be logged in to create events');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      // Combine date and time
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      // Create event
      const event = await PromotionalEventService.createEvent({
        name: formData.name.trim(),
        startDate: startDateTime,
        endDate: endDateTime,
        createdBy: backOfficeUser.uid,
      });

      toast.success('Event created successfully!');
      
      // Redirect to event details page
      router.push(`/backoffice/promotions/${event.id}`);
    } catch (error: any) {
      console.error('Error creating event:', error);
      
      const errorMessage = error.message || 'Failed to create event';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [canWrite, backOfficeUser, validateForm, formData, router]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    router.push('/backoffice/promotions');
  }, [router]);

  // Redirect if no permission
  if (!canWrite) {
    return (
      <div className="space-y-6">
        <DashboardCard>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 mb-6">
              You do not have permission to create promotional events.
            </p>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </button>
          </div>
        </DashboardCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCancel}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Promotional Event</h1>
          <p className="text-gray-600 mt-1">
            Set up a new promotional campaign with custom dates and products
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{errors.general}</p>
          </div>
        )}

        {/* Event Details */}
        <DashboardCard
          title="Event Details"
          description="Basic information about your promotional event"
          icon={Calendar}
        >
          <div className="space-y-6">
            {/* Event Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Summer Sale 2024, Black Friday Deals"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                maxLength={100}
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                {formData.name.length}/100 characters
              </p>
            </div>
          </div>
        </DashboardCard>

        {/* Event Schedule */}
        <DashboardCard
          title="Event Schedule"
          description="Set the start and end dates for your promotional event"
          icon={Clock}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date & Time */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Start Date & Time</h4>
              
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.startDate}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">End Date & Time</h4>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.endDate}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Date Range Preview */}
          {formData.startDate && formData.endDate && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Event Duration</span>
              </div>
              <p className="text-blue-700 mt-1">
                {new Date(`${formData.startDate}T${formData.startTime}`).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' → '}
                {new Date(`${formData.endDate}T${formData.endTime}`).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </DashboardCard>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Event...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Event
              </>
            )}
          </button>
        </div>
      </form>

      {/* Next Steps Info */}
      <DashboardCard>
        <div className="text-center py-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            What happens next?
          </h3>
          <div className="text-gray-600 space-y-2">
            <p>1. After creating the event, you can add products and set discounts</p>
            <p>2. Upload a banner image to make your event more attractive</p>
            <p>3. Publish the event to make it visible to customers</p>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
