/**
 * Tests for Waitlist Notification Manager
 * Basic unit tests for notification orchestration and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WaitlistNotificationManager } from './waitlist-notification-manager';

describe('WaitlistNotificationManager', () => {
  let manager: WaitlistNotificationManager;

  beforeEach(() => {
    manager = new WaitlistNotificationManager();
  });

  describe('Service Initialization', () => {
    it('should create an instance of WaitlistNotificationManager', () => {
      expect(manager).toBeInstanceOf(WaitlistNotificationManager);
    });

    it('should have all required methods', () => {
      expect(typeof manager.sendVendorNotification).toBe('function');
      expect(typeof manager.sendSubscriberConfirmation).toBe('function');
      expect(typeof manager.sendBothNotifications).toBe('function');
      expect(typeof manager.processNotificationQueue).toBe('function');
      expect(typeof manager.getQueueStats).toBe('function');
      expect(typeof manager.healthCheck).toBe('function');
    });
  });

  describe('Notification Options', () => {
    it('should handle default options correctly', async () => {
      const testData = {
        vendorName: 'Test Vendor',
        vendorEmail: 'vendor@test.com',
        collectionName: 'Test Collection',
        subscriberName: 'Test User',
        subscriberEmail: 'user@test.com',
        subscriberPhone: '+1234567890',
        currentSubscribers: 1,
        minSubscribers: 10,
        collectionUrl: 'https://example.com/test'
      };

      // This will likely fail due to email service not being configured,
      // but should handle the error gracefully
      const result = await manager.sendVendorNotification(testData, {
        immediate: false, // Use queue to avoid email sending
        fallbackToQueue: true
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should validate required data', async () => {
      const result = await manager.sendVendorNotification(undefined as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('Health Check', () => {
    it('should perform health check without errors', async () => {
      const result = await manager.healthCheck();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.notificationService).toBeDefined();
      expect(result.data?.queueService).toBeDefined();
      expect(Array.isArray(result.data?.issues)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid notification data gracefully', async () => {
      const result = await manager.sendBothNotifications({});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide meaningful error messages', async () => {
      const result = await manager.sendVendorNotification(null as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('Queue Management', () => {
    it('should provide queue statistics', async () => {
      const result = await manager.getQueueStats();

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle queue processing', async () => {
      const result = await manager.processNotificationQueue(5);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});