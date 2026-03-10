import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { HierarchicalAnalyticsService } from '../analytics-service';
import { HierarchicalExportService } from '../export-service';
import { 
  Activity, 
  Commission, 
  Influencer, 
  TimePeriod, 
  InfluencerMetrics,
  MiniInfluencerPerformance,
  AnalyticsReport,
  ReportCriteria
} from '../../../../types/hierarchical-referral';
import { Timestamp } from 'firebase-admin/firestore';

// Robust string generators that avoid Firestore path issues
const safeIdGenerator = fc.string({ minLength: 10, maxLength: 50 }).filter(s => 
  /^[a-zA-Z0-9_-]+$/.test(s) && 
  s.length >= 10 && 
  !s.startsWith('-') && 
  !s.endsWith('-') &&
  !s.includes('--')
);
const safeNameGenerator = fc.string({ minLength: 3, maxLength: 30 }).filter(s => 
  /^[a-zA-Z0-9\s_-]+$/.test(s) && 
  s.trim().length >= 3 &&
  !s.startsWith('-') &&
  !s.endsWith('-')
);
const safeCodeGenerator = fc.string({ minLength: 5, maxLength: 20 }).filter(s => 
  /^[a-zA-Z0-9_-]+$/.test(s) && 
  s.length >= 5 &&
  !s.startsWith('-') &&
  !s.endsWith('-')
);
const safeRequestorGenerator = fc.string({ minLength: 5, maxLength: 50 }).filter(s => 
  /^[a-zA-Z0-9_-]+$/.test(s) && 
  s.length >= 5 &&
  !s.startsWith('-') &&
  !s.endsWith('-')
);

// Mock Firebase Admin with comprehensive setup
vi.mock('../../../firebase-admin', () => {
  const mockCollection = vi.fn();
  const mockDoc = vi.fn();
  const mockWhere = vi.fn();
  const mockGet = vi.fn();
  
  // Create a chainable mock structure
  const createMockQuery = () => ({
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: mockGet
  });
  
  const createMockDocRef = () => ({
    get: mockGet,
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  });
  
  const createMockCollectionRef = () => ({
    doc: vi.fn(() => createMockDocRef()),
    where: vi.fn(() => createMockQuery()),
    orderBy: vi.fn(() => createMockQuery()),
    limit: vi.fn(() => createMockQuery()),
    get: mockGet,
    add: vi.fn()
  });
  
  mockCollection.mockImplementation((collectionName: string) => {
    return createMockCollectionRef();
  });
  
  return {
    adminDb: {
      collection: mockCollection
    }
  };
});

// Mock Timestamp
vi.mock('firebase-admin/firestore', () => ({
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date) => ({ toDate: () => date }))
  }
}));

