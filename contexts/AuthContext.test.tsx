import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { User } from 'firebase/auth';
import { UserProfile } from '@/types';
import fc from 'fast-check';

// Mock Firebase auth and firestore
vi.mock('@/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

// Mock Firebase auth functions
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}));

// Mock auth-simple
vi.mock('@/lib/auth-simple', () => ({
  onAuthStateChange: vi.fn(),
}));

// Mock userProfileRepository
vi.mock('@/lib/firestore', () => ({
  userProfileRepository: {
    getProfile: vi.fn(),
    createProfile: vi.fn(),
    updateLastLogin: vi.fn(),
    markOnboardingCompleted: vi.fn(),
  },
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  analytics: {
    setUserId: vi.fn(),
    clearUserId: vi.fn(),
    trackAuth: vi.fn(),
  },
}));

// Mock performance utils
vi.mock('@/lib/utils/performance-utils', () => ({
  trackAuthStateChange: () => vi.fn(),
}));

// Mock firebase wrapper
vi.mock('@/lib/firebase-wrapper', () => ({
  clearModuleCache: vi.fn(),
}));

// Mock collections auth service
vi.mock('@/lib/collections/auth-service', () => ({
  CollectionsAuthService: {
    validateCollectionsAccess: vi.fn().mockResolvedValue(false),
  },
}));

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
}));

