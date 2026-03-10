/**
 * Tests for Migration Service
 * Validates role mapping and migration logic
 */

import { describe, it, expect } from 'vitest';
import { MigrationService, LegacyRole } from './migration-service';
import { BackOfficeRole } from '@/types/backoffice';

describe('MigrationService', () => {
  describe('Role Mapping', () => {
    it('should map superadmin correctly', () => {
      expect(MigrationService.mapRole('superadmin')).toBe('superadmin');
    });

    it('should map founder correctly', () => {
      expect(MigrationService.mapRole('founder')).toBe('founder');
    });

    it('should map sales_lead to bdm', () => {
      expect(MigrationService.mapRole('sales_lead')).toBe('bdm');
    });

    it('should map brand_lead correctly', () => {
      expect(MigrationService.mapRole('brand_lead')).toBe('brand_lead');
    });

    it('should map logistics_lead correctly', () => {
      expect(MigrationService.mapRole('logistics_lead')).toBe('logistics_lead');
    });

    it('should map super_admin to superadmin', () => {
      expect(MigrationService.mapRole('super_admin')).toBe('superadmin');
    });

    it('should map team_lead to marketing_manager', () => {
      expect(MigrationService.mapRole('team_lead')).toBe('marketing_manager');
    });

    it('should map bdm correctly', () => {
      expect(MigrationService.mapRole('bdm')).toBe('bdm');
    });

    it('should map team_member to marketing_member', () => {
      expect(MigrationService.mapRole('team_member')).toBe('marketing_member');
    });

    it('should map admin correctly', () => {
      expect(MigrationService.mapRole('admin')).toBe('admin');
    });

    it('should map editor correctly', () => {
      expect(MigrationService.mapRole('editor')).toBe('editor');
    });

    it('should map viewer correctly', () => {
      expect(MigrationService.mapRole('viewer')).toBe('viewer');
    });
  });

  describe('Role Mapping Coverage', () => {
    const legacyRoles: LegacyRole[] = [
      'superadmin',
      'founder',
      'sales_lead',
      'brand_lead',
      'logistics_lead',
      'super_admin',
      'team_lead',
      'bdm',
      'team_member',
      'admin',
      'editor',
      'viewer',
    ];

    it('should have mapping for all legacy roles', () => {
      legacyRoles.forEach(role => {
        expect(() => MigrationService.mapRole(role)).not.toThrow();
      });
    });

    it('should map all legacy roles to valid unified roles', () => {
      const validUnifiedRoles: BackOfficeRole[] = [
        'superadmin',
        'founder',
        'bdm',
        'brand_lead',
        'logistics_lead',
        'marketing_manager',
        'marketing_member',
        'admin',
        'editor',
        'viewer',
      ];

      legacyRoles.forEach(legacyRole => {
        const unifiedRole = MigrationService.mapRole(legacyRole);
        expect(validUnifiedRoles).toContain(unifiedRole);
      });
    });
  });

  describe('Migration Report Generation', () => {
    it('should generate a valid migration report', () => {
      const mockSummary = {
        total: 10,
        migrated: 8,
        skipped: 1,
        failed: 1,
        results: [
          {
            success: true,
            uid: 'user1',
            email: 'user1@example.com',
            legacyRole: 'sales_lead' as LegacyRole,
            unifiedRole: 'bdm' as BackOfficeRole,
          },
          {
            success: true,
            uid: 'user2',
            email: 'user2@example.com',
            legacyRole: 'team_lead' as LegacyRole,
            unifiedRole: 'marketing_manager' as BackOfficeRole,
          },
          {
            success: true,
            uid: 'user3',
            email: 'user3@example.com',
            legacyRole: 'admin' as LegacyRole,
            unifiedRole: 'admin' as BackOfficeRole,
            skipped: true,
            reason: 'User already migrated',
          },
          {
            success: false,
            uid: 'user4',
            email: 'user4@example.com',
            legacyRole: 'editor' as LegacyRole,
            error: 'Firebase Auth user not found',
          },
        ],
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: new Date('2024-01-01T00:01:00Z'),
        duration: 60000,
      };

      const report = MigrationService.generateMigrationReport(mockSummary);

      expect(report).toContain('MIGRATION REPORT');
      expect(report).toContain('Total Users: 10');
      expect(report).toContain('Successfully Migrated: 8');
      expect(report).toContain('Skipped (Already Migrated): 1');
      expect(report).toContain('Failed: 1');
      expect(report).toContain('user1@example.com');
      expect(report).toContain('sales_lead → bdm');
      expect(report).toContain('team_lead → marketing_manager');
    });
  });

  describe('Role Mapping Validation', () => {
    it('should correctly merge sales_lead into bdm', () => {
      const result = MigrationService.mapRole('sales_lead');
      expect(result).toBe('bdm');
    });

    it('should correctly rename team_lead to marketing_manager', () => {
      const result = MigrationService.mapRole('team_lead');
      expect(result).toBe('marketing_manager');
    });

    it('should correctly rename team_member to marketing_member', () => {
      const result = MigrationService.mapRole('team_member');
      expect(result).toBe('marketing_member');
    });

    it('should correctly map marketing super_admin to superadmin', () => {
      const result = MigrationService.mapRole('super_admin');
      expect(result).toBe('superadmin');
    });
  });
});
