/**
 * Product Analytics API Tests
 * Tests for the activity-based product insights API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock Firebase
vi.mock('@/lib/firebase-client', () => ({
  db: {}
}));

// Mock analytics processor
vi.mock('@/lib/analytics/analytics-processor', () => ({
  analyticsProcessor: {
    getProductAnalyticsSummary: vi.fn()
  }
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date) => ({ toDate: () => date }))
  }
}));

describe('Product Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if productId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/vendor/product-analytics', {
      method: 'POST',
      body: JSON.stringify({
        vendorId: 'vendor123'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Product ID and Vendor ID are required');
  });

  it('should return 400 if vendorId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/vendor/product-analytics', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product123'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Product ID and Vendor ID are required');
  });

  it('should use default date range if not provided', async () => {
    const { analyticsProcessor } = await import('@/lib/analytics/analytics-processor');
    const { getDocs } = await import('firebase/firestore');

    // Mock empty product doc
    vi.mocked(getDocs).mockResolvedValueOnce({
      empty: false,
      docs: [{
        data: () => ({
          product_id: 'product123',
          title: 'Test Product',
          category: 'Test Category',
          rating: 4.5,
          stock: 10
        })
      }]
    } as any);

    // Mock activity summary
    vi.mocked(analyticsProcessor.getProductAnalyticsSummary).mockResolvedValueOnce({
      vendorId: 'vendor123',
      productId: 'product123',
      dateRange: { start: new Date(), end: new Date() },
      totalViews: 100,
      uniqueViews: 80,
      addToCartCount: 20,
      removeFromCartCount: 2,
      addToCartRate: 20,
      purchaseCount: 10,
      conversionRate: 10,
      cartConversionRate: 50,
      totalRevenue: 500,
      averageOrderValue: 50
    });

    // Mock empty activity timeline
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: []
    } as any);

    // Mock empty peak times
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [],
      size: 0
    } as any);

    const request = new NextRequest('http://localhost:3000/api/vendor/product-analytics', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product123',
        vendorId: 'vendor123'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.productId).toBe('product123');
    expect(data.vendorId).toBe('vendor123');
    expect(data.views).toBe(100);
    expect(data.uniqueViews).toBe(80);
    expect(data.addToCartCount).toBe(20);
    expect(data.conversionRate).toBe(0.1); // 10% as decimal
  });

  it('should calculate metrics correctly from activity summary', async () => {
    const { analyticsProcessor } = await import('@/lib/analytics/analytics-processor');
    const { getDocs } = await import('firebase/firestore');

    // Mock product doc
    vi.mocked(getDocs).mockResolvedValueOnce({
      empty: false,
      docs: [{
        data: () => ({
          product_id: 'product123',
          title: 'Test Product',
          category: 'Test Category',
          rating: 4.5,
          stock: 10
        })
      }]
    } as any);

    // Mock activity summary with specific values
    vi.mocked(analyticsProcessor.getProductAnalyticsSummary).mockResolvedValueOnce({
      vendorId: 'vendor123',
      productId: 'product123',
      dateRange: { start: new Date(), end: new Date() },
      totalViews: 1000,
      uniqueViews: 800,
      addToCartCount: 150,
      removeFromCartCount: 10,
      addToCartRate: 15, // 15%
      purchaseCount: 50,
      conversionRate: 5, // 5%
      cartConversionRate: 33.33, // 33.33%
      totalRevenue: 2500,
      averageOrderValue: 50
    });

    // Mock empty timeline and peak times
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any);
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [], size: 0 } as any);

    const request = new NextRequest('http://localhost:3000/api/vendor/product-analytics', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product123',
        vendorId: 'vendor123'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify real view counts (Requirement 22.2)
    expect(data.views).toBe(1000);
    expect(data.uniqueViews).toBe(800);
    
    // Verify real add-to-cart rates (Requirement 22.2)
    expect(data.addToCartCount).toBe(150);
    expect(data.addToCartRate).toBe(0.15); // 15% as decimal
    
    // Verify real conversion rates (Requirement 22.3)
    expect(data.conversionRate).toBe(0.05); // 5% as decimal
    expect(data.cartConversionRate).toBe(0.3333); // 33.33% as decimal
    
    // Verify sales and revenue
    expect(data.salesCount).toBe(50);
    expect(data.revenue).toBe(2500);
    expect(data.averageOrderValue).toBe(50);
  });

  it('should include activity timeline in response', async () => {
    const { analyticsProcessor } = await import('@/lib/analytics/analytics-processor');
    const { getDocs } = await import('firebase/firestore');

    // Mock product doc
    vi.mocked(getDocs).mockResolvedValueOnce({
      empty: false,
      docs: [{
        data: () => ({
          product_id: 'product123',
          title: 'Test Product'
        })
      }]
    } as any);

    // Mock activity summary
    vi.mocked(analyticsProcessor.getProductAnalyticsSummary).mockResolvedValueOnce({
      vendorId: 'vendor123',
      productId: 'product123',
      dateRange: { start: new Date(), end: new Date() },
      totalViews: 100,
      uniqueViews: 80,
      addToCartCount: 20,
      removeFromCartCount: 2,
      addToCartRate: 20,
      purchaseCount: 10,
      conversionRate: 10,
      cartConversionRate: 50,
      totalRevenue: 500,
      averageOrderValue: 50
    });

    // Mock activity timeline with events
    const mockTimestamp = { toDate: () => new Date('2024-01-01T12:00:00Z') };
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [
        {
          id: 'activity1',
          data: () => ({
            type: 'view',
            userId: 'user123',
            timestamp: mockTimestamp,
            metadata: { deviceType: 'mobile' }
          })
        },
        {
          id: 'activity2',
          data: () => ({
            type: 'purchase',
            userId: 'user123',
            timestamp: mockTimestamp,
            metadata: { deviceType: 'desktop', price: 50, quantity: 1 }
          })
        }
      ]
    } as any);

    // Mock empty peak times
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [], size: 0 } as any);

    const request = new NextRequest('http://localhost:3000/api/vendor/product-analytics', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product123',
        vendorId: 'vendor123'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify activity timeline is included (Requirement 22.4)
    expect(data.activityTimeline).toBeDefined();
    expect(Array.isArray(data.activityTimeline)).toBe(true);
    expect(data.activityTimeline.length).toBe(2);
    expect(data.activityTimeline[0].type).toBe('view');
    expect(data.activityTimeline[1].type).toBe('purchase');
  });

  it('should include peak activity patterns in response', async () => {
    const { analyticsProcessor } = await import('@/lib/analytics/analytics-processor');
    const { getDocs } = await import('firebase/firestore');

    // Mock product doc
    vi.mocked(getDocs).mockResolvedValueOnce({
      empty: false,
      docs: [{
        data: () => ({
          product_id: 'product123',
          title: 'Test Product'
        })
      }]
    } as any);

    // Mock activity summary
    vi.mocked(analyticsProcessor.getProductAnalyticsSummary).mockResolvedValueOnce({
      vendorId: 'vendor123',
      productId: 'product123',
      dateRange: { start: new Date(), end: new Date() },
      totalViews: 100,
      uniqueViews: 80,
      addToCartCount: 20,
      removeFromCartCount: 2,
      addToCartRate: 20,
      purchaseCount: 10,
      conversionRate: 10,
      cartConversionRate: 50,
      totalRevenue: 500,
      averageOrderValue: 50
    });

    // Mock empty timeline
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any);

    // Mock peak times with activities
    const mockTimestamp = { toDate: () => new Date('2024-01-01T14:30:00Z') }; // 2:30 PM
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [
        {
          data: () => ({
            timestamp: mockTimestamp,
            metadata: { deviceType: 'mobile' }
          })
        },
        {
          data: () => ({
            timestamp: mockTimestamp,
            metadata: { deviceType: 'mobile' }
          })
        },
        {
          data: () => ({
            timestamp: mockTimestamp,
            metadata: { deviceType: 'desktop' }
          })
        }
      ],
      size: 3
    } as any);

    const request = new NextRequest('http://localhost:3000/api/vendor/product-analytics', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product123',
        vendorId: 'vendor123'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    // Verify peak activity patterns are included (Requirement 22.5)
    expect(data.peakActivityTimes).toBeDefined();
    expect(data.peakActivityTimes.peakHour).toBeDefined();
    expect(data.peakActivityTimes.peakDay).toBeDefined();
    expect(data.peakActivityTimes.topDevice).toBeDefined();
    expect(data.peakActivityTimes.hourlyDistribution).toBeDefined();
    expect(data.peakActivityTimes.dailyDistribution).toBeDefined();
    expect(data.peakActivityTimes.deviceDistribution).toBeDefined();
  });
});
