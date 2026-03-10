/**
 * Tests for Waitlist Notification Services
 * Basic unit tests for notification creation and template generation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WaitlistNotificationService } from './waitlist-notification-service';

describe('WaitlistNotificationService', () => {
  let service: WaitlistNotificationService;

  beforeEach(() => {
    service = new WaitlistNotificationService();
  });

  describe('Service Initialization', () => {
    it('should create an instance of WaitlistNotificationService', () => {
      expect(service).toBeInstanceOf(WaitlistNotificationService);
    });
  });

  describe('Template Generation', () => {
    it('should generate vendor notification template with required content', () => {
      const testData = {
        vendorName: 'Test Vendor',
        vendorEmail: 'vendor@test.com',
        collectionName: 'Summer Collection',
        subscriberName: 'John Doe',
        subscriberEmail: 'john@test.com',
        subscriberPhone: '+1234567890',
        currentSubscribers: 5,
        minSubscribers: 10,
        collectionUrl: 'https://example.com/collection/summer'
      };

      // Access private method for testing
      const template = (service as any).generateVendorNotificationTemplate(testData);

      expect(template.subject).toContain('Summer Collection');
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('john@test.com');
      expect(template.html).toContain('5'); // current subscribers
      expect(template.html).toContain('10'); // min subscribers
      expect(template.text).toContain('Summer Collection');
    });

    it('should generate subscriber confirmation template with required content', () => {
      const testData = {
        subscriberName: 'Jane Smith',
        subscriberEmail: 'jane@test.com',
        collectionName: 'Winter Collection',
        collectionDescription: 'Cozy winter fashion pieces',
        vendorName: 'Fashion House',
        collectionUrl: 'https://example.com/collection/winter',
        loginCredentials: {
          email: 'jane@test.com',
          temporaryPassword: 'temp123'
        }
      };

      // Access private method for testing
      const template = (service as any).generateSubscriberConfirmationTemplate(testData);

      expect(template.subject).toContain('Winter Collection');
      expect(template.html).toContain('Jane Smith');
      expect(template.html).toContain('Fashion House');
      expect(template.html).toContain('Cozy winter fashion pieces');
      expect(template.html).toContain('temp123');
      expect(template.text).toContain('Winter Collection');
    });

    it('should handle subscriber template without login credentials', () => {
      const testData = {
        subscriberName: 'Bob Wilson',
        subscriberEmail: 'bob@test.com',
        collectionName: 'Spring Collection',
        collectionDescription: 'Fresh spring styles',
        vendorName: 'Style Co',
        collectionUrl: 'https://example.com/collection/spring'
      };

      // Access private method for testing
      const template = (service as any).generateSubscriberConfirmationTemplate(testData);

      expect(template.subject).toContain('Spring Collection');
      expect(template.html).toContain('Bob Wilson');
      expect(template.html).not.toContain('Your Account Details');
      expect(template.text).not.toContain('Temporary Password');
    });
  });

  describe('Email Validation', () => {
    it('should validate email addresses correctly', () => {
      // Access private method for testing
      const isValidEmail = (service as any).isValidEmail.bind(service);

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('missing@')).toBe(false);
      expect(isValidEmail('@missing.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('Text Sanitization', () => {
    it('should sanitize text content for email', () => {
      // Access private method for testing
      const sanitizeText = (service as any).sanitizeText.bind(service);

      expect(sanitizeText('Normal text')).toBe('Normal text');
      expect(sanitizeText('Text with <script> tags')).toBe('Text with script tags');
      expect(sanitizeText('  Whitespace text  ')).toBe('Whitespace text');
      expect(sanitizeText('Text with > and < symbols')).toBe('Text with  and  symbols');
    });
  });

  describe('URL Generation', () => {
    it('should generate safe collection URLs', () => {
      // Access private method for testing
      const generateCollectionUrl = (service as any).generateCollectionUrl.bind(service);

      expect(generateCollectionUrl('summer-collection')).toContain('/waitlists/summer-collection');
      expect(generateCollectionUrl('collection with spaces')).toContain('collection%20with%20spaces');
      expect(generateCollectionUrl('special-chars!')).toContain('special-chars!');
    });
  });

  describe('Progress Calculations', () => {
    it('should calculate progress percentage correctly in templates', () => {
      const testData = {
        vendorName: 'Test Vendor',
        vendorEmail: 'vendor@test.com',
        collectionName: 'Test Collection',
        subscriberName: 'Test User',
        subscriberEmail: 'user@test.com',
        subscriberPhone: '+1234567890',
        currentSubscribers: 7,
        minSubscribers: 10,
        collectionUrl: 'https://example.com/test'
      };

      // Access private method for testing
      const template = (service as any).generateVendorNotificationTemplate(testData);

      // Should show 70% progress (7/10 * 100)
      expect(template.html).toContain('70%');
      // Should show 3 remaining subscribers
      expect(template.html).toContain('3');
    });

    it('should handle 100% completion correctly', () => {
      const testData = {
        vendorName: 'Test Vendor',
        vendorEmail: 'vendor@test.com',
        collectionName: 'Test Collection',
        subscriberName: 'Test User',
        subscriberEmail: 'user@test.com',
        subscriberPhone: '+1234567890',
        currentSubscribers: 15,
        minSubscribers: 10,
        collectionUrl: 'https://example.com/test'
      };

      // Access private method for testing
      const template = (service as any).generateVendorNotificationTemplate(testData);

      // Should show target reached message
      expect(template.html).toContain('Target Reached');
      expect(template.html).toContain('100%');
    });
  });
});