describe('HierarchicalAnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 26: Analytics Metrics Calculation', () => {
    it('should display accurate conversion rates, click-through rates, and revenue trends for all analytics views', async () => {
      /**
       * Feature: hierarchical-referral-program, Property 26: Analytics Metrics Calculation
       * Validates: Requirements 7.1
       * 
       * For any analytics view, the system should display accurate conversion rates, 
       * click-through rates, and revenue trends
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate influencer ID (using safe generator)
          safeIdGenerator,
          // Generate time period
          fc.record({
            start: fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
            end: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            granularity: fc.constantFrom('day', 'week', 'month')
          }),
          // Generate activities data
          fc.array(
            fc.record({
              id: safeIdGenerator,
              influencerId: safeIdGenerator,
              type: fc.constantFrom('view', 'click', 'conversion', 'purchase'),
              referralCode: safeCodeGenerator,
              metadata: fc.record({
                amount: fc.option(fc.float({ min: 1, max: 1000 })),
                currency: fc.constantFrom('USD', 'EUR', 'GBP')
              }),
              timestamp: fc.constant(Timestamp.now()),
              processed: fc.boolean()
            }),
            { minLength: 10, maxLength: 100 }
          ),
          // Generate commissions data
          fc.array(
            fc.record({
              id: safeIdGenerator,
              activityId: safeIdGenerator,
              motherInfluencerId: safeIdGenerator,
              miniInfluencerId: fc.option(safeIdGenerator),
              amount: fc.float({ min: 1, max: 500 }),
              currency: fc.constantFrom('USD', 'EUR', 'GBP'),
              rate: fc.float({ min: 1, max: 20 }),
              type: fc.constantFrom('direct', 'indirect'),
              status: fc.constantFrom('pending', 'approved', 'paid'),
              createdAt: fc.constant(Timestamp.now())
            }),
            { minLength: 5, maxLength: 50 }
          ),
          async (influencerId: string, period: TimePeriod, activities: Activity[], commissions: Commission[]) => {
            // Get the mock functions
            const mockAdminDb = vi.mocked(require('../../../firebase-admin').adminDb);
            
            // Reset all mocks
            vi.clearAllMocks();
            
            // Mock the collection calls with proper chaining
            const mockCollectionRef = {
              doc: vi.fn(() => ({
                get: vi.fn(() => Promise.resolve({
                  exists: true,
                  data: () => ({
                    type: 'mother',
                    name: 'Test Influencer',
                    email: 'test@example.com',
                    totalEarnings: 1000,
                    status: 'active'
                  })
                }))
              })),
              where: vi.fn(() => ({
                where: vi.fn(() => ({
                  where: vi.fn(() => ({
                    get: vi.fn(() => Promise.resolve({
                      docs: activities.map(activity => ({
                        data: () => activity
                      }))
                    }))
                  }))
                }))
              }))
            };
            
            const mockCommissionCollectionRef = {
              where: vi.fn(() => ({
                where: vi.fn(() => ({
                  where: vi.fn(() => ({
                    get: vi.fn(() => Promise.resolve({
                      docs: commissions.map(commission => ({
                        data: () => commission
                      }))
                    }))
                  }))
                }))
              }))
            };
            
            // Setup collection mocks
            mockAdminDb.collection.mockImplementation((collectionName: string) => {
              if (collectionName === 'hierarchical_influencers') {
                return mockCollectionRef;
              } else if (collectionName === 'hierarchical_activities') {
                return mockCollectionRef;
              } else if (collectionName === 'hierarchical_commissions') {
                return mockCommissionCollectionRef;
              }
              return mockCollectionRef;
            });

            // Get influencer metrics
            const metrics = await HierarchicalAnalyticsService.getInfluencerMetrics(influencerId, period);

            // Verify conversion rate calculation accuracy
            const views = activities.filter(a => a.type === 'view').length;
            const clicks = activities.filter(a => a.type === 'click').length;
            const conversions = activities.filter(a => a.type === 'conversion' || a.type === 'purchase').length;

            const expectedCTR = views > 0 ? (clicks / views) * 100 : 0;
            const expectedConversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

            expect(metrics.clickThroughRate).toBe(parseFloat(expectedCTR.toFixed(2)));
            expect(metrics.conversionRate).toBe(parseFloat(expectedConversionRate.toFixed(2)));

            // Verify earnings calculation accuracy
            const directEarnings = commissions
              .filter(c => c.type === 'direct')
              .reduce((sum, c) => sum + c.amount, 0);
            const indirectEarnings = commissions
              .filter(c => c.type === 'indirect')
              .reduce((sum, c) => sum + c.amount, 0);

            expect(metrics.directEarnings).toBe(directEarnings);
            expect(metrics.indirectEarnings).toBe(indirectEarnings);
            expect(metrics.totalEarnings).toBe(directEarnings + indirectEarnings);

            // Verify activity count accuracy
            expect(metrics.totalActivities).toBe(activities.length);

            // Verify metrics are properly formatted (2 decimal places)
            expect(metrics.conversionRate.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
            expect(metrics.clickThroughRate.toString()).toMatch(/^\d+(\.\d{1,2})?$/);

            // Verify metrics are non-negative
            expect(metrics.conversionRate).toBeGreaterThanOrEqual(0);
            expect(metrics.clickThroughRate).toBeGreaterThanOrEqual(0);
            expect(metrics.totalEarnings).toBeGreaterThanOrEqual(0);
            expect(metrics.totalActivities).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should provide accurate revenue trend analysis over different time periods', async () => {
      /**
       * Feature: hierarchical-referral-program, Property 26: Analytics Metrics Calculation
       * Validates: Requirements 7.1
       * 
       * For any time period and granularity, the system should provide accurate 
       * revenue trend analysis with proper date segmentation
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate influencer ID (using safe generator)
          safeIdGenerator,
          // Generate time period with different granularities
          fc.record({
            start: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
            end: fc.date({ min: new Date('2024-06-02'), max: new Date('2024-12-31') }),
            granularity: fc.constantFrom('day', 'week', 'month')
          }),
          async (influencerId: string, period: TimePeriod) => {
            // Mock commissions and activities for trend analysis
            const mockAdminDb = vi.mocked(require('../../../firebase-admin').adminDb);
            
            // Mock multiple date range queries for trend analysis
            const mockCommissions = [
              { amount: 100, createdAt: Timestamp.fromDate(period.start) },
              { amount: 150, createdAt: Timestamp.fromDate(new Date(period.start.getTime() + 86400000)) },
              { amount: 200, createdAt: Timestamp.fromDate(new Date(period.start.getTime() + 172800000)) }
            ];

            const mockActivities = [
              { type: 'click', timestamp: Timestamp.fromDate(period.start) },
              { type: 'view', timestamp: Timestamp.fromDate(new Date(period.start.getTime() + 86400000)) },
              { type: 'conversion', timestamp: Timestamp.fromDate(new Date(period.start.getTime() + 172800000)) }
            ];

            // Mock sequential queries for each date range
            mockAdminDb.collection().where().where().where().get
              .mockResolvedValueOnce({
                docs: [{ data: () => mockCommissions[0] }]
              })
              .mockResolvedValueOnce({
                docs: [{ data: () => mockActivities[0] }],
                size: 1
              })
              .mockResolvedValueOnce({
                docs: [{ data: () => mockCommissions[1] }]
              })
              .mockResolvedValueOnce({
                docs: [{ data: () => mockActivities[1] }],
                size: 1
              });

            // Get revenue trend analysis
            const trends = await HierarchicalAnalyticsService.getRevenueTrendAnalysis(influencerId, period);

            // Verify trend data structure
            expect(Array.isArray(trends)).toBe(true);
            
            trends.forEach(trend => {
              // Verify each trend entry has required properties
              expect(trend).toHaveProperty('date');
              expect(trend).toHaveProperty('revenue');
              expect(trend).toHaveProperty('activities');

              // Verify data types
              expect(typeof trend.date).toBe('string');
              expect(typeof trend.revenue).toBe('number');
              expect(typeof trend.activities).toBe('number');

              // Verify non-negative values
              expect(trend.revenue).toBeGreaterThanOrEqual(0);
              expect(trend.activities).toBeGreaterThanOrEqual(0);

              // Verify revenue is properly formatted (2 decimal places)
              expect(trend.revenue.toString()).toMatch(/^\d+(\.\d{1,2})?$/);

              // Verify date format (ISO date string)
              expect(trend.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            });

            // Verify trends are ordered chronologically
            for (let i = 1; i < trends.length; i++) {
              expect(new Date(trends[i].date)).toBeInstanceOf(Date);
              expect(new Date(trends[i-1].date) <= new Date(trends[i].date)).toBe(true);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 27: Performance Ranking', () => {
    it('should rank Mini_Influencers based on accurate performance metrics for all performance comparison views', async () => {
      /**
       * Feature: hierarchical-referral-program, Property 27: Performance Ranking
       * Validates: Requirements 7.2
       * 
       * For any performance comparison view, the system should rank Mini_Influencers 
       * based on accurate performance metrics
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate mother influencer ID (using safe generator)
          safeIdGenerator,
          // Generate time period
          fc.record({
            start: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
            end: fc.date({ min: new Date('2024-06-02'), max: new Date('2024-12-31') }),
            granularity: fc.constantFrom('day', 'week', 'month')
          }),
          // Generate mini influencers with varying performance
          fc.array(
            fc.record({
              id: safeIdGenerator,
              name: safeNameGenerator,
              email: fc.emailAddress(),
              type: fc.constant('mini'),
              totalEarnings: fc.float({ min: 0, max: 5000 }),
              activities: fc.array(
                fc.record({
                  type: fc.constantFrom('view', 'click', 'conversion', 'purchase'),
                  timestamp: fc.constant(Timestamp.now())
                }),
                { minLength: 1, maxLength: 50 }
              ),
              commissions: fc.array(
                fc.record({
                  amount: fc.float({ min: 1, max: 200 }),
                  type: fc.constantFrom('direct', 'indirect')
                }),
                { minLength: 0, maxLength: 20 }
              )
            }),
            { minLength: 3, maxLength: 10 }
          ),
          async (motherInfluencerId: string, period: TimePeriod, miniInfluencers: any[]) => {
            // Mock mini influencers query
            const mockAdminDb = vi.mocked(require('../../../firebase-admin').adminDb);
            mockAdminDb.collection().where().get.mockResolvedValueOnce({
              docs: miniInfluencers.map(mini => ({
                id: mini.id,
                data: () => ({
                  id: mini.id,
                  name: mini.name,
                  email: mini.email,
                  type: mini.type,
                  totalEarnings: mini.totalEarnings
                })
              }))
            });

            // Mock activities and commissions for each mini influencer
            let queryCallCount = 0;
            miniInfluencers.forEach(mini => {
              // Mock activities query for this mini influencer
              mockAdminDb.collection().where().where().where().get
                .mockResolvedValueOnce({
                  docs: mini.activities.map((activity: any) => ({
                    data: () => activity
                  }))
                });

              // Mock commissions query for this mini influencer
              mockAdminDb.collection().where().where().where().get
                .mockResolvedValueOnce({
                  docs: mini.commissions.map((commission: any) => ({
                    data: () => commission
                  }))
                });
            });

            // Get performance ranking
            const ranking = await HierarchicalAnalyticsService.getPerformanceRanking(
              motherInfluencerId, 
              period, 
              miniInfluencers.length
            );

            // Verify ranking structure
            expect(Array.isArray(ranking)).toBe(true);
            expect(ranking.length).toBeLessThanOrEqual(miniInfluencers.length);

            ranking.forEach((performance, index) => {
              // Verify performance entry structure
              expect(performance).toHaveProperty('influencer');
              expect(performance).toHaveProperty('earnings');
              expect(performance).toHaveProperty('activities');
              expect(performance).toHaveProperty('conversionRate');
              expect(performance).toHaveProperty('rank');

              // Verify data types
              expect(typeof performance.earnings).toBe('number');
              expect(typeof performance.activities).toBe('number');
              expect(typeof performance.conversionRate).toBe('number');
              expect(typeof performance.rank).toBe('number');

              // Verify non-negative values
              expect(performance.earnings).toBeGreaterThanOrEqual(0);
              expect(performance.activities).toBeGreaterThanOrEqual(0);
              expect(performance.conversionRate).toBeGreaterThanOrEqual(0);
              expect(performance.rank).toBeGreaterThan(0);

              // Verify proper formatting
              expect(performance.earnings.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
              expect(performance.conversionRate.toString()).toMatch(/^\d+(\.\d{1,2})?$/);

              // Verify rank assignment
              expect(performance.rank).toBe(index + 1);

              // Verify influencer data
              expect(performance.influencer).toHaveProperty('id');
              expect(performance.influencer).toHaveProperty('name');
              expect(performance.influencer).toHaveProperty('email');
            });

            // Verify ranking order (should be sorted by weighted score)
            for (let i = 1; i < ranking.length; i++) {
              const current = ranking[i];
              const previous = ranking[i - 1];

              // Calculate weighted scores for verification
              const currentScore = (current.earnings * 0.5) + (current.activities * 0.3) + (current.conversionRate * 0.2);
              const previousScore = (previous.earnings * 0.5) + (previous.activities * 0.3) + (previous.conversionRate * 0.2);

              // Previous performer should have higher or equal score
              expect(previousScore).toBeGreaterThanOrEqual(currentScore);
            }

            // Verify conversion rate calculations
            ranking.forEach(performance => {
              const mini = miniInfluencers.find(m => m.id === performance.influencer.id);
              if (mini) {
                const views = mini.activities.filter((a: any) => a.type === 'view').length;
                const clicks = mini.activities.filter((a: any) => a.type === 'click').length;
                const conversions = mini.activities.filter((a: any) => a.type === 'conversion' || a.type === 'purchase').length;

                const expectedConversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
                expect(performance.conversionRate).toBe(parseFloat(expectedConversionRate.toFixed(2)));
              }
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle edge cases in performance ranking correctly', async () => {
      /**
       * Feature: hierarchical-referral-program, Property 27: Performance Ranking
       * Validates: Requirements 7.2
       * 
       * For any edge case scenario (zero activities, equal performance, etc.), 
       * the ranking system should handle it gracefully
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate mother influencer ID (using safe generator)
          safeIdGenerator,
          // Generate time period
          fc.record({
            start: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
            end: fc.date({ min: new Date('2024-06-02'), max: new Date('2024-12-31') }),
            granularity: fc.constantFrom('day', 'week', 'month')
          }),
          // Generate edge case scenarios
          fc.constantFrom(
            'no_mini_influencers',
            'zero_activities',
            'equal_performance',
            'no_conversions'
          ),
          async (motherInfluencerId: string, period: TimePeriod, edgeCase: string) => {
            const mockAdminDb = vi.mocked(require('../../../firebase-admin').adminDb);

            switch (edgeCase) {
              case 'no_mini_influencers':
                // Mock empty mini influencers query
                mockAdminDb.collection().where().get.mockResolvedValueOnce({
                  docs: [],
                  size: 0
                });
                break;

              case 'zero_activities':
                // Mock mini influencers with zero activities
                mockAdminDb.collection().where().get.mockResolvedValueOnce({
                  docs: [{
                    id: 'mini-1',
                    data: () => ({ id: 'mini-1', name: 'Mini 1', email: 'mini1@test.com', type: 'mini' })
                  }]
                });
                mockAdminDb.collection().where().where().where().get
                  .mockResolvedValueOnce({ docs: [] }) // No activities
                  .mockResolvedValueOnce({ docs: [] }); // No commissions
                break;

              case 'equal_performance':
                // Mock mini influencers with identical performance
                const identicalPerformance = {
                  activities: [{ type: 'click' }, { type: 'conversion' }],
                  commissions: [{ amount: 100, type: 'direct' }]
                };
                mockAdminDb.collection().where().get.mockResolvedValueOnce({
                  docs: [
                    { id: 'mini-1', data: () => ({ id: 'mini-1', name: 'Mini 1', email: 'mini1@test.com', type: 'mini' }) },
                    { id: 'mini-2', data: () => ({ id: 'mini-2', name: 'Mini 2', email: 'mini2@test.com', type: 'mini' }) }
                  ]
                });
                // Mock identical activities and commissions for both
                mockAdminDb.collection().where().where().where().get
                  .mockResolvedValueOnce({ docs: identicalPerformance.activities.map(a => ({ data: () => a })) })
                  .mockResolvedValueOnce({ docs: identicalPerformance.commissions.map(c => ({ data: () => c })) })
                  .mockResolvedValueOnce({ docs: identicalPerformance.activities.map(a => ({ data: () => a })) })
                  .mockResolvedValueOnce({ docs: identicalPerformance.commissions.map(c => ({ data: () => c })) });
                break;

              case 'no_conversions':
                // Mock mini influencers with activities but no conversions
                mockAdminDb.collection().where().get.mockResolvedValueOnce({
                  docs: [{
                    id: 'mini-1',
                    data: () => ({ id: 'mini-1', name: 'Mini 1', email: 'mini1@test.com', type: 'mini' })
                  }]
                });
                mockAdminDb.collection().where().where().where().get
                  .mockResolvedValueOnce({ 
                    docs: [
                      { data: () => ({ type: 'view' }) },
                      { data: () => ({ type: 'click' }) }
                    ]
                  })
                  .mockResolvedValueOnce({ docs: [] }); // No commissions
                break;
            }

            // Get performance ranking
            const ranking = await HierarchicalAnalyticsService.getPerformanceRanking(
              motherInfluencerId, 
              period, 
              10
            );

            // Verify edge case handling
            expect(Array.isArray(ranking)).toBe(true);

            switch (edgeCase) {
              case 'no_mini_influencers':
                expect(ranking).toHaveLength(0);
                break;

              case 'zero_activities':
                expect(ranking).toHaveLength(1);
                expect(ranking[0].activities).toBe(0);
                expect(ranking[0].earnings).toBe(0);
                expect(ranking[0].conversionRate).toBe(0);
                expect(ranking[0].rank).toBe(1);
                break;

              case 'equal_performance':
                expect(ranking).toHaveLength(2);
                // Both should have same performance metrics
                expect(ranking[0].earnings).toBe(ranking[1].earnings);
                expect(ranking[0].activities).toBe(ranking[1].activities);
                expect(ranking[0].conversionRate).toBe(ranking[1].conversionRate);
                // But should have different ranks
                expect(ranking[0].rank).toBe(1);
                expect(ranking[1].rank).toBe(2);
                break;

              case 'no_conversions':
                expect(ranking).toHaveLength(1);
                expect(ranking[0].conversionRate).toBe(0);
                expect(ranking[0].activities).toBeGreaterThan(0);
                expect(ranking[0].earnings).toBe(0);
                break;
            }

            // Verify all rankings maintain proper structure
            ranking.forEach(performance => {
              expect(performance).toHaveProperty('influencer');
              expect(performance).toHaveProperty('earnings');
              expect(performance).toHaveProperty('activities');
              expect(performance).toHaveProperty('conversionRate');
              expect(performance).toHaveProperty('rank');

              expect(performance.earnings).toBeGreaterThanOrEqual(0);
              expect(performance.activities).toBeGreaterThanOrEqual(0);
              expect(performance.conversionRate).toBeGreaterThanOrEqual(0);
              expect(performance.rank).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 25: Report Export Functionality', () => {
    it('should generate CSV files containing all required data in the correct format for all report export requests', async () => {
      /**
       * Feature: hierarchical-referral-program, Property 25: Report Export Functionality
       * Validates: Requirements 6.5
       * 
       * For any report export request, the system should generate CSV files 
       * containing all required data in the correct format
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate analytics report data
          fc.record({
            id: fc.string({ minLength: 10, maxLength: 50 }),
            type: fc.constantFrom('influencer', 'network', 'system'),
            period: fc.record({
              start: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
              end: fc.date({ min: new Date('2024-06-02'), max: new Date('2024-12-31') }),
              granularity: fc.constantFrom('day', 'week', 'month')
            }),
            data: fc.record({
              metrics: fc.record({
                totalEarnings: fc.float({ min: 0, max: 10000 }),
                directEarnings: fc.float({ min: 0, max: 5000 }),
                indirectEarnings: fc.float({ min: 0, max: 5000 }),
                totalActivities: fc.integer({ min: 0, max: 1000 }),
                conversionRate: fc.float({ min: 0, max: 100 }),
                clickThroughRate: fc.float({ min: 0, max: 100 }),
                activeMiniInfluencers: fc.integer({ min: 0, max: 50 }),
                totalMiniInfluencers: fc.integer({ min: 0, max: 100 })
              }),
              revenueTrends: fc.array(
                fc.record({
                  date: fc.integer({ min: 1, max: 365 }).map(days => {
                    const baseDate = new Date('2024-01-01');
                    baseDate.setDate(baseDate.getDate() + days);
                    return baseDate.toISOString().split('T')[0];
                  }),
                  revenue: fc.float({ min: 0, max: 1000 }),
                  activities: fc.integer({ min: 0, max: 100 })
                }),
                { minLength: 1, maxLength: 30 }
              ),
              subInfluencerPerformance: fc.array(
                fc.record({
                  rank: fc.integer({ min: 1, max: 100 }),
                  influencer: fc.record({
                    id: safeIdGenerator,
                    name: safeNameGenerator,
                    email: fc.emailAddress(),
                    type: fc.constant('mini')
                  }),
                  earnings: fc.float({ min: 0, max: 2000 }),
                  activities: fc.integer({ min: 0, max: 200 }),
                  conversionRate: fc.float({ min: 0, max: 100 })
                }),
                { minLength: 0, maxLength: 10 }
              )
            }),
            generatedAt: fc.constant(Timestamp.now()),
            requestedBy: safeRequestorGenerator
          }),
          async (reportData: AnalyticsReport) => {
            // Export report to CSV
            const csvContent = await HierarchicalExportService.exportAnalyticsReportToCSV(reportData);

            // Verify CSV content is not empty
            expect(csvContent).toBeDefined();
            expect(csvContent.length).toBeGreaterThan(0);

            // Verify CSV structure
            const lines = csvContent.split('\n');
            expect(lines.length).toBeGreaterThan(1);

            // Verify header information is present
            expect(csvContent).toContain('Analytics Report Export');
            expect(csvContent).toContain(`Report ID: ${reportData.id}`);
            expect(csvContent).toContain(`Report Type: ${reportData.type}`);

            // Verify CSV validation passes
            const validation = HierarchicalExportService.validateCSVContent(csvContent);
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);

            // Verify metrics data is included
            if (reportData.data.metrics) {
              expect(csvContent).toContain('Total Earnings');
              expect(csvContent).toContain(reportData.data.metrics.totalEarnings.toFixed(2));
              expect(csvContent).toContain('Direct Earnings');
              expect(csvContent).toContain(reportData.data.metrics.directEarnings.toFixed(2));
              expect(csvContent).toContain('Indirect Earnings');
              expect(csvContent).toContain(reportData.data.metrics.indirectEarnings.toFixed(2));
              expect(csvContent).toContain('Total Activities');
              expect(csvContent).toContain(reportData.data.metrics.totalActivities.toString());
            }

            // Verify revenue trends data is included
            if (reportData.data.revenueTrends && reportData.data.revenueTrends.length > 0) {
              expect(csvContent).toContain('Revenue Trends');
              expect(csvContent).toContain('Date,Revenue,Activities');
              
              // Check that at least one trend entry is present
              const firstTrend = reportData.data.revenueTrends[0];
              expect(csvContent).toContain(firstTrend.date);
              expect(csvContent).toContain(firstTrend.revenue.toFixed(2));
            }

            // Verify sub-influencer performance data is included
            if (reportData.data.subInfluencerPerformance && reportData.data.subInfluencerPerformance.length > 0) {
              expect(csvContent).toContain('Sub-Influencer Performance');
              expect(csvContent).toContain('Rank,Name,Email,Earnings,Activities,Conversion Rate');
              
              // Check that at least one performance entry is present
              const firstPerf = reportData.data.subInfluencerPerformance[0];
              expect(csvContent).toContain(firstPerf.rank.toString());
              expect(csvContent).toContain(firstPerf.influencer.email);
              expect(csvContent).toContain(firstPerf.earnings.toFixed(2));
            }

            // Verify proper CSV formatting
            const dataLines = lines.filter(line => line.includes(',') && line.trim().length > 0);
            expect(dataLines.length).toBeGreaterThan(0);

            // Verify no malformed data
            dataLines.forEach(line => {
              // Should not contain unescaped quotes in the middle of fields
              const fields = line.split(',');
              fields.forEach(field => {
                if (field.startsWith('"') && field.endsWith('"')) {
                  // Quoted field should have properly escaped internal quotes
                  const innerContent = field.slice(1, -1);
                  const unescapedQuotes = innerContent.match(/(?<!")["](?!")/g);
                  expect(unescapedQuotes).toBeNull();
                }
              });
            });

            // Verify currency formatting consistency
            const currencyMatches = csvContent.match(/\d+\.\d{2}/g);
            if (currencyMatches) {
              currencyMatches.forEach(match => {
                // Should be formatted to 2 decimal places
                expect(match).toMatch(/^\d+\.\d{2}$/);
              });
            }

            // Verify percentage formatting consistency
            const percentageMatches = csvContent.match(/\d+(\.\d+)?%/g);
            if (percentageMatches) {
              percentageMatches.forEach(match => {
                const numericPart = parseFloat(match.replace('%', ''));
                expect(numericPart).toBeGreaterThanOrEqual(0);
                expect(numericPart).toBeLessThanOrEqual(100);
              });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should handle different report types correctly in CSV export', async () => {
      /**
       * Feature: hierarchical-referral-program, Property 25: Report Export Functionality
       * Validates: Requirements 6.5
       * 
       * For any report type (influencer, network, system), the CSV export should 
       * include appropriate sections and data formatting
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate different report types
          fc.constantFrom('influencer', 'network', 'system'),
          safeIdGenerator, // report ID
          async (reportType: string, reportId: string) => {
            // Create mock report data based on type
            const baseReport = {
              id: reportId,
              type: reportType as any,
              period: {
                start: new Date('2024-01-01'),
                end: new Date('2024-12-31'),
                granularity: 'month' as any
              },
              generatedAt: Timestamp.now(),
              requestedBy: 'test-user'
            };

            let reportData: AnalyticsReport;

            switch (reportType) {
              case 'influencer':
                reportData = {
                  ...baseReport,
                  data: {
                    metrics: {
                      totalEarnings: 1000,
                      directEarnings: 600,
                      indirectEarnings: 400,
                      totalActivities: 100,
                      conversionRate: 5.5,
                      clickThroughRate: 12.3,
                      activeMiniInfluencers: 5,
                      totalMiniInfluencers: 10
                    },
                    revenueTrends: [
                      { date: '2024-01-01', revenue: 100, activities: 10 },
                      { date: '2024-02-01', revenue: 150, activities: 15 }
                    ]
                  }
                };
                break;

              case 'network':
                reportData = {
                  ...baseReport,
                  data: {
                    totalNetworkSize: 25,
                    totalNetworkEarnings: 5000,
                    averageEarningsPerMini: 200,
                    growthRate: 15.5,
                    retentionRate: 85.2,
                    topPerformers: [
                      {
                        rank: 1,
                        influencer: { id: 'mini-1', name: 'Test Mini', email: 'mini@test.com', type: 'mini' },
                        earnings: 500,
                        activities: 50,
                        conversionRate: 8.5
                      }
                    ]
                  }
                };
                break;

              case 'system':
                reportData = {
                  ...baseReport,
                  data: {
                    systemMetrics: {
                      totalMotherInfluencers: 10,
                      totalMiniInfluencers: 100,
                      totalEarnings: 50000,
                      totalActivities: 5000,
                      averageNetworkSize: 10,
                      topPerformers: [
                        {
                          rank: 1,
                          influencer: { id: 'mother-1', name: 'Top Mother', email: 'mother@test.com', type: 'mother', totalEarnings: 5000 },
                          score: 95.5,
                          metrics: {} as any
                        }
                      ]
                    }
                  }
                };
                break;

              default:
                throw new Error(`Unknown report type: ${reportType}`);
            }

            // Export to CSV
            const csvContent = await HierarchicalExportService.exportAnalyticsReportToCSV(reportData);

            // Verify common elements
            expect(csvContent).toContain('Analytics Report Export');
            expect(csvContent).toContain(`Report ID: ${reportId}`);
            expect(csvContent).toContain(`Report Type: ${reportType}`);

            // Verify type-specific content
            switch (reportType) {
              case 'influencer':
                expect(csvContent).toContain('Influencer Metrics');
                expect(csvContent).toContain('Total Earnings,1000.00');
                expect(csvContent).toContain('Revenue Trends');
                break;

              case 'network':
                expect(csvContent).toContain('Network Performance Report');
                expect(csvContent).toContain('Total Network Size,25');
                expect(csvContent).toContain('Growth Rate,15.5%');
                break;

              case 'system':
                expect(csvContent).toContain('System Performance Report');
                expect(csvContent).toContain('Total Mother Influencers,10');
                expect(csvContent).toContain('Total Mini Influencers,100');
                break;
            }

            // Verify CSV validation passes
            const validation = HierarchicalExportService.validateCSVContent(csvContent);
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should validate export data before processing', async () => {
      /**
       * Feature: hierarchical-referral-program, Property 25: Report Export Functionality
       * Validates: Requirements 6.5
       * 
       * For any export data validation, the system should properly validate 
       * data structure and content before processing
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate various data scenarios for validation
          fc.oneof(
            // Valid metrics data
            fc.record({
              totalEarnings: fc.float({ min: 0, max: 10000 }),
              totalActivities: fc.integer({ min: 0, max: 1000 }),
              conversionRate: fc.float({ min: 0, max: 100 }),
              clickThroughRate: fc.float({ min: 0, max: 100 })
            }),
            // Invalid metrics data
            fc.record({
              totalEarnings: fc.constantFrom('invalid', null, undefined),
              totalActivities: fc.constantFrom('invalid', null, undefined)
            }),
            // Valid ranking data
            fc.array(
              fc.record({
                rank: fc.integer({ min: 1, max: 100 }),
                influencer: fc.record({
                  id: safeCodeGenerator,
                  name: safeNameGenerator,
                  email: fc.emailAddress()
                }),
                earnings: fc.float({ min: 0, max: 5000 }),
                activities: fc.integer({ min: 0, max: 500 }),
                conversionRate: fc.float({ min: 0, max: 100 })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            // Invalid ranking data
            fc.oneof(
              fc.constant(null),
              fc.constant('not-an-array'),
              fc.array(
                fc.record({
                  rank: fc.constantFrom('invalid', null),
                  influencer: fc.constantFrom(null, undefined, { id: null })
                }),
                { minLength: 1, maxLength: 5 }
              )
            )
          ),
          fc.constantFrom('metrics', 'ranking', 'activities', 'commissions'),
          async (testData: any, dataType: string) => {
            // Validate export data
            const validation = HierarchicalExportService.validateExportData(testData, dataType);

            // Verify validation structure
            expect(validation).toHaveProperty('isValid');
            expect(validation).toHaveProperty('errors');
            expect(typeof validation.isValid).toBe('boolean');
            expect(Array.isArray(validation.errors)).toBe(true);

            // Verify validation logic based on data type and content
            if (testData === null || testData === undefined) {
              expect(validation.isValid).toBe(false);
              expect(validation.errors).toContain('Export data is null or undefined');
            } else {
              switch (dataType) {
                case 'metrics':
                  if (typeof testData.totalEarnings !== 'number') {
                    expect(validation.isValid).toBe(false);
                    expect(validation.errors.some(error => error.includes('totalEarnings'))).toBe(true);
                  }
                  if (typeof testData.totalActivities !== 'number') {
                    expect(validation.isValid).toBe(false);
                    expect(validation.errors.some(error => error.includes('totalActivities'))).toBe(true);
                  }
                  break;

                case 'ranking':
                  if (!Array.isArray(testData)) {
                    expect(validation.isValid).toBe(false);
                    expect(validation.errors).toContain('Ranking data must be an array');
                  } else {
                    // Check for invalid items in array
                    const hasInvalidItems = testData.some(item => 
                      !item || !item.influencer || !item.influencer.id || typeof item.rank !== 'number'
                    );
                    if (hasInvalidItems) {
                      expect(validation.isValid).toBe(false);
                      expect(validation.errors.some(error => 
                        error.includes('Invalid influencer data') || error.includes('Invalid rank')
                      )).toBe(true);
                    }
                  }
                  break;

                case 'activities':
                  if (!Array.isArray(testData)) {
                    expect(validation.isValid).toBe(false);
                    expect(validation.errors).toContain('Activities data must be an array');
                  }
                  break;

                case 'commissions':
                  if (!Array.isArray(testData)) {
                    expect(validation.isValid).toBe(false);
                    expect(validation.errors).toContain('Commissions data must be an array');
                  }
                  break;
              }
            }

            // If validation passes, there should be no errors
            if (validation.isValid) {
              expect(validation.errors).toHaveLength(0);
            }

            // If there are errors, validation should fail
            if (validation.errors.length > 0) {
              expect(validation.isValid).toBe(false);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('CSV Export Validation', () => {
    it('should validate CSV export format and content correctly', async () => {
      /**
       * Property: CSV export validation ensures proper format and content
       * 
       * For any CSV export, the validation should verify proper formatting,
       * required headers, and data integrity
       */
      await fc.assert(
        fc.asyncProperty(
          // Generate various CSV content scenarios
          fc.oneof(
            fc.constant(''), // Empty content
            fc.constant('Header1,Header2\nValue1,Value2'), // Valid CSV
            fc.constant('InvalidContent'), // Invalid format
            fc.constant('Header1,Header2\n'), // Header only
            fc.string({ minLength: 10, maxLength: 100 }) // Random content
          ),
          async (csvContent: string) => {
            // Validate CSV export
            const validation = HierarchicalAnalyticsService.validateCSVExport(csvContent);

            // Verify validation structure
            expect(validation).toHaveProperty('isValid');
            expect(validation).toHaveProperty('errors');
            expect(typeof validation.isValid).toBe('boolean');
            expect(Array.isArray(validation.errors)).toBe(true);

            // Verify validation logic
            if (csvContent.trim().length === 0) {
              expect(validation.isValid).toBe(false);
              expect(validation.errors).toContain('CSV content is empty');
            }

            const lines = csvContent.split('\n');
            if (lines.length < 2) {
              expect(validation.isValid).toBe(false);
              expect(validation.errors.some(error => 
                error.includes('at least header and one data row')
              )).toBe(true);
            }

            const hasValidHeaders = lines.some(line => line.includes(','));
            if (!hasValidHeaders && csvContent.trim().length > 0) {
              expect(validation.isValid).toBe(false);
              expect(validation.errors.some(error => 
                error.includes('comma-separated values')
              )).toBe(true);
            }

            // If validation passes, there should be no errors
            if (validation.isValid) {
              expect(validation.errors).toHaveLength(0);
            }

            // If there are errors, validation should fail
            if (validation.errors.length > 0) {
              expect(validation.isValid).toBe(false);
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});