/**
 * Mock analytics data for testing the storefront analytics dashboard
 * This would be replaced with real Firebase data in production
 */

import type { StorefrontAnalyticsData } from './analytics-service';

export const generateMockAnalyticsData = (days: number = 30): StorefrontAnalyticsData => {
  // Generate daily stats for the past N days
  const dailyStats = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Generate realistic random data with some trends
    const basePageViews = Math.floor(Math.random() * 100) + 50;
    const baseProductViews = Math.floor(basePageViews * (0.6 + Math.random() * 0.3)); // 60-90% of page views
    const baseCartAdds = Math.floor(baseProductViews * (0.1 + Math.random() * 0.2)); // 10-30% of product views
    
    dailyStats.push({
      date: date.toISOString().split('T')[0],
      pageViews: basePageViews,
      productViews: baseProductViews,
      cartAdds: baseCartAdds
    });
  }

  // Calculate totals
  const pageViews = dailyStats.reduce((sum, day) => sum + day.pageViews, 0);
  const productViews = dailyStats.reduce((sum, day) => sum + day.productViews, 0);
  const cartAdds = dailyStats.reduce((sum, day) => sum + day.cartAdds, 0);
  
  // Generate unique visitors (roughly 70% of page views)
  const uniqueVisitors = Math.floor(pageViews * 0.7);
  
  // Calculate conversion rate
  const conversionRate = productViews > 0 ? (cartAdds / productViews) * 100 : 0;

  // Generate top products
  const topProducts = [
    {
      productId: 'prod-1',
      productName: 'Elegant Evening Dress',
      views: Math.floor(productViews * 0.25),
      cartAdds: Math.floor(cartAdds * 0.3),
      conversionRate: 0
    },
    {
      productId: 'prod-2', 
      productName: 'Casual Summer Outfit',
      views: Math.floor(productViews * 0.2),
      cartAdds: Math.floor(cartAdds * 0.25),
      conversionRate: 0
    },
    {
      productId: 'prod-3',
      productName: 'Professional Business Suit',
      views: Math.floor(productViews * 0.15),
      cartAdds: Math.floor(cartAdds * 0.2),
      conversionRate: 0
    },
    {
      productId: 'prod-4',
      productName: 'Traditional Ankara Dress',
      views: Math.floor(productViews * 0.12),
      cartAdds: Math.floor(cartAdds * 0.15),
      conversionRate: 0
    },
    {
      productId: 'prod-5',
      productName: 'Modern Casual Wear',
      views: Math.floor(productViews * 0.1),
      cartAdds: Math.floor(cartAdds * 0.1),
      conversionRate: 0
    }
  ];

  // Calculate conversion rates for products
  topProducts.forEach(product => {
    product.conversionRate = product.views > 0 ? (product.cartAdds / product.views) * 100 : 0;
  });

  // Generate session data
  const sessionData = {
    averageSessionDuration: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
    bounceRate: Math.random() * 40 + 30, // 30-70%
    pagesPerSession: Math.random() * 3 + 1.5 // 1.5-4.5 pages
  };

  return {
    pageViews,
    productViews,
    cartAdds,
    uniqueVisitors,
    conversionRate: Math.round(conversionRate * 100) / 100,
    topProducts,
    dailyStats,
    sessionData: {
      averageSessionDuration: sessionData.averageSessionDuration,
      bounceRate: Math.round(sessionData.bounceRate * 100) / 100,
      pagesPerSession: Math.round(sessionData.pagesPerSession * 100) / 100
    }
  };
};

// Override the analytics service for demo purposes
export const mockStorefrontAnalyticsService = {
  async getAnalytics(storefrontId: string, dateRange: any): Promise<StorefrontAnalyticsData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    return generateMockAnalyticsData(Math.min(daysDiff, 90)); // Max 90 days
  },

  async exportAnalytics(storefrontId: string, dateRange: any, format: 'csv' | 'json' = 'csv'): Promise<string> {
    const data = await this.getAnalytics(storefrontId, dateRange);
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // Generate CSV
    const csvRows = [
      'Date,Page Views,Product Views,Cart Adds',
      ...data.dailyStats.map(stat => 
        `${stat.date},${stat.pageViews},${stat.productViews},${stat.cartAdds}`
      )
    ];

    return csvRows.join('\n');
  },

  async trackEvent(event: any): Promise<void> {
    // Mock tracking - in real app this would save to Firebase
    console.log('Tracking event:', event);
  }
};