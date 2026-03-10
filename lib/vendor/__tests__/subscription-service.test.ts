/**
 * Subscription Service Tests
 * Basic tests for subscription validation and processing
 */

import { describe, it, expect, vi } from 'vitest';
import { SubscriptionService } from '../subscription-service';
import { SubscriptionForm } from '@/types/vendor-waitlist';

describe('SubscriptionService', () => {
  describe('validateSubscriptionForm', () => {
    it('should validate a valid subscription form', () => {
      const validForm: SubscriptionForm = {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phoneNumber: '+2348012345678',
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false
      };

      const result = SubscriptionService.validateSubscriptionForm(validForm);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.isDuplicate).toBe(false);
    });

    it('should reject form with missing full name', () => {
      const invalidForm: SubscriptionForm = {
        fullName: '',
        email: 'john.doe@example.com',
        phoneNumber: '+2348012345678'
      };

      const result = SubscriptionService.validateSubscriptionForm(invalidForm);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('fullName');
      expect(result.errors[0].code).toBe('REQUIRED_FIELD');
    });

    it('should reject form with invalid email', () => {
      const invalidForm: SubscriptionForm = {
        fullName: 'John Doe',
        email: 'invalid-email',
        phoneNumber: '+2348012345678'
      };

      const result = SubscriptionService.validateSubscriptionForm(invalidForm);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('email');
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });

    it('should reject form with invalid phone number', () => {
      const invalidForm: SubscriptionForm = {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phoneNumber: 'invalid-phone'
      };

      const result = SubscriptionService.validateSubscriptionForm(invalidForm);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('phoneNumber');
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });

    it('should validate multiple errors', () => {
      const invalidForm: SubscriptionForm = {
        fullName: '',
        email: 'invalid-email',
        phoneNumber: 'invalid-phone'
      };

      const result = SubscriptionService.validateSubscriptionForm(invalidForm);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('utility methods', () => {
    it('should validate email format correctly', () => {
      expect(SubscriptionService.isValidEmail('test@example.com')).toBe(true);
      expect(SubscriptionService.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(SubscriptionService.isValidEmail('invalid-email')).toBe(false);
      expect(SubscriptionService.isValidEmail('test@')).toBe(false);
      expect(SubscriptionService.isValidEmail('@domain.com')).toBe(false);
    });

    it('should validate phone number format correctly', () => {
      expect(SubscriptionService.isValidPhoneNumber('+2348012345678')).toBe(true);
      expect(SubscriptionService.isValidPhoneNumber('+1234567890')).toBe(true);
      expect(SubscriptionService.isValidPhoneNumber('invalid-phone')).toBe(false);
      expect(SubscriptionService.isValidPhoneNumber('2348012345678')).toBe(true);
    });

    it('should normalize email correctly', () => {
      expect(SubscriptionService.normalizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(SubscriptionService.normalizeEmail('User@Domain.Co.UK')).toBe('user@domain.co.uk');
    });

    it('should normalize phone number correctly', () => {
      expect(SubscriptionService.normalizePhoneNumber('+234 801 234 5678')).toBe('+2348012345678');
      expect(SubscriptionService.normalizePhoneNumber('(080) 123-456')).toBe('080123456');
    });
  });

  describe('extractSubscriptionMetadata', () => {
    it('should extract metadata from request headers', () => {
      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            const headers = {
              'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
              'referer': 'https://example.com/collection/test',
              'x-forwarded-for': '192.168.1.1, 10.0.0.1',
              'x-real-ip': '192.168.1.1'
            };
            return headers[header] || null;
          })
        }
      } as unknown as Request;

      const metadata = SubscriptionService.extractSubscriptionMetadata(mockRequest);
      
      expect(metadata.userAgent).toBe('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');
      expect(metadata.referrer).toBe('https://example.com/collection/test');
      expect(metadata.ipAddress).toBe('192.168.1.1');
      expect(metadata.deviceType).toBe('mobile');
    });

    it('should handle missing headers gracefully', () => {
      const mockRequest = {
        headers: {
          get: vi.fn(() => null)
        }
      } as unknown as Request;

      const metadata = SubscriptionService.extractSubscriptionMetadata(mockRequest);
      
      expect(metadata.userAgent).toBeUndefined();
      expect(metadata.referrer).toBeUndefined();
      expect(metadata.ipAddress).toBeUndefined();
      expect(metadata.deviceType).toBe('unknown');
    });
  });
});