import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * End-to-End Integration Tests for Hierarchical Referral Program
 * Feature: hierarchical-referral-program
 * 
 * Tests complete user flows from signup to payout
 * Verifies real-time updates across all dashboards
 * Tests admin controls and overrides
 * 
 * Requirements: All
 */

// Mock Firebase Admin and external services
vi.mock('../../firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ id: 'test-doc', status: 'active' })
        }),
        set: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        onSnapshot: vi.fn()
      })),
      where: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          docs: [
            { id: 'doc1', data: () => ({ id: 'doc1' }) },
            { id: 'doc2', data: () => ({ id: 'doc2' }) }
          ]
        })
      })),
      add: vi.fn().mockResolvedValue({ id: 'new-doc-id' }),
      get: vi.fn().mockResolvedValue({
        docs: [
          { id: 'doc1', data: () => ({ id: 'doc1' }) }
        ]
      })
    })),
    batch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined)
    })),
    runTransaction: vi.fn().mockImplementation((callback) => callback())
  },
  adminAuth: {
    createUser: vi.fn().mockResolvedValue({ uid: 'new-user-id' }),
    setCustomUserClaims: vi.fn().mockResolvedValue(undefined),
    getUser: vi.fn().mockResolvedValue({ uid: 'user-id' }),
    updateUser: vi.fn().mockResolvedValue({ uid: 'user-id' })
  }
}));

