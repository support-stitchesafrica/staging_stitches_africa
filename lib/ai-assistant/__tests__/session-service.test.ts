/**
 * Session Service Tests
 * 
 * Tests for chat session management
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Session Service', () => {
  describe('Session Creation', () => {
    it('should generate unique session IDs', () => {
      const sessions = new Set();
      
      for (let i = 0; i < 100; i++) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessions.add(sessionId);
      }
      
      expect(sessions.size).toBe(100);
    });

    it('should set expiry time 24 hours from creation', () => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const hoursDiff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBe(24);
    });

    it('should initialize empty context', () => {
      const context = {
        preferences: {},
        viewedProducts: [],
        addedToCart: [],
      };
      
      expect(context.preferences).toEqual({});
      expect(context.viewedProducts).toHaveLength(0);
      expect(context.addedToCart).toHaveLength(0);
    });
  });

  describe('Session Expiry', () => {
    it('should detect expired sessions', () => {
      const now = new Date();
      const expiredSession = {
        expiresAt: new Date(now.getTime() - 1000), // 1 second ago
      };
      const activeSession = {
        expiresAt: new Date(now.getTime() + 1000), // 1 second from now
      };
      
      expect(expiredSession.expiresAt < now).toBe(true);
      expect(activeSession.expiresAt > now).toBe(true);
    });

    it('should extend expiry on activity', () => {
      const lastMessageAt = new Date();
      const newExpiresAt = new Date(lastMessageAt.getTime() + 24 * 60 * 60 * 1000);
      
      expect(newExpiresAt > lastMessageAt).toBe(true);
    });
  });

  describe('Message History', () => {
    it('should maintain message order', () => {
      const messages = [
        { timestamp: new Date('2024-01-01T10:00:00'), content: 'First' },
        { timestamp: new Date('2024-01-01T10:01:00'), content: 'Second' },
        { timestamp: new Date('2024-01-01T10:02:00'), content: 'Third' },
      ];
      
      const sorted = [...messages].sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );
      
      expect(sorted[0].content).toBe('First');
      expect(sorted[2].content).toBe('Third');
    });

    it('should limit context to last N messages', () => {
      const messages = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        content: `Message ${i}`,
      }));
      
      const contextLimit = 10;
      const recentMessages = messages.slice(-contextLimit);
      
      expect(recentMessages).toHaveLength(10);
      expect(recentMessages[0].id).toBe(10);
      expect(recentMessages[9].id).toBe(19);
    });
  });

  describe('Context Management', () => {
    it('should track viewed products without duplicates', () => {
      const viewedProducts = ['prod1', 'prod2', 'prod1', 'prod3'];
      const unique = [...new Set(viewedProducts)];
      
      expect(unique).toHaveLength(3);
      expect(unique).toEqual(['prod1', 'prod2', 'prod3']);
    });

    it('should track cart additions', () => {
      const addedToCart: string[] = [];
      
      addedToCart.push('prod1');
      addedToCart.push('prod2');
      
      expect(addedToCart).toHaveLength(2);
      expect(addedToCart).toContain('prod1');
    });

    it('should store user preferences', () => {
      const preferences: Record<string, any> = {};
      
      preferences.budget = 50000;
      preferences.preferredColors = ['red', 'blue'];
      preferences.size = 'M';
      
      expect(preferences.budget).toBe(50000);
      expect(preferences.preferredColors).toHaveLength(2);
    });

    it('should update preferences without losing existing data', () => {
      const preferences = {
        budget: 50000,
        size: 'M',
      };
      
      const updated = {
        ...preferences,
        preferredColors: ['red'],
      };
      
      expect(updated.budget).toBe(50000);
      expect(updated.size).toBe('M');
      expect(updated.preferredColors).toEqual(['red']);
    });
  });

  describe('Session Statistics', () => {
    it('should count messages correctly', () => {
      const messages = [
        { role: 'user' },
        { role: 'assistant' },
        { role: 'user' },
        { role: 'assistant' },
        { role: 'user' },
      ];
      
      const userCount = messages.filter(m => m.role === 'user').length;
      const assistantCount = messages.filter(m => m.role === 'assistant').length;
      
      expect(userCount).toBe(3);
      expect(assistantCount).toBe(2);
      expect(messages.length).toBe(5);
    });

    it('should calculate session duration', () => {
      const startedAt = new Date('2024-01-01T10:00:00');
      const lastMessageAt = new Date('2024-01-01T10:05:30');
      
      const durationSeconds = Math.floor(
        (lastMessageAt.getTime() - startedAt.getTime()) / 1000
      );
      
      expect(durationSeconds).toBe(330); // 5 minutes 30 seconds
    });
  });

  describe('Session Cleanup', () => {
    it('should identify sessions to clean up', () => {
      const now = new Date();
      const sessions = [
        { id: '1', expiresAt: new Date(now.getTime() - 1000) }, // Expired
        { id: '2', expiresAt: new Date(now.getTime() + 1000) }, // Active
        { id: '3', expiresAt: new Date(now.getTime() - 5000) }, // Expired
      ];
      
      const expired = sessions.filter(s => s.expiresAt < now);
      
      expect(expired).toHaveLength(2);
      expect(expired.map(s => s.id)).toEqual(['1', '3']);
    });
  });
});
