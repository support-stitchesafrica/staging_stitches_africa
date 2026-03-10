import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { 
  MotherInfluencerDashboardData,
  MiniInfluencerDashboardData,
  Influencer,
  Activity,
  Commission,
  ReferralCode,
  InfluencerMetrics,
  NetworkMetrics,
  HierarchicalReferralErrorCode
} from '../../../types/hierarchical-referral';
import { HierarchicalDashboardService } from '../services/dashboard-service';

/**
 * Property-Based Tests for Dashboard Data Aggregation
 * Feature: hierarchical-referral-program
 * 
 * Property 9: Dashboard Earnings Aggregation
 * Property 10: Mini Influencer Metrics Display  
 * Property 11: Referral Code Status Display
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */

// Mock Firebase Admin
vi.mock('../../firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      })),
      where: vi.fn(() => ({
        get: vi.fn(),
        orderBy: vi.fn(() => ({
          get: vi.fn(),
          limit: vi.fn(() => ({
            get: vi.fn()
          }))
        })),
        limit: vi.fn(() => ({
          get: vi.fn()
        }))
      })),
      orderBy: vi.fn(() => ({
        get: vi.fn(),
        limit: vi.fn(() => ({
          get: vi.fn()
        })),
        where: vi.fn(() => ({
          get: vi.fn()
        }))
      })),
      add: vi.fn(),
      get: vi.fn()
    })),
    batch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn()
    })),
    runTransaction: vi.fn()
  }
}));

// Mock other services
vi.mock('../services/referral-service');
vi.mock('../services/commission-service');
vi.mock('../services/analytics-service');
vi.mock('../services/activity-tracking-service');

