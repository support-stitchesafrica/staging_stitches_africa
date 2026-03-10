import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VendorAnalyticsService } from '../vendor-analytics-service';
import { AtlasRole } from '@/lib/atlas/types';
import { DateRange } from '../../types';

// Mock Firebase
vi.mock('@/firebase', () => ({
  db: {}
}));

// Mock base vendor analytics service
vi.mock('@/lib/vendor/analytics-service', () => ({
  VendorAnalyticsService: vi.fn().mockImplementation(() => ({
    getVendorAnalytics: vi.fn().mockResolvedValue({
      success: true,
      data: {
        store: { profileVisits: 100 },
        orders: { totalOrders: 5 },
        sales: { totalRevenue: 1000 }
      }
    })
  }))
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ size: 10, docs: [] }),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date) => date)
  },
  onSnapshot: vi.fn().mockReturnValue(() => {}),
}));

describe('VendorAnalyticsService', () => {
  let service: VendorAnalyticsService;
  let dateRange: DateRange;

  beforeEach(() => {
    service = new VendorAnalyticsService();
    dateRange = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31')
    };
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('getVendorAnalytics', () => {
    it('should return vendor analytics data for authorized roles', async () => {
      const result = await service.getVendorAnalytics(dateRange, 'founder');
      
      expect(result).toBeDefined();
      expect(result.totalVendors).toBeGreaterThanOrEqual(0);
      expect(result.totalVisits).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.topVendors)).toBe(true);
      expect(Array.isArray(result.trendingVendors)).toBe(true);
    });

    it('should work for all authorized roles', async () => {
      const roles: AtlasRole[] = ['superadmin', 'founder', 'sales_lead', 'brand_lead', 'logistics_lead'];
      
      for (const role of roles) {
        const result = await service.getVendorAnalytics(dateRange, role);
        expect(result).toBeDefined();
        expect(result.totalVendors).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('exportToCSV', () => {
    it('should export data to CSV for authorized roles', async () => {
      const result = await service.exportToCSV(dateRange, 'founder');
      
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.filename).toContain('vendor-analytics');
      expect(result.filename).toContain('.csv');
    });

    it('should throw error for unauthorized export roles', async () => {
      await expect(
        service.exportToCSV(dateRange, 'brand_lead')
      ).rejects.toThrow('Insufficient permissions to export');
    });
  });

  describe('getExportSummary', () => {
    it('should return export summary for authorized roles', async () => {
      const result = await service.getExportSummary(dateRange, 'founder');
      
      expect(result.totalRecords).toBeGreaterThanOrEqual(0);
      expect(['high', 'medium', 'low']).toContain(result.dataQuality);
      expect(result.estimatedSize).toMatch(/\d+\s*(KB|MB)/);
    });
  });
});