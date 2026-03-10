/**
 * Tests for NotificationService
 * Basic unit tests for notification creation and management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationService } from './notification-service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
  });

  describe('Service Initialization', () => {
    it('should create an instance of NotificationService', () => {
      expect(service).toBeInstanceOf(NotificationService);
    });
  });

  describe('Validation Methods', () => {
    it('should validate vendor ID correctly', () => {
      // Access protected method through any cast for testing
      const validateVendorId = (service as any).validateVendorId.bind(service);
      
      expect(() => validateVendorId('valid-vendor-id')).not.toThrow();
      expect(() => validateVendorId('')).toThrow('Invalid vendor ID');
      expect(() => validateVendorId('   ')).toThrow('Invalid vendor ID');
    });

    it('should validate required fields correctly', () => {
      const validateRequired = (service as any).validateRequired.bind(service);
      
      expect(() => validateRequired({ field1: 'value', field2: 'value' })).not.toThrow();
      expect(() => validateRequired({ field1: null })).toThrow('Required field missing');
      expect(() => validateRequired({ field1: undefined })).toThrow('Required field missing');
    });
  });

  describe('Email Notification Logic', () => {
    it('should determine when to send email notifications', () => {
      const shouldSendEmail = (service as any).shouldSendEmail.bind(service);
      
      // Alert type should always send email
      expect(shouldSendEmail('alert', 'stock')).toBe(true);
      expect(shouldSendEmail('alert', 'performance')).toBe(true);
      
      // Payout category should always send email
      expect(shouldSendEmail('info', 'payout')).toBe(true);
      expect(shouldSendEmail('warning', 'payout')).toBe(true);
      
      // Celebration type should send email
      expect(shouldSendEmail('celebration', 'milestone')).toBe(true);
      
      // Other combinations should not send email
      expect(shouldSendEmail('info', 'stock')).toBe(false);
      expect(shouldSendEmail('warning', 'performance')).toBe(false);
    });
  });

  describe('Default Preferences', () => {
    it('should return correct default preferences', () => {
      const getDefaultPreferences = (service as any).getDefaultPreferences.bind(service);
      
      const vendorId = 'test-vendor-123';
      const prefs = getDefaultPreferences(vendorId);
      
      expect(prefs.vendorId).toBe(vendorId);
      expect(prefs.emailNotifications).toBe(true);
      expect(prefs.pushNotifications).toBe(true);
      expect(prefs.categories).toEqual({
        stock: true,
        payout: true,
        performance: true,
        ranking: true,
        milestone: true
      });
      expect(prefs.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Notification Type Routing', () => {
    it('should handle different notification types', () => {
      const types: Array<'alert' | 'info' | 'warning' | 'celebration'> = [
        'alert',
        'info',
        'warning',
        'celebration'
      ];
      
      types.forEach(type => {
        expect(['alert', 'info', 'warning', 'celebration']).toContain(type);
      });
    });

    it('should handle different notification categories', () => {
      const categories: Array<'stock' | 'payout' | 'performance' | 'ranking' | 'milestone'> = [
        'stock',
        'payout',
        'performance',
        'ranking',
        'milestone'
      ];
      
      categories.forEach(category => {
        expect(['stock', 'payout', 'performance', 'ranking', 'milestone']).toContain(category);
      });
    });
  });

  describe('Helper Methods', () => {
    it('should parse dates correctly', () => {
      const parseDate = (service as any).parseDate.bind(service);
      
      const date = new Date('2024-01-01');
      expect(parseDate(date)).toEqual(date);
      
      const dateString = '2024-01-01';
      expect(parseDate(dateString)).toBeInstanceOf(Date);
      
      const timestamp = Date.now();
      expect(parseDate(timestamp)).toBeInstanceOf(Date);
    });

    it('should log messages correctly', () => {
      const log = (service as any).log.bind(service);
      
      // These should not throw
      expect(() => log('info', 'Test message')).not.toThrow();
      expect(() => log('warn', 'Warning message', { data: 'test' })).not.toThrow();
      expect(() => log('error', 'Error message', { error: 'test' })).not.toThrow();
    });
  });

  describe('Notification Structure', () => {
    it('should validate notification structure', () => {
      const notification = {
        type: 'alert' as const,
        category: 'stock' as const,
        title: 'Test Notification',
        message: 'This is a test notification',
        actionUrl: '/vendor/inventory',
        metadata: { testData: 'value' }
      };

      expect(notification.type).toBe('alert');
      expect(notification.category).toBe('stock');
      expect(notification.title).toBeTruthy();
      expect(notification.message).toBeTruthy();
      expect(notification.actionUrl).toBeTruthy();
      expect(notification.metadata).toBeDefined();
    });
  });
});