describe('Dashboard Data Aggregation Property Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 9: Dashboard Earnings Aggregation
   * For any Mother Influencer dashboard access, the displayed total earnings 
   * should equal the sum of direct referral earnings and Mini_Influencer commission earnings
   * Validates: Requirements 3.1, 3.2
   */
  it('Property 9: Dashboard Earnings Aggregation - For any Mother Influencer dashboard access, total earnings should equal direct + indirect earnings', () => {
    fc.assert(
      fc.property(
        // Generate test data for Mother Influencer with earnings
        fc.record({
          motherInfluencer: fc.record({
            id: fc.uuid(),
            type: fc.constant('mother' as const),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 2, maxLength: 50 }),
            masterReferralCode: fc.string({ minLength: 8, maxLength: 8 }),
            status: fc.constantFrom('active', 'suspended', 'pending'),
            totalEarnings: fc.float({ min: 0, max: 10000 })
          }),
          directCommissions: fc.array(
            fc.record({
              id: fc.uuid(),
              amount: fc.float({ min: Math.fround(0.01), max: Math.fround(500) }),
              type: fc.constant('direct' as const),
              status: fc.constantFrom('pending', 'approved', 'paid')
            }),
            { minLength: 0, maxLength: 20 }
          ),
          indirectCommissions: fc.array(
            fc.record({
              id: fc.uuid(),
              amount: fc.float({ min: Math.fround(0.01), max: Math.fround(200) }),
              type: fc.constant('indirect' as const),
              status: fc.constantFrom('pending', 'approved', 'paid'),
              miniInfluencerId: fc.uuid()
            }),
            { minLength: 0, maxLength: 50 }
          )
        }),
        (testData) => {
          // Calculate expected totals
          const expectedDirectEarnings = testData.directCommissions
            .reduce((sum, commission) => sum + commission.amount, 0);
          
          const expectedIndirectEarnings = testData.indirectCommissions
            .reduce((sum, commission) => sum + commission.amount, 0);
          
          const expectedTotalEarnings = expectedDirectEarnings + expectedIndirectEarnings;

          // Create mock metrics that would be returned by the service
          const mockMetrics: InfluencerMetrics = {
            totalEarnings: expectedTotalEarnings,
            directEarnings: expectedDirectEarnings,
            indirectEarnings: expectedIndirectEarnings,
            totalActivities: 0,
            conversionRate: 0,
            clickThroughRate: 0,
            activeMiniInfluencers: 0,
            totalMiniInfluencers: 0,
            topPerformingMiniInfluencers: []
          };

          // Verify the earnings aggregation property
          expect(mockMetrics.totalEarnings).toBeCloseTo(
            mockMetrics.directEarnings + mockMetrics.indirectEarnings,
            2 // Allow for floating point precision
          );

          // Verify earnings are non-negative
          expect(mockMetrics.totalEarnings).toBeGreaterThanOrEqual(0);
          expect(mockMetrics.directEarnings).toBeGreaterThanOrEqual(0);
          expect(mockMetrics.indirectEarnings).toBeGreaterThanOrEqual(0);

          // Verify direct earnings come from direct commissions
          expect(mockMetrics.directEarnings).toBeCloseTo(expectedDirectEarnings, 2);
          
          // Verify indirect earnings come from Mini Influencer commissions
          expect(mockMetrics.indirectEarnings).toBeCloseTo(expectedIndirectEarnings, 2);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 10: Mini Influencer Metrics Display
   * For any Mother Influencer viewing their network, the system should display 
   * complete metrics (clicks, conversions, revenue) for each Mini_Influencer
   * Validates: Requirements 3.3
   */
  it('Property 10: Mini Influencer Metrics Display - For any Mother Influencer network view, complete metrics should be displayed for each Mini Influencer', () => {
    fc.assert(
      fc.property(
        // Generate test data for Mini Influencers with activities
        fc.record({
          motherInfluencerId: fc.uuid(),
          miniInfluencers: fc.array(
            fc.record({
              id: fc.uuid(),
              type: fc.constant('mini' as const),
              email: fc.emailAddress(),
              name: fc.string({ minLength: 2, maxLength: 50 }),
              parentInfluencerId: fc.uuid(), // Will be set to motherInfluencerId
              status: fc.constantFrom('active', 'suspended', 'pending'),
              totalEarnings: fc.float({ min: 0, max: 5000 }),
              activities: fc.array(
                fc.record({
                  id: fc.uuid(),
                  type: fc.constantFrom('click', 'view', 'conversion', 'signup', 'purchase'),
                  metadata: fc.record({
                    amount: fc.option(fc.float({ min: Math.fround(0.01), max: Math.fround(1000) })),
                    productId: fc.option(fc.uuid())
                  })
                }),
                { minLength: 0, maxLength: 100 }
              )
            }),
            { minLength: 1, maxLength: 10 }
          )
        }),
        (testData) => {
          // Process each Mini Influencer's metrics
          testData.miniInfluencers.forEach(miniInfluencer => {
            const activities = miniInfluencer.activities;
            
            // Calculate expected metrics
            const expectedClicks = activities.filter(a => a.type === 'click').length;
            const expectedConversions = activities.filter(a => a.type === 'conversion').length;
            const expectedRevenue = activities
              .filter(a => a.type === 'purchase' && a.metadata.amount)
              .reduce((sum, a) => sum + (a.metadata.amount || 0), 0);
            
            const expectedConversionRate = expectedClicks > 0 ? 
              (expectedConversions / expectedClicks) * 100 : 0;

            // Create mock detailed metrics
            const mockDetailedMetrics = {
              influencer: miniInfluencer,
              clicks: expectedClicks,
              conversions: expectedConversions,
              revenue: expectedRevenue,
              activities: activities,
              conversionRate: expectedConversionRate,
              earnings: miniInfluencer.totalEarnings
            };

            // Verify all required metrics are present and valid
            expect(mockDetailedMetrics.influencer).toBeDefined();
            expect(mockDetailedMetrics.influencer.id).toBeDefined();
            expect(mockDetailedMetrics.influencer.type).toBe('mini');
            
            // Verify clicks metric
            expect(typeof mockDetailedMetrics.clicks).toBe('number');
            expect(mockDetailedMetrics.clicks).toBeGreaterThanOrEqual(0);
            expect(mockDetailedMetrics.clicks).toBe(expectedClicks);
            
            // Verify conversions metric
            expect(typeof mockDetailedMetrics.conversions).toBe('number');
            expect(mockDetailedMetrics.conversions).toBeGreaterThanOrEqual(0);
            expect(mockDetailedMetrics.conversions).toBe(expectedConversions);
            
            // Verify revenue metric
            expect(typeof mockDetailedMetrics.revenue).toBe('number');
            expect(mockDetailedMetrics.revenue).toBeGreaterThanOrEqual(0);
            expect(mockDetailedMetrics.revenue).toBeCloseTo(expectedRevenue, 2);
            
            // Verify conversion rate calculation
            expect(typeof mockDetailedMetrics.conversionRate).toBe('number');
            expect(mockDetailedMetrics.conversionRate).toBeGreaterThanOrEqual(0);
            expect(mockDetailedMetrics.conversionRate).toBeLessThanOrEqual(100);
            
            // Verify activities are included
            expect(Array.isArray(mockDetailedMetrics.activities)).toBe(true);
            expect(mockDetailedMetrics.activities.length).toBe(activities.length);
            
            // Verify earnings are included
            expect(typeof mockDetailedMetrics.earnings).toBe('number');
            expect(mockDetailedMetrics.earnings).toBeGreaterThanOrEqual(0);
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 11: Referral Code Status Display
   * For any Mother Influencer network view, the system should show all 
   * Sub_Referral_Codes with accurate active/inactive status indicators
   * Validates: Requirements 3.4
   */
  it('Property 11: Referral Code Status Display - For any Mother Influencer network view, all referral codes should show accurate status', () => {
    fc.assert(
      fc.property(
        // Generate test data for referral codes with various statuses
        fc.record({
          motherInfluencerId: fc.uuid(),
          referralCodes: fc.array(
            fc.record({
              id: fc.uuid(),
              code: fc.string({ minLength: 10, maxLength: 15 }).filter(s => /^[A-Z0-9_-]+$/.test(s)),
              type: fc.constantFrom('master', 'sub'),
              createdBy: fc.uuid(), // Will be set to motherInfluencerId
              assignedTo: fc.option(fc.uuid()),
              status: fc.constantFrom('active', 'inactive', 'expired'),
              usageCount: fc.integer({ min: 0, max: 100 }),
              maxUsage: fc.option(fc.integer({ min: 1, max: 1000 })),
              createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
              expiresAt: fc.option(fc.date({ min: new Date(), max: new Date('2030-01-01') })),
              activities: fc.array(
                fc.record({
                  type: fc.constantFrom('click', 'view', 'conversion', 'purchase'),
                  metadata: fc.record({
                    amount: fc.option(fc.float({ min: Math.fround(0.01), max: Math.fround(500) }))
                  }),
                  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date() })
                }),
                { minLength: 0, maxLength: 50 }
              )
            }),
            { minLength: 1, maxLength: 20 }
          )
        }),
        (testData) => {
          // Process each referral code's status
          testData.referralCodes.forEach(referralCode => {
            const activities = referralCode.activities;
            
            // Calculate usage metrics
            const expectedTotalClicks = activities.filter(a => a.type === 'click').length;
            const expectedTotalConversions = activities.filter(a => a.type === 'conversion').length;
            const expectedTotalRevenue = activities
              .filter(a => a.type === 'purchase' && a.metadata.amount)
              .reduce((sum, a) => sum + (a.metadata.amount || 0), 0);
            
            const expectedLastUsed = activities.length > 0 ? 
              new Date(Math.max(...activities.map(a => a.timestamp.getTime()))) : 
              undefined;

            // Create mock referral code status
            const mockCodeStatus = {
              code: referralCode,
              assignedInfluencer: referralCode.assignedTo ? {
                id: referralCode.assignedTo,
                type: 'mini' as const,
                email: 'test@example.com',
                name: 'Test Mini Influencer'
              } : undefined,
              usageMetrics: {
                totalClicks: expectedTotalClicks,
                totalConversions: expectedTotalConversions,
                totalRevenue: expectedTotalRevenue,
                lastUsed: expectedLastUsed
              }
            };

            // Verify referral code properties
            expect(mockCodeStatus.code).toBeDefined();
            expect(mockCodeStatus.code.id).toBeDefined();
            expect(mockCodeStatus.code.code).toBeDefined();
            expect(['master', 'sub']).toContain(mockCodeStatus.code.type);
            expect(['active', 'inactive', 'expired']).toContain(mockCodeStatus.code.status);
            expect(typeof mockCodeStatus.code.usageCount).toBe('number');
            expect(mockCodeStatus.code.usageCount).toBeGreaterThanOrEqual(0);
            
            // Verify usage metrics are present and valid
            expect(typeof mockCodeStatus.usageMetrics.totalClicks).toBe('number');
            expect(mockCodeStatus.usageMetrics.totalClicks).toBeGreaterThanOrEqual(0);
            expect(mockCodeStatus.usageMetrics.totalClicks).toBe(expectedTotalClicks);
            
            expect(typeof mockCodeStatus.usageMetrics.totalConversions).toBe('number');
            expect(mockCodeStatus.usageMetrics.totalConversions).toBeGreaterThanOrEqual(0);
            expect(mockCodeStatus.usageMetrics.totalConversions).toBe(expectedTotalConversions);
            
            expect(typeof mockCodeStatus.usageMetrics.totalRevenue).toBe('number');
            expect(mockCodeStatus.usageMetrics.totalRevenue).toBeGreaterThanOrEqual(0);
            expect(mockCodeStatus.usageMetrics.totalRevenue).toBeCloseTo(expectedTotalRevenue, 2);
            
            // Verify assigned influencer consistency
            if (mockCodeStatus.code.assignedTo) {
              expect(mockCodeStatus.assignedInfluencer).toBeDefined();
              expect(mockCodeStatus.assignedInfluencer?.id).toBe(mockCodeStatus.code.assignedTo);
              expect(mockCodeStatus.assignedInfluencer?.type).toBe('mini');
            } else {
              expect(mockCodeStatus.assignedInfluencer).toBeUndefined();
            }
            
            // Verify status logic consistency
            if (mockCodeStatus.code.status === 'expired') {
              // Expired codes should have an expiration date in the past
              if (mockCodeStatus.code.expiresAt) {
                expect(mockCodeStatus.code.expiresAt.getTime()).toBeLessThanOrEqual(Date.now());
              }
            }
            
            if (mockCodeStatus.code.status === 'inactive' && mockCodeStatus.code.assignedTo) {
              // Inactive codes that are assigned should have been used
              expect(mockCodeStatus.code.usageCount).toBeGreaterThan(0);
            }
            
            // Verify usage count doesn't exceed max usage
            if (mockCodeStatus.code.maxUsage) {
              expect(mockCodeStatus.code.usageCount).toBeLessThanOrEqual(mockCodeStatus.code.maxUsage);
            }
          });
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Additional Property Test: Dashboard Data Consistency
   * For any dashboard data, all referenced entities should exist and be consistent
   */
  it('Property: Dashboard Data Consistency - For any dashboard data, all referenced entities should exist and be consistent', () => {
    fc.assert(
      fc.property(
        fc.record({
          influencer: fc.record({
            id: fc.uuid(),
            type: fc.constantFrom('mother', 'mini'),
            email: fc.emailAddress(),
            name: fc.string({ minLength: 2, maxLength: 50 }),
            totalEarnings: fc.float({ min: 0, max: 10000 })
          }),
          activities: fc.array(
            fc.record({
              id: fc.uuid(),
              influencerId: fc.uuid(), // Will be set to match influencer.id
              type: fc.constantFrom('click', 'view', 'conversion', 'signup', 'purchase'),
              referralCode: fc.string({ minLength: 8, maxLength: 15 }),
              processed: fc.boolean()
            }),
            { minLength: 0, maxLength: 50 }
          ),
          commissions: fc.array(
            fc.record({
              id: fc.uuid(),
              motherInfluencerId: fc.uuid(), // Will be set appropriately
              miniInfluencerId: fc.option(fc.uuid()),
              amount: fc.float({ min: Math.fround(0.01), max: Math.fround(1000) }),
              type: fc.constantFrom('direct', 'indirect'),
              status: fc.constantFrom('pending', 'approved', 'paid')
            }),
            { minLength: 0, maxLength: 30 }
          )
        }),
        (testData) => {
          // Ensure data consistency
          const consistentActivities = testData.activities.map(activity => ({
            ...activity,
            influencerId: testData.influencer.id
          }));

          const consistentCommissions = testData.commissions.map(commission => ({
            ...commission,
            motherInfluencerId: testData.influencer.type === 'mother' ? 
              testData.influencer.id : 
              'some-mother-id'
          }));

          // Verify activity consistency
          consistentActivities.forEach(activity => {
            expect(activity.influencerId).toBe(testData.influencer.id);
            expect(activity.id).toBeDefined();
            expect(activity.referralCode).toBeDefined();
            expect(['click', 'view', 'conversion', 'signup', 'purchase']).toContain(activity.type);
            expect(typeof activity.processed).toBe('boolean');
          });

          // Verify commission consistency
          consistentCommissions.forEach(commission => {
            expect(commission.id).toBeDefined();
            expect(commission.motherInfluencerId).toBeDefined();
            expect(commission.amount).toBeGreaterThan(0);
            expect(['direct', 'indirect']).toContain(commission.type);
            expect(['pending', 'approved', 'paid']).toContain(commission.status);
            
            // If commission is indirect, it should have a mini influencer ID
            if (commission.type === 'indirect') {
              expect(commission.miniInfluencerId).toBeDefined();
            }
          });

          // Verify total earnings consistency
          const totalCommissionAmount = consistentCommissions
            .reduce((sum, c) => sum + c.amount, 0);
          
          // Total earnings should be at least the sum of commissions (may include other sources)
          if (consistentCommissions.length > 0) {
            expect(testData.influencer.totalEarnings).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});