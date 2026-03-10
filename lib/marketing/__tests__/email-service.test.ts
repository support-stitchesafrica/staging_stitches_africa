/**
 * Marketing Email Service Tests
 * Tests for email template generation and service methods
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketingEmailService } from '../email-service';

// Mock fetch globally
global.fetch = vi.fn();

describe('MarketingEmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendInvitationEmail', () => {
    it('should send invitation email with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        text: async () => JSON.stringify({ success: true }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await MarketingEmailService.sendInvitationEmail(
        'test@example.com',
        'John Doe',
        'team_member',
        'https://example.com/invite?token=abc123',
        'Jane Admin'
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://stitchesafricamobile-backend.onrender.com/api/Email/Send',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle email sending failure', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: async () => 'Server error',
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await MarketingEmailService.sendInvitationEmail(
        'test@example.com',
        'John Doe',
        'team_member',
        'https://example.com/invite?token=abc123',
        'Jane Admin'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('sendVendorAssignmentEmail', () => {
    it('should send assignment email with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        text: async () => JSON.stringify({ success: true }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await MarketingEmailService.sendVendorAssignmentEmail(
        'member@example.com',
        'Team Member',
        'Vendor ABC',
        'vendor123',
        'Manager Name'
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('sendVendorReassignmentEmail', () => {
    it('should send reassignment email with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        text: async () => JSON.stringify({ success: true }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await MarketingEmailService.sendVendorReassignmentEmail(
        'newmember@example.com',
        'New Member',
        'Vendor XYZ',
        'vendor456',
        'Manager Name',
        'Old Member'
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('sendUnassignmentEmail', () => {
    it('should send unassignment email with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        text: async () => JSON.stringify({ success: true }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await MarketingEmailService.sendUnassignmentEmail(
        'member@example.com',
        'Team Member',
        'Vendor ABC',
        'vendor123',
        'Manager Name',
        'Vendor no longer active'
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should send unassignment email without reason', async () => {
      const mockResponse = {
        ok: true,
        text: async () => JSON.stringify({ success: true }),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await MarketingEmailService.sendUnassignmentEmail(
        'member@example.com',
        'Team Member',
        'Vendor ABC',
        'vendor123',
        'Manager Name'
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('retry logic', () => {
    it('should retry on server errors', async () => {
      const mockFailResponse = {
        ok: false,
        status: 500,
        text: async () => 'Server error',
      };
      const mockSuccessResponse = {
        ok: true,
        text: async () => JSON.stringify({ success: true }),
      };

      (global.fetch as any)
        .mockResolvedValueOnce(mockFailResponse)
        .mockResolvedValueOnce(mockFailResponse)
        .mockResolvedValueOnce(mockSuccessResponse);

      const result = await MarketingEmailService.sendInvitationEmail(
        'test@example.com',
        'John Doe',
        'team_member',
        'https://example.com/invite?token=abc123',
        'Jane Admin'
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on client errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await MarketingEmailService.sendInvitationEmail(
        'test@example.com',
        'John Doe',
        'team_member',
        'https://example.com/invite?token=abc123',
        'Jane Admin'
      );

      expect(result.success).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
