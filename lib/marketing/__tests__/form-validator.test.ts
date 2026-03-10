/**
 * Form Validator Tests
 * Tests for the form validation utilities
 */

import { FormValidator, CommonValidationRules, FormValidationUtils } from '../form-validator';

describe('FormValidator', () => {
  let validator: FormValidator;

  beforeEach(() => {
    validator = new FormValidator();
  });

  describe('Required validation', () => {
    it('should fail when required field is empty', () => {
      const result = validator.validate(
        { name: '' },
        [{ field: 'name', rules: [{ type: 'required', message: 'Name is required' }] }]
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Name is required');
    });

    it('should pass when required field has value', () => {
      const result = validator.validate(
        { name: 'Test Team' },
        [{ field: 'name', rules: [{ type: 'required', message: 'Name is required' }] }]
      );

      expect(result.isValid).toBe(true);
      expect(result.errors.name).toBeUndefined();
    });
  });

  describe('Email validation', () => {
    it('should fail for invalid email format', () => {
      const result = validator.validate(
        { email: 'invalid-email' },
        [{ field: 'email', rules: [{ type: 'email', message: 'Invalid email' }] }]
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Invalid email');
    });

    it('should pass for valid email format', () => {
      const result = validator.validate(
        { email: 'test@example.com' },
        [{ field: 'email', rules: [{ type: 'email', message: 'Invalid email' }] }]
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('Length validation', () => {
    it('should fail when value is too short', () => {
      const result = validator.validate(
        { name: 'A' },
        [{ field: 'name', rules: [{ type: 'minLength', value: 2, message: 'Too short' }] }]
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Too short');
    });

    it('should fail when value is too long', () => {
      const result = validator.validate(
        { name: 'A'.repeat(101) },
        [{ field: 'name', rules: [{ type: 'maxLength', value: 100, message: 'Too long' }] }]
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Too long');
    });

    it('should pass when value is within length limits', () => {
      const result = validator.validate(
        { name: 'Valid Name' },
        [
          { field: 'name', rules: [
            { type: 'minLength', value: 2, message: 'Too short' },
            { type: 'maxLength', value: 100, message: 'Too long' }
          ]}
        ]
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('Custom validation', () => {
    it('should use custom validator function', () => {
      const result = validator.validate(
        { password: 'weak' },
        [{
          field: 'password',
          rules: [{
            type: 'custom',
            message: 'Password must contain a number',
            validator: (value) => /\d/.test(value)
          }]
        }]
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.password).toBe('Password must contain a number');
    });

    it('should pass custom validation when condition is met', () => {
      const result = validator.validate(
        { password: 'strong123' },
        [{
          field: 'password',
          rules: [{
            type: 'custom',
            message: 'Password must contain a number',
            validator: (value) => /\d/.test(value)
          }]
        }]
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('Multiple field validation', () => {
    it('should validate multiple fields', () => {
      const result = validator.validate(
        { name: '', email: 'invalid' },
        [
          { field: 'name', rules: [{ type: 'required', message: 'Name required' }] },
          { field: 'email', rules: [{ type: 'email', message: 'Invalid email' }] }
        ]
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Name required');
      expect(result.errors.email).toBe('Invalid email');
    });
  });
});

describe('FormValidationUtils', () => {
  describe('validateTeamForm', () => {
    it('should validate team form data', () => {
      const result = FormValidationUtils.validateTeamForm({
        name: 'Test Team',
        description: 'A test team',
        leadUserId: 'user123'
      });

      expect(result.isValid).toBe(true);
    });

    it('should fail for invalid team form data', () => {
      const result = FormValidationUtils.validateTeamForm({
        name: 'A', // Too short
        description: '',
        leadUserId: ''
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.leadUserId).toBeDefined();
    });
  });

  describe('validateInvitationForm', () => {
    it('should validate invitation form data', () => {
      const result = FormValidationUtils.validateInvitationForm({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'team_member'
      });

      expect(result.isValid).toBe(true);
    });

    it('should fail for invalid invitation form data', () => {
      const result = FormValidationUtils.validateInvitationForm({
        name: '',
        email: 'invalid-email',
        role: ''
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.role).toBeDefined();
    });
  });

  describe('validateAssignmentForm', () => {
    it('should validate assignment form data', () => {
      const result = FormValidationUtils.validateAssignmentForm({
        vendorId: 'vendor123',
        userId: 'user123',
        notes: 'Some notes'
      });

      expect(result.isValid).toBe(true);
    });

    it('should fail for invalid assignment form data', () => {
      const result = FormValidationUtils.validateAssignmentForm({
        vendorId: '',
        userId: '',
        notes: 'A'.repeat(1001) // Too long
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.vendorId).toBeDefined();
      expect(result.errors.userId).toBeDefined();
      expect(result.errors.notes).toBeDefined();
    });
  });

  describe('formatErrors', () => {
    it('should format errors as a string', () => {
      const errors = {
        name: 'Name is required',
        email: 'Invalid email'
      };

      const formatted = FormValidationUtils.formatErrors(errors);
      expect(formatted).toContain('Name is required');
      expect(formatted).toContain('Invalid email');
    });
  });

  describe('getFirstError', () => {
    it('should return first error', () => {
      const errors = {
        name: 'Name is required',
        email: 'Invalid email'
      };

      const firstError = FormValidationUtils.getFirstError(errors);
      expect(firstError).toBe('Name is required');
    });

    it('should return null when no errors', () => {
      const firstError = FormValidationUtils.getFirstError({});
      expect(firstError).toBeNull();
    });
  });

  describe('hasErrors', () => {
    it('should return true when errors exist', () => {
      const errors = { name: 'Error' };
      expect(FormValidationUtils.hasErrors(errors)).toBe(true);
    });

    it('should return false when no errors', () => {
      expect(FormValidationUtils.hasErrors({})).toBe(false);
    });
  });
});

describe('CommonValidationRules', () => {
  it('should have team validation rules', () => {
    expect(CommonValidationRules.team.name).toBeDefined();
    expect(CommonValidationRules.team.description).toBeDefined();
    expect(CommonValidationRules.team.leadUserId).toBeDefined();
  });

  it('should have invitation validation rules', () => {
    expect(CommonValidationRules.invitation.name).toBeDefined();
    expect(CommonValidationRules.invitation.email).toBeDefined();
    expect(CommonValidationRules.invitation.role).toBeDefined();
  });

  it('should have assignment validation rules', () => {
    expect(CommonValidationRules.assignment.vendorId).toBeDefined();
    expect(CommonValidationRules.assignment.userId).toBeDefined();
    expect(CommonValidationRules.assignment.notes).toBeDefined();
  });

  it('should have user profile validation rules', () => {
    expect(CommonValidationRules.userProfile.displayName).toBeDefined();
    expect(CommonValidationRules.userProfile.email).toBeDefined();
  });
});
