import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import * as fc from 'fast-check';
import { MiniInfluencerAuthService } from '../mini-influencer-auth-service';
import { HierarchicalReferralService } from '../referral-service';
import { setCustomUserClaims } from '../../utils/auth-claims';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { adminDb } from '../../../firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { 
  Influencer, 
  HierarchicalReferralErrorCode,
  ReferralCode 
} from '../../../../types/hierarchical-referral';

// Mock dependencies
vi.mock('../referral-service');
vi.mock('../../utils/auth-claims');
vi.mock('firebase/auth');
vi.mock('../../../firebase-admin');

const mockHierarchicalReferralService = HierarchicalReferralService as any;
const mockSetCustomUserClaims = setCustomUserClaims as Mock;
const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as Mock;
const mockGetAuth = getAuth as Mock;
const mockAdminDb = adminDb as any;

// Test data generators
const emailArbitrary = fc.emailAddress();
const passwordArbitrary = fc.string({ minLength: 6, maxLength: 50 });
const nameArbitrary = fc.string({ minLength: 1, maxLength: 100 });
const subReferralCodeArbitrary = fc.string({ minLength: 5, maxLength: 20 });
const profileImageArbitrary = fc.webUrl();

const validSubReferralCodeArbitrary = fc.record({
  id: fc.string(),
  code: fc.string(),
  type: fc.constant('sub' as const),
  createdBy: fc.string(),
  assignedTo: fc.constant(undefined),
  status: fc.constant('active' as const),
  usageCount: fc.nat(),
  createdAt: fc.constant(Timestamp.now()),
  metadata: fc.record({})
});

