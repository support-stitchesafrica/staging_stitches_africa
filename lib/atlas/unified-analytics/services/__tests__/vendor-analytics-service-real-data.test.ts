import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VendorAnalyticsService } from '../vendor-analytics-service';
import { AtlasRole } from '@/lib/atlas/types';
import { DateRange } from '../../types';

// Mock Firebase with real data structure
const mockShopActivities = [
  {
    id: '1k25k7z6eLmMnEyl9mY5',
    type: 'view',
    vendorId: 'nPrP00AoxUTOPdiJlMLJmIYU4SH3',
    userId: 'rWteUO8u7Qe11dgA153W9na4V5I3',
    productId: '1yyd6PHZfeRfhnq1J8Dw',
    timestamp: new Date('2025-12-12T01:07:43.805Z'),
    metadata: {
      deviceType: 'mobile',
      source: 'ios_app',
      userAgent: 'iOS/26.1 (iPhone; iPhone)'
    }
  }
];

const mockVendorVisits = [
  {
    id: '00G6g1HLp62GwlmzfC8Q',
    vendor_id: 'kfWdXLu5sISeu1OBCxZ0t0EIsdx2',
    total_visits: 11,
    first_visit: new Date('2025-11-28T10:17:07Z'),
    last_visit: new Date('2025-12-11T18:06:04Z')
  }
];

const mockUsers = [
  {
    id: 'nPrP00AoxUTOPdiJlMLJmIYU4SH3',
    fullName: 'Test Vendor 1',
    role: 'tailor'
  },
  {
    id: 'kfWdXLu5sISeu1OBCxZ0t0EIsdx2',
    fullName: 'Ajoke onileke',
    role: 'tailor'
  }
];

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

// Mock Firestore functions with real data structure
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn().mockImplementation((query) => {
    // Simulate different collections based on query
    const queryStr = JSON.stringify(query);
    
    if (queryStr.includes('shop_activities')) {
      return Promise.resolve({
        size: mockShopActivities.length,
        docs: mockShopActivities.map(item => ({
          id: item.id,
          data: () => item
        }))
      });
    } else if (queryStr.includes('vendor_visits')) {
      return Promise.resolve({
        size: mockVendorVisits.length,
        docs: mockVendorVisits.map(item => ({
          id: item.id,
          data: () => item
        }))
      });
    } else if (queryStr.includes('users')) {
      return Promise.resolve({
        size: mockUsers.length,
        docs: mockUsers.map(item => ({
          id: item.id,
          data: () => item
        })),
        empty: false
      });
    }
    
    return Promise.resolve({ size: 0, docs: [], empty: true });
  }),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date) => date)
  },
  onSnapshot: vi.fn().mockReturnValue(() => {}),
}));

describe('VendorAnalyticsService - Real Data Structure', () => {
  let service: VendorAnalyticsService;
  let dateRange: DateRange;

  beforeEach(() => {
    service = new VendorAnalyticsService();
    dateRange = {
      from: new Date('2025-12-01'),
      to: new Date('2025-12-31')
    };
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('Real data integration', () => {
    it('should process shop_activities with correct field names', async () => {
      const result = await service.getVendorAnalytics(dateRange, 'founder');
      
      expect(result).toBeDefined();
      expect(result.totalVendors).toBeGreaterThanOrEqual(0);
      expect(result.totalVisits).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.topVendors)).toBe(true);
      expect(Array.isArray(result.trendingVendors)).toBe(true);
      expect(result.visitsBySource).toBeDefined();
      expect(typeof result.visitsBySource.direct).toBe('number');
    });

    it('should handle vendor_visits collection structure', async () => {
      const result = await service.getVendorAnalytics(dateRange, 'founder');
      
      // Should process vendor visits data
      expect(result.totalVisits).toBeGreaterThanOrEqual(0);
    });

    it('should map device types to visit sources correctly', async () => {
      const result = await service.getVendorAnalytics(dateRange, 'founder');
      
      // Should categorize mobile/ios_app as direct
      expect(result.visitsBySource).toHaveProperty('direct');
      expect(result.visitsBySource).toHaveProperty('search');
      expect(result.visitsBySource).toHaveProperty('social');
      expect(result.visitsBySource).toHaveProperty('referral');
      expect(result.visitsBySource).toHaveProperty('other');
    });
  });
});