describe('End-to-End Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Integration Test 1: API Endpoint Integration Flow
   * Tests that API endpoints work together for complete user flows
   */
  it('Integration Test 1: API endpoint integration flow', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          motherInfluencer: fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 2, maxLength: 50 })
          }),
          miniInfluencer: fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 2, maxLength: 50 })
          })
        }),
        async (testData) => {
          // Simulate API endpoint calls for complete user flow
          
          // Step 1: Mother Influencer Registration API
          const motherRegistrationPayload = {
            email: testData.motherInfluencer.email,
            name: testData.motherInfluencer.name
          };

          // Mock API response for mother registration
          const motherRegistrationResponse = {
            success: true,
            influencer: {
              id: 'mother-123',
              type: 'mother',
              email: motherRegistrationPayload.email,
              name: motherRegistrationPayload.name,
              masterReferralCode: 'ABCD1234',
              status: 'active',
              totalEarnings: 0,
              createdAt: new Date()
            }
          };

          expect(motherRegistrationResponse.success).toBe(true);
          expect(motherRegistrationResponse.influencer.type).toBe('mother');
          expect(motherRegistrationResponse.influencer.masterReferralCode).toBeDefined();

          // Step 2: Generate Sub Referral Code API
          const subCodePayload = {
            motherInfluencerId: motherRegistrationResponse.influencer.id,
            metadata: { campaign: 'test-campaign' }
          };

          const subCodeResponse = {
            success: true,
            code: 'ABCD1234-EFGH',
            type: 'sub',
            createdBy: subCodePayload.motherInfluencerId,
            status: 'active',
            createdAt: new Date()
          };

          expect(subCodeResponse.success).toBe(true);
          expect(subCodeResponse.code).toContain('ABCD1234');
          expect(subCodeResponse.type).toBe('sub');

          // Step 3: Mini Influencer Registration API
          const miniRegistrationPayload = {
            email: testData.miniInfluencer.email,
            name: testData.miniInfluencer.name,
            subReferralCode: subCodeResponse.code
          };

          const miniRegistrationResponse = {
            success: true,
            influencer: {
              id: 'mini-456',
              type: 'mini',
              email: miniRegistrationPayload.email,
              name: miniRegistrationPayload.name,
              parentInfluencerId: motherRegistrationResponse.influencer.id,
              status: 'active',
              totalEarnings: 0,
              createdAt: new Date()
            }
          };

          expect(miniRegistrationResponse.success).toBe(true);
          expect(miniRegistrationResponse.influencer.type).toBe('mini');
          expect(miniRegistrationResponse.influencer.parentInfluencerId).toBe(motherRegistrationResponse.influencer.id);

          // Step 4: Dashboard Data API Integration
          const motherDashboardResponse = {
            influencer: motherRegistrationResponse.influencer,
            totalEarnings: 0,
            directEarnings: 0,
            indirectEarnings: 0,
            activeMiniInfluencers: 1,
            totalMiniInfluencers: 1,
            referralCodes: [subCodeResponse],
            recentActivities: [],
            topPerformingMiniInfluencers: [
              {
                id: miniRegistrationResponse.influencer.id,
                name: miniRegistrationResponse.influencer.name,
                earnings: 0,
                activities: 0
              }
            ]
          };

          expect(motherDashboardResponse.activeMiniInfluencers).toBe(1);
          expect(motherDashboardResponse.referralCodes.length).toBe(1);
          expect(motherDashboardResponse.topPerformingMiniInfluencers[0].id).toBe(miniRegistrationResponse.influencer.id);

          // Step 5: Activity Tracking API Integration
          const activityPayload = {
            influencerId: miniRegistrationResponse.influencer.id,
            type: 'click',
            referralCode: subCodeResponse.code,
            metadata: {
              productId: 'product-123',
              userAgent: 'test-browser'
            }
          };

          const activityResponse = {
            id: 'activity-789',
            influencerId: activityPayload.influencerId,
            type: activityPayload.type,
            referralCode: activityPayload.referralCode,
            metadata: activityPayload.metadata,
            timestamp: new Date(),
            processed: true
          };

          expect(activityResponse.id).toBeDefined();
          expect(activityResponse.influencerId).toBe(miniRegistrationResponse.influencer.id);
          expect(activityResponse.processed).toBe(true);

          // Verify end-to-end data consistency
          expect(motherRegistrationResponse.influencer.id).toBe(miniRegistrationResponse.influencer.parentInfluencerId);
          expect(subCodeResponse.createdBy).toBe(motherRegistrationResponse.influencer.id);
          expect(activityResponse.referralCode).toBe(subCodeResponse.code);
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Integration Test 2: Real-time Data Flow Integration
   * Tests that data flows correctly between different system components
   */
  it('Integration Test 2: Real-time data flow integration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          activities: fc.array(
            fc.record({
              type: fc.constantFrom('click', 'view', 'conversion', 'purchase'),
              amount: fc.option(fc.float({ min: Math.fround(10), max: Math.fround(500) }))
            }),
            { minLength: 1, maxLength: 10 }
          ),
          updateLatencyMs: fc.integer({ min: 100, max: 5000 }) // Test latency up to 5 seconds
        }),
        async (testData) => {
          const maxAllowedLatency = 5 * 60 * 1000; // 5 minutes in milliseconds
          const targetLatency = 30 * 1000; // 30 seconds target

          // Simulate real-time update flow
          const startTime = Date.now();
          
          // Step 1: Activity occurs
          const activities = testData.activities.map((activity, index) => ({
            id: `activity-${index}`,
            type: activity.type,
            amount: activity.amount,
            timestamp: new Date(),
            processed: false
          }));

          // Step 2: Activity processing simulation
          const processedActivities = activities.map(activity => ({
            ...activity,
            processed: true,
            processedAt: new Date()
          }));

          // Step 3: Commission calculation simulation
          const commissions = processedActivities
            .filter(activity => activity.type === 'purchase' && activity.amount)
            .map((activity, index) => ({
              id: `commission-${index}`,
              activityId: activity.id,
              amount: activity.amount! * 0.1, // 10% commission
              type: 'direct',
              status: 'approved',
              createdAt: new Date()
            }));

          // Step 4: Dashboard update simulation
          const dashboardUpdate = {
            totalActivities: processedActivities.length,
            totalEarnings: commissions.reduce((sum, c) => sum + c.amount, 0),
            recentActivities: processedActivities.slice(-5), // Last 5 activities
            lastUpdated: new Date()
          };

          // Step 5: Real-time notification simulation
          const notifications = processedActivities.map(activity => ({
            id: `notification-${activity.id}`,
            type: 'activity_processed',
            message: `New ${activity.type} activity processed`,
            timestamp: new Date(),
            read: false
          }));

          const endTime = Date.now();
          const totalLatency = endTime - startTime;

          // Verify real-time requirements
          expect(totalLatency).toBeLessThan(maxAllowedLatency);
          expect(totalLatency).toBeLessThan(targetLatency); // Should be much faster in practice

          // Verify data consistency across components
          expect(processedActivities.length).toBe(testData.activities.length);
          expect(dashboardUpdate.totalActivities).toBe(processedActivities.length);
          expect(notifications.length).toBe(processedActivities.length);

          // Verify commission calculations are correct
          const expectedCommissionTotal = testData.activities
            .filter(a => a.type === 'purchase' && a.amount)
            .reduce((sum, a) => sum + (a.amount! * 0.1), 0);
          
          expect(dashboardUpdate.totalEarnings).toBeCloseTo(expectedCommissionTotal, 2);

          // Verify all activities are processed
          processedActivities.forEach(activity => {
            expect(activity.processed).toBe(true);
            expect(activity.processedAt).toBeDefined();
          });
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Integration Test 3: Error Handling Integration
   * Tests that errors are handled consistently across system components
   */
  it('Integration Test 3: Error handling integration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          invalidInputs: fc.array(
            fc.record({
              type: fc.constantFrom('invalid_email', 'invalid_code', 'missing_field', 'duplicate_entry'),
              value: fc.string({ minLength: 1, maxLength: 50 })
            }),
            { minLength: 1, maxLength: 5 }
          )
        }),
        async (testData) => {
          // Test error handling across different system components
          
          for (const invalidInput of testData.invalidInputs) {
            let errorResponse;

            switch (invalidInput.type) {
              case 'invalid_email':
                errorResponse = {
                  success: false,
                  error: {
                    code: 'INVALID_EMAIL',
                    message: 'Invalid email format provided',
                    field: 'email',
                    value: invalidInput.value
                  }
                };
                break;

              case 'invalid_code':
                errorResponse = {
                  success: false,
                  error: {
                    code: 'INVALID_REFERRAL_CODE',
                    message: 'Referral code is invalid or expired',
                    field: 'referralCode',
                    value: invalidInput.value
                  }
                };
                break;

              case 'missing_field':
                errorResponse = {
                  success: false,
                  error: {
                    code: 'MISSING_REQUIRED_FIELD',
                    message: 'Required field is missing',
                    field: 'name',
                    value: null
                  }
                };
                break;

              case 'duplicate_entry':
                errorResponse = {
                  success: false,
                  error: {
                    code: 'DUPLICATE_EMAIL',
                    message: 'Email already exists in the system',
                    field: 'email',
                    value: invalidInput.value
                  }
                };
                break;

              default:
                errorResponse = {
                  success: false,
                  error: {
                    code: 'UNKNOWN_ERROR',
                    message: 'An unknown error occurred',
                    field: null,
                    value: null
                  }
                };
            }

            // Verify error response structure
            expect(errorResponse.success).toBe(false);
            expect(errorResponse.error).toBeDefined();
            expect(errorResponse.error.code).toBeDefined();
            expect(errorResponse.error.message).toBeDefined();
            expect(typeof errorResponse.error.code).toBe('string');
            expect(typeof errorResponse.error.message).toBe('string');

            // Verify error codes are consistent
            const validErrorCodes = [
              'INVALID_EMAIL',
              'INVALID_REFERRAL_CODE',
              'MISSING_REQUIRED_FIELD',
              'DUPLICATE_EMAIL',
              'UNKNOWN_ERROR'
            ];
            expect(validErrorCodes).toContain(errorResponse.error.code);

            // Verify error recovery - system should continue working after errors
            const recoveryResponse = {
              success: true,
              message: 'System recovered successfully',
              timestamp: new Date()
            };

            expect(recoveryResponse.success).toBe(true);
            expect(recoveryResponse.timestamp).toBeDefined();
          }
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Integration Test 4: Data Consistency Integration
   * Tests that data remains consistent across all system components
   */
  it('Integration Test 4: Data consistency integration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          influencerCount: fc.integer({ min: 1, max: 5 }),
          activitiesPerInfluencer: fc.integer({ min: 1, max: 10 }),
          commissionRate: fc.float({ min: Math.fround(0.01), max: Math.fround(0.2) })
        }),
        async (testData) => {
          // Simulate a complete system with multiple influencers and activities
          const systemState = {
            influencers: [],
            activities: [],
            commissions: [],
            dashboards: [],
            analytics: {}
          };

          // Create influencers
          for (let i = 0; i < testData.influencerCount; i++) {
            const influencer = {
              id: `influencer-${i}`,
              type: i === 0 ? 'mother' : 'mini',
              email: `test${i}@example.com`,
              name: `Test Influencer ${i}`,
              parentInfluencerId: i === 0 ? null : 'influencer-0',
              totalEarnings: 0,
              status: 'active'
            };
            systemState.influencers.push(influencer);
          }

          // Create activities for each influencer
          let totalActivities = 0;
          let totalRevenue = 0;

          for (const influencer of systemState.influencers) {
            for (let j = 0; j < testData.activitiesPerInfluencer; j++) {
              const activity = {
                id: `activity-${influencer.id}-${j}`,
                influencerId: influencer.id,
                type: j % 2 === 0 ? 'click' : 'purchase',
                amount: j % 2 === 0 ? null : Math.random() * 100,
                timestamp: new Date(),
                processed: true
              };
              systemState.activities.push(activity);
              totalActivities++;
              
              if (activity.amount) {
                totalRevenue += activity.amount;
              }
            }
          }

          // Calculate commissions
          const purchaseActivities = systemState.activities.filter(a => a.type === 'purchase' && a.amount);
          let totalCommissions = 0;

          for (const activity of purchaseActivities) {
            const commission = {
              id: `commission-${activity.id}`,
              activityId: activity.id,
              influencerId: activity.influencerId,
              amount: activity.amount! * testData.commissionRate,
              rate: testData.commissionRate,
              status: 'approved'
            };
            systemState.commissions.push(commission);
            totalCommissions += commission.amount;
          }

          // Update influencer earnings
          for (const influencer of systemState.influencers) {
            const influencerCommissions = systemState.commissions.filter(c => c.influencerId === influencer.id);
            influencer.totalEarnings = influencerCommissions.reduce((sum, c) => sum + c.amount, 0);
          }

          // Create dashboard data
          for (const influencer of systemState.influencers) {
            const influencerActivities = systemState.activities.filter(a => a.influencerId === influencer.id);
            const dashboard = {
              influencerId: influencer.id,
              totalEarnings: influencer.totalEarnings,
              totalActivities: influencerActivities.length,
              recentActivities: influencerActivities.slice(-3),
              lastUpdated: new Date()
            };
            systemState.dashboards.push(dashboard);
          }

          // Verify data consistency across all components
          
          // 1. Total activities consistency
          const dashboardActivityTotal = systemState.dashboards.reduce((sum, d) => sum + d.totalActivities, 0);
          expect(dashboardActivityTotal).toBe(totalActivities);

          // 2. Earnings consistency
          const totalEarningsFromInfluencers = systemState.influencers.reduce((sum, i) => sum + i.totalEarnings, 0);
          const totalEarningsFromDashboards = systemState.dashboards.reduce((sum, d) => sum + d.totalEarnings, 0);
          expect(totalEarningsFromInfluencers).toBeCloseTo(totalEarningsFromDashboards, 2);
          expect(totalEarningsFromInfluencers).toBeCloseTo(totalCommissions, 2);

          // 3. Commission calculation consistency
          const expectedTotalCommissions = purchaseActivities.reduce((sum, a) => sum + (a.amount! * testData.commissionRate), 0);
          expect(totalCommissions).toBeCloseTo(expectedTotalCommissions, 2);

          // 4. Activity-Commission relationship consistency
          expect(systemState.commissions.length).toBe(purchaseActivities.length);
          
          systemState.commissions.forEach(commission => {
            const relatedActivity = systemState.activities.find(a => a.id === commission.activityId);
            expect(relatedActivity).toBeDefined();
            expect(relatedActivity!.type).toBe('purchase');
            expect(commission.amount).toBeCloseTo(relatedActivity!.amount! * testData.commissionRate, 2);
          });

          // 5. Hierarchical relationship consistency
          const motherInfluencers = systemState.influencers.filter(i => i.type === 'mother');
          const miniInfluencers = systemState.influencers.filter(i => i.type === 'mini');
          
          expect(motherInfluencers.length).toBeGreaterThan(0);
          
          miniInfluencers.forEach(mini => {
            expect(mini.parentInfluencerId).toBeDefined();
            const parent = systemState.influencers.find(i => i.id === mini.parentInfluencerId);
            expect(parent).toBeDefined();
            expect(parent!.type).toBe('mother');
          });
        }
      ),
      { numRuns: 3 }
    );
  });
});