// Test component that uses the hook
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.uid : 'null'}</div>
      <div data-testid="userProfile">{auth.userProfile ? auth.userProfile.uid : 'null'}</div>
      <div data-testid="loading">{auth.loading ? 'true' : 'false'}</div>
      <div data-testid="isVvip">{auth.isVvip ? 'true' : 'false'}</div>
      <div data-testid="error">{auth.error || 'null'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  let mockOnAuthStateChange: any;
  let mockGetProfile: any;
  let mockCreateProfile: any;
  let mockUpdateLastLogin: any;
  let mockMarkOnboardingCompleted: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked functions
    const { onAuthStateChange } = await import('@/lib/auth-simple');
    const { userProfileRepository } = await import('@/lib/firestore');
    
    mockOnAuthStateChange = onAuthStateChange as any;
    mockGetProfile = userProfileRepository.getProfile as any;
    mockCreateProfile = userProfileRepository.createProfile as any;
    mockUpdateLastLogin = userProfileRepository.updateLastLogin as any;
    mockMarkOnboardingCompleted = userProfileRepository.markOnboardingCompleted as any;
    
    // Reset mock implementations
    mockOnAuthStateChange.mockImplementation((callback: any) => {
      // Return a mock unsubscribe function
      return vi.fn();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 11: Session Includes VVIP Flag', () => {
    /**
     * Feature: vvip-shopper-program, Property 11: Session Includes VVIP Flag
     * Validates: Requirements 3.2, 3.7
     * 
     * For any user with isVvip=true, when a session is established, 
     * the session state should include the isVvip flag.
     */
    it('should include isVvip flag in session state for any user with isVvip=true', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            uid: fc.uuid(),
            email: fc.emailAddress(),
            displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            photoURL: fc.option(fc.webUrl()),
            isVvip: fc.constant(true), // Always true for this test
            vvip_created_by: fc.uuid(),
            vvip_created_at: fc.date(),
          }),
          async (userData) => {
            // Create mock Firebase user
            const mockUser: Partial<User> = {
              uid: userData.uid,
              email: userData.email,
              displayName: userData.displayName || null,
              photoURL: userData.photoURL || null,
            };

            // Create mock user profile with VVIP flag
            const mockUserProfile: UserProfile = {
              uid: userData.uid,
              email: userData.email,
              displayName: userData.displayName || undefined,
              photoURL: userData.photoURL || undefined,
              createdAt: new Date(),
              lastLoginAt: new Date(),
              onboardingStatus: {
                measurementsCompleted: false,
                profileCompleted: false,
                firstLoginCompleted: false,
              },
              preferences: {},
              metadata: {
                isFirstTimeUser: false,
                hasCompletedOnboarding: true,
                onboardingStep: 'completed',
                loginCount: 1,
              },
              // VVIP fields
              isVvip: userData.isVvip,
              vvip_created_by: userData.vvip_created_by,
              vvip_created_at: userData.vvip_created_at,
            };

            // Mock the profile repository to return the VVIP user
            mockGetProfile.mockResolvedValue(mockUserProfile);

            // Setup auth state change to simulate user login
            mockOnAuthStateChange.mockImplementation((callback) => {
              // Simulate immediate auth state change
              setTimeout(() => {
                callback(mockUser as User);
              }, 0);
              return vi.fn(); // Return unsubscribe function
            });

            // Render the component
            const { getByTestId } = render(
              <AuthProvider>
                <TestComponent />
              </AuthProvider>
            );

            // Wait for auth state to be established
            await waitFor(
              () => {
                expect(getByTestId('loading')).toHaveTextContent('false');
              },
              { timeout: 1000 }
            );

            // Verify that the session includes the VVIP flag
            expect(getByTestId('isVvip')).toHaveTextContent('true');
            expect(getByTestId('user')).toHaveTextContent(userData.uid);
            expect(getByTestId('userProfile')).toHaveTextContent(userData.uid);

            // Verify that the profile was fetched
            expect(mockGetProfile).toHaveBeenCalledWith(userData.uid);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set isVvip to false for any user with isVvip=false or undefined', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            uid: fc.uuid(),
            email: fc.emailAddress(),
            displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
            photoURL: fc.option(fc.webUrl()),
            isVvip: fc.option(fc.constant(false)), // false or undefined
          }),
          async (userData) => {
            // Create mock Firebase user
            const mockUser: Partial<User> = {
              uid: userData.uid,
              email: userData.email,
              displayName: userData.displayName || null,
              photoURL: userData.photoURL || null,
            };

            // Create mock user profile without VVIP flag or with false
            const mockUserProfile: UserProfile = {
              uid: userData.uid,
              email: userData.email,
              displayName: userData.displayName || undefined,
              photoURL: userData.photoURL || undefined,
              createdAt: new Date(),
              lastLoginAt: new Date(),
              onboardingStatus: {
                measurementsCompleted: false,
                profileCompleted: false,
                firstLoginCompleted: false,
              },
              preferences: {},
              metadata: {
                isFirstTimeUser: false,
                hasCompletedOnboarding: true,
                onboardingStep: 'completed',
                loginCount: 1,
              },
              // VVIP field - either false or undefined
              isVvip: userData.isVvip,
            };

            // Mock the profile repository to return the non-VVIP user
            mockGetProfile.mockResolvedValue(mockUserProfile);

            // Setup auth state change to simulate user login
            mockOnAuthStateChange.mockImplementation((callback) => {
              // Simulate immediate auth state change
              setTimeout(() => {
                callback(mockUser as User);
              }, 0);
              return vi.fn(); // Return unsubscribe function
            });

            // Render the component
            const { getByTestId } = render(
              <AuthProvider>
                <TestComponent />
              </AuthProvider>
            );

            // Wait for auth state to be established
            await waitFor(
              () => {
                expect(getByTestId('loading')).toHaveTextContent('false');
              },
              { timeout: 1000 }
            );

            // Verify that the session includes isVvip as false
            expect(getByTestId('isVvip')).toHaveTextContent('false');
            expect(getByTestId('user')).toHaveTextContent(userData.uid);
            expect(getByTestId('userProfile')).toHaveTextContent(userData.uid);

            // Verify that the profile was fetched
            expect(mockGetProfile).toHaveBeenCalledWith(userData.uid);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set isVvip to false when user is not authenticated', async () => {
      // Setup auth state change to simulate no user
      mockOnAuthStateChange.mockImplementation((callback) => {
        // Simulate immediate auth state change with null user
        setTimeout(() => {
          callback(null);
        }, 0);
        return vi.fn(); // Return unsubscribe function
      });

      // Render the component
      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for auth state to be established
      await waitFor(
        () => {
          expect(getByTestId('loading')).toHaveTextContent('false');
        },
        { timeout: 1000 }
      );

      // Verify that isVvip is false when no user is authenticated
      expect(getByTestId('isVvip')).toHaveTextContent('false');
      expect(getByTestId('user')).toHaveTextContent('null');
      expect(getByTestId('userProfile')).toHaveTextContent('null');

      // Verify that no profile was fetched
      expect(mockGetProfile).not.toHaveBeenCalled();
    });
  });
});