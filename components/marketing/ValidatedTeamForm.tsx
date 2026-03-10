/**
 * Validated Team Form Component
 * Example of using form validation in a team creation/edit form
 * Requirements: 16.5
 */

'use client';

import React, { useState } from 'react';
import { useFormValidation } from '@/lib/marketing/useFormValidation';
import { CommonValidationRules, createValidationRule } from '@/lib/marketing/form-validator';
import { ValidatedInput, FormErrors, SuccessMessage } from './ValidationError';

interface TeamFormData {
  name: string;
  description: string;
  leadUserId: string;
}

interface ValidatedTeamFormProps {
  initialData?: Partial<TeamFormData>;
  onSubmit: (data: TeamFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  teamLeads?: Array<{ id: string; name: string }>;
}

/**
 * Example validated team form component
 */
export function ValidatedTeamForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Create Team',
  teamLeads = []
}: ValidatedTeamFormProps) {
  const [formData, setFormData] = useState<TeamFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    leadUserId: initialData?.leadUserId || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  const { validate, errors, clearErrors, getFieldError, validateField } = useFormValidation();

  // Define validation rules
  const validationRules = [
    createValidationRule('name', CommonValidationRules.team.name),
    createValidationRule('description', CommonValidationRules.team.description),
    createValidationRule('leadUserId', CommonValidationRules.team.leadUserId)
  ];

  /**
   * Handle field change with real-time validation
   */
  const handleFieldChange = (field: keyof TeamFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear success message on change
    if (successMessage) {
      setSuccessMessage(undefined);
    }

    // Validate field on change
    const rule = validationRules.find(r => r.field === field);
    if (rule) {
      validateField(field, value, rule.rules);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous messages
    clearErrors();
    setSuccessMessage(undefined);

    // Validate form
    const isValid = validate(formData, validationRules);
    
    if (!isValid) {
      return;
    }

    // Submit form
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      setSuccessMessage('Team saved successfully!');
      
      // Reset form if creating new team
      if (!initialData) {
        setFormData({ name: '', description: '', leadUserId: '' });
      }
    } catch (error) {
      // Error will be handled by parent component
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Display form-level errors */}
      <FormErrors errors={errors} onDismiss={clearErrors} />

      {/* Display success message */}
      {successMessage && (
        <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage(undefined)} />
      )}

      {/* Team Name Field */}
      <ValidatedInput
        label="Team Name"
        error={getFieldError('name')}
        required
      >
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            getFieldError('name')
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="Enter team name"
          disabled={isSubmitting}
        />
      </ValidatedInput>

      {/* Description Field */}
      <ValidatedInput
        label="Description"
        error={getFieldError('description')}
      >
        <textarea
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            getFieldError('description')
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="Enter team description (optional)"
          rows={3}
          disabled={isSubmitting}
        />
      </ValidatedInput>

      {/* Team Lead Field */}
      <ValidatedInput
        label="Team Lead"
        error={getFieldError('leadUserId')}
        required
      >
        <select
          value={formData.leadUserId}
          onChange={(e) => handleFieldChange('leadUserId', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            getFieldError('leadUserId')
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          disabled={isSubmitting}
        >
          <option value="">Select a team lead</option>
          {teamLeads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.name}
            </option>
          ))}
        </select>
      </ValidatedInput>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