describe('MiniInfluencerAuthService Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockGetAuth.mockReturnValue({});
    mockAdminDb.collection.mockReturnValue({
      doc: vi.fn().mockReturnValue({
        set: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue({ exists: true, data: vi.fn() }),
        update: vi.fn().mockResolvedValue(undefined)
      })
    });
  });

  /**
   * Property 6: Mini Influencer Account Creation
   * For any valid Sub_Referral_Code used during signup, the system should successfully 
   * create a Mini_Influencer account with immediate earning capabilities
   * Validates: Requirements 2.1, 2.3
   * Feature: hierarchical-referral-program, Property 6: Mini Influencer Account Creation
   */
  it('Property 6: Mini Influencer Account Creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        emailArbitrary,
        passwordArbitrary,
        nameArbitrary,
        subReferralCodeArbitrary,
        fc.option(profileImageArbitrary, { nil: undefined }),
        validSubReferralCodeArbitrary,
        async (email, password, name, subReferralCode, profileImage, validCode) => {
          // Setup mocks for valid registration
          const mockFirebaseUser = {
            uid: fc.sample(fc.string(), 1)[0],
            email
          };

          mockHierarchicalReferralService.validateCode.mockResolvedValue({
            isValid: true,
            code: validCode
          });

          mockCreateUserWithEmailAndPassword.mockResolvedValue({
            user: mockFirebaseUser
          });

          mockHierarchicalReferralService.linkInfluencer.mockResolvedValue(undefined);
          mockSetCustomUserClaims.mockResolvedValue(undefined);

          // Execute registration
          const result = await MiniInfluencerAuthService.registerMiniInfluencer(
            email,
            password,
            name,
            subReferralCode,
            profileImage
          );

          // Verify successful account creation
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
          
          if (result.data) {
            // Verify Mini Influencer properties
            expect(result.data.type).toBe('mini');
            expect(result.data.email).toBe(email);
            expect(result.data.name).toBe(name);
            expect(result.data.status).toBe('active'); // Immediate activation per requirement 2.3
            expect(result.data.totalEarnings).toBe(0); // Start with zero earnings
            expect(result.data.parentInfluencerId).toBe(validCode.createdBy);
            
            // Verify earning capabilities are enabled
            expect(result.data.payoutInfo).toBeDefined();
            expect(result.data.payoutInfo.minimumThreshold).toBeGreaterThan(0);
            expect(result.data.preferences).toBeDefined();
            expect(result.data.preferences.earningsMilestones).toBe(true);
            expect(result.data.preferences.payoutNotifications).toBe(true);
          }

          // Verify Firebase Auth user creation was called
          expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
            expect.anything(),
            email,
            password
          );

          // Verify custom claims were set with restricted permissions
          expect(mockSetCustomUserClaims).toHaveBeenCalledWith(
            mockFirebaseUser.uid,
            expect.objectContaining({
              hierarchicalReferral: true,
              influencerType: 'mini',
              canCreateSubCodes: false, // Mini Influencers cannot create sub codes
              canAccessDashboard: true,
              canViewEarnings: true,
              canManageProfile: true
            })
          );

          // Verify linking was performed
          expect(mockHierarchicalReferralService.linkInfluencer).toHaveBeenCalledWith(
            subReferralCode,
            mockFirebaseUser.uid
          );
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 8: Mini Influencer Permission Restriction
   * For any Mini_Influencer account, the system should prevent them from creating 
   * additional Sub_Referral_Codes
   * Validates: Requirements 2.5
   * Feature: hierarchical-referral-program, Property 8: Mini Influencer Permission Restriction
   */
  it('Property 8: Mini Influencer Permission Restriction', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string(), // userId
        async (userId) => {
          // Setup mock Mini Influencer
          const mockMiniInfluencer: Influencer = {
            id: userId,
            type: 'mini',
            email: fc.sample(emailArbitrary, 1)[0],
            name: fc.sample(nameArbitrary, 1)[0],
            status: 'active',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            totalEarnings: 0,
            payoutInfo: {
              minimumThreshold: 50,
              currency: 'USD',
              isVerified: false
            },
            preferences: {
              email: true,
              push: true,
              sms: false,
              newMiniInfluencer: false,
              earningsMilestones: true,
              payoutNotifications: true,
              systemUpdates: true
            }
          };

          // Mock database response
          mockAdminDb.collection.mockReturnValue({
            doc: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({
                exists: true,
                data: vi.fn().mockReturnValue(mockMiniInfluencer)
              })
            })
          });

          // Verify sub code creation restriction
          const result = await MiniInfluencerAuthService.verifySubCodeCreationRestriction(userId);

          expect(result.success).toBe(true);
          expect(result.data).toBe(false); // Mini Influencers cannot create sub codes

          // Verify the check was performed on a Mini Influencer
          expect(mockAdminDb.collection).toHaveBeenCalledWith('hierarchical_influencers');
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Additional Property Test: Invalid Code Rejection
   * For any invalid or expired Sub_Referral_Code used during signup, the system should 
   * reject the registration and return a descriptive error message
   * Validates: Requirements 2.4
   * Feature: hierarchical-referral-program, Property 7: Invalid Code Rejection
   */
  it('Property 7: Invalid Code Rejection', async () => {
    await fc.assert(
      fc.asyncProperty(
        emailArbitrary,
        passwordArbitrary,
        nameArbitrary,
        subReferralCodeArbitrary,
        fc.oneof(
          fc.constant({ isValid: false, error: 'Code not found' }),
          fc.constant({ isValid: false, error: 'Code has expired' }),
          fc.constant({ isValid: false, error: 'Code is not active' }),
          fc.constant({ isValid: false, error: 'Code usage limit exceeded' })
        ),
        async (email, password, name, subReferralCode, invalidValidation) => {
          // Setup mock for invalid code validation
          mockHierarchicalReferralService.validateCode.mockResolvedValue(invalidValidation);

          // Execute registration with invalid code
          const result = await MiniInfluencerAuthService.registerMiniInfluencer(
            email,
            password,
            name,
            subReferralCode
          );

          // Verify registration is rejected
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error?.code).toBe(HierarchicalReferralErrorCode.INVALID_CODE);
          expect(result.error?.message).toBe(invalidValidation.error);

          // Verify Firebase Auth user creation was NOT called
          expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();

          // Verify custom claims were NOT set
          expect(mockSetCustomUserClaims).not.toHaveBeenCalled();

          // Verify linking was NOT performed
          expect(mockHierarchicalReferralService.linkInfluencer).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Additional Property Test: Master Code Rejection
   * For any master referral code used during Mini Influencer signup, the system should 
   * reject the registration
   * Feature: hierarchical-referral-program, Property: Master Code Rejection for Mini Influencer
   */
  it('Property: Master Code Rejection for Mini Influencer', async () => {
    await fc.assert(
      fc.asyncProperty(
        emailArbitrary,
        passwordArbitrary,
        nameArbitrary,
        subReferralCodeArbitrary,
        async (email, password, name, masterReferralCode) => {
          // Setup mock for master code validation (valid but wrong type)
          const masterCode: ReferralCode = {
            id: masterReferralCode,
            code: masterReferralCode,
            type: 'master', // This should be rejected for Mini Influencer registration
            createdBy: fc.sample(fc.string(), 1)[0],
            status: 'active',
            usageCount: 0,
            createdAt: Timestamp.now(),
            metadata: {}
          };

          mockHierarchicalReferralService.validateCode.mockResolvedValue({
            isValid: true,
            code: masterCode
          });

          // Execute registration with master code
          const result = await MiniInfluencerAuthService.registerMiniInfluencer(
            email,
            password,
            name,
            masterReferralCode
          );

          // Verify registration is rejected
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error?.code).toBe(HierarchicalReferralErrorCode.INVALID_CODE);
          expect(result.error?.message).toContain('sub referral codes');

          // Verify Firebase Auth user creation was NOT called
          expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Additional Property Test: Already Assigned Code Rejection
   * For any sub referral code that is already assigned to another Mini Influencer, 
   * the system should reject the registration
   * Feature: hierarchical-referral-program, Property: Already Assigned Code Rejection
   */
  it('Property: Already Assigned Code Rejection', async () => {
    await fc.assert(
      fc.asyncProperty(
        emailArbitrary,
        passwordArbitrary,
        nameArbitrary,
        subReferralCodeArbitrary,
        fc.string().filter(s => s.length > 0), // existing assignee (non-empty)
        async (email, password, name, subReferralCode, existingAssignee) => {
          // Setup mock for already assigned sub code
          const assignedCode: ReferralCode = {
            id: subReferralCode,
            code: subReferralCode,
            type: 'sub',
            createdBy: fc.sample(fc.string(), 1)[0],
            assignedTo: existingAssignee, // Already assigned
            status: 'active',
            usageCount: 1,
            createdAt: Timestamp.now(),
            metadata: {}
          };

          // The validateCode should still return valid (code exists and is active)
          // but the registration should fail because assignedTo is not null
          mockHierarchicalReferralService.validateCode.mockResolvedValue({
            isValid: true,
            code: assignedCode
          });

          // Execute registration with already assigned code
          const result = await MiniInfluencerAuthService.registerMiniInfluencer(
            email,
            password,
            name,
            subReferralCode
          );

          // Verify registration is rejected
          expect(result.success).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error?.code).toBe(HierarchicalReferralErrorCode.INVALID_CODE);
          expect(result.error?.message).toContain('already been used');

          // Verify Firebase Auth user creation was NOT called
          expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 10 }
    );
  });
});