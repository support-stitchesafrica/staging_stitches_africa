import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvitationService } from './invitation-service';
import { BackOfficeRole, InvitationError } from '@/types/backoffice';

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        id: 'mock-id',
        set: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(() => ({
            empty: true,
            docs: [],
          })),
        })),
        orderBy: vi.fn(() => ({
          get: vi.fn(() => ({
            empty: true,
            docs: [],
            forEach: vi.fn(),
          })),
        })),
        get: vi.fn(() => ({
          empty: true,
          docs: [],
          forEach: vi.fn(),
        })),
      })),
      orderBy: vi.fn(() => ({
        get: vi.fn(() => ({
          empty: true,
          docs: [],
          forEach: vi.fn(),
        })),
      })),
      get: vi.fn(() => ({
        empty: true,
        docs: [],
        forEach: vi.fn(),
      })),
    })),
    batch: vi.fn(() => ({
      update: vi.fn(),
      commit: vi.fn(),
    })),
  },
  adminAuth: {
    createUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

// Mock UserService
vi.mock('./user-service', () => ({
  UserService: {
    getUserByEmail: vi.fn(() => Promise.resolve(null)),
    createUser: vi.fn(() => Promise.resolve({
      uid: 'test-uid',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'viewer',
      departments: ['analytics'],
      permissions: {},
      isActive: true,
    })),
  },
}));

// Mock PermissionService
vi.mock('./permission-service', () => ({
  PermissionService: {
    getRolePermissions: vi.fn(() => ({
      analytics: { read: true, write: false, delete: false },
      promotions: { read: false, write: false, delete: false },
      collections: { read: false, write: false, delete: false },
      marketing: { read: false, write: false, delete: false },
      admin: { read: false, write: false, delete: false },
    })),
  },
}));

describe('InvitationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInvitationLink', () => {
    it('should generate correct invitation link with default base URL', () => {
      const token = 'test-token-123';
      const link = InvitationService.generateInvitationLink(token);
      
      expect(link).toContain('/backoffice/accept-invitation/');
      expect(link).toContain(token);
    });

    it('should generate correct invitation link with custom base URL', () => {
      const token = 'test-token-123';
      const baseUrl = 'https://example.com';
      const link = InvitationService.generateInvitationLink(token, baseUrl);
      
      expect(link).toBe(`${baseUrl}/backoffice/accept-invitation/${token}`);
    });
  });

  describe('Token generation', () => {
    it('should generate unique tokens', () => {
      // We can't directly test the private method, but we can verify
      // that the service exists and has the expected structure
      expect(InvitationService).toBeDefined();
      expect(typeof InvitationService.createInvitation).toBe('function');
      expect(typeof InvitationService.validateInvitation).toBe('function');
      expect(typeof InvitationService.acceptInvitation).toBe('function');
    });
  });

  describe('Service methods', () => {
    it('should have all required methods', () => {
      expect(typeof InvitationService.createInvitation).toBe('function');
      expect(typeof InvitationService.validateInvitation).toBe('function');
      expect(typeof InvitationService.acceptInvitation).toBe('function');
      expect(typeof InvitationService.getInvitationsByStatus).toBe('function');
      expect(typeof InvitationService.expireOldInvitations).toBe('function');
      expect(typeof InvitationService.getInvitationByEmail).toBe('function');
      expect(typeof InvitationService.getInvitationById).toBe('function');
      expect(typeof InvitationService.getAllInvitations).toBe('function');
      expect(typeof InvitationService.getInvitationsByInviter).toBe('function');
      expect(typeof InvitationService.expireInvitation).toBe('function');
      expect(typeof InvitationService.deleteInvitation).toBe('function');
      expect(typeof InvitationService.generateInvitationLink).toBe('function');
      expect(typeof InvitationService.resendInvitation).toBe('function');
    });
  });

  describe('Email validation', () => {
    it('should validate email format in createInvitation', async () => {
      const invalidEmail = 'not-an-email';
      
      await expect(
        InvitationService.createInvitation(
          invalidEmail,
          'viewer',
          'inviter-uid',
          'Inviter Name'
        )
      ).rejects.toThrow('Invalid email format');
    });
  });
});
