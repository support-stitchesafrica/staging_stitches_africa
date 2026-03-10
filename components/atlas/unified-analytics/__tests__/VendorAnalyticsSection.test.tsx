import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VendorAnalyticsSection } from '../VendorAnalyticsSection';
import { AtlasRole } from '@/lib/atlas/types';
import { DateRange } from '@/lib/atlas/unified-analytics/types';

// Mock the service
vi.mock('@/lib/atlas/unified-analytics/services/vendor-analytics-service', () => ({
  VendorAnalyticsService: vi.fn().mockImplementation(() => ({
    getVendorAnalytics: vi.fn().mockResolvedValue({
      totalVendors: 10,
      totalVisits: 1000,
      topVendors: [],
      trendingVendors: [],
      conversionRates: [],
      revenueMetrics: [],
      visitsBySource: {
        direct: 500,
        search: 300,
        social: 200,
        referral: 0,
        other: 0
      }
    }),
    exportToCSV: vi.fn().mockResolvedValue({
      blob: new Blob(['test'], { type: 'text/csv' }),
      filename: 'test.csv'
    }),
    getExportSummary: vi.fn().mockResolvedValue({
      totalRecords: 10,
      dataQuality: 'high' as const,
      estimatedSize: '1 KB'
    })
  }))
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

describe('VendorAnalyticsSection', () => {
  const mockDateRange: DateRange = {
    from: new Date('2024-01-01'),
    to: new Date('2024-01-31')
  };

  it('should render without hooks error for authorized user', async () => {
    render(
      <VendorAnalyticsSection 
        dateRange={mockDateRange} 
        userRole="founder" 
      />
    );

    // Should show loading initially
    expect(screen.getByText('Loading vendor analytics...')).toBeInTheDocument();
  });

  it('should show access denied for unauthorized user', () => {
    // Create a mock role that doesn't have access (we'll use a fake role)
    render(
      <VendorAnalyticsSection 
        dateRange={mockDateRange} 
        userRole={'unauthorized' as AtlasRole}
      />
    );

    expect(screen.getByText(/You don't have permission to access vendor analytics/)).toBeInTheDocument();
  });

  it('should render all authorized roles without error', () => {
    const authorizedRoles: AtlasRole[] = ['superadmin', 'founder', 'sales_lead', 'brand_lead', 'logistics_lead'];
    
    authorizedRoles.forEach(role => {
      const { unmount } = render(
        <VendorAnalyticsSection 
          dateRange={mockDateRange} 
          userRole={role}
        />
      );
      
      // Should not throw hooks error
      expect(screen.getByText('Loading vendor analytics...')).toBeInTheDocument();
      unmount();
    });
  });
});