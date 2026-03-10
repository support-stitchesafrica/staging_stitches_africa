import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { AtlasAuthProvider, useAtlasAuth } from './AtlasAuthContext';
import { AtlasAuthService } from '@/lib/atlas/auth-service';
import { User } from 'firebase/auth';

// Mock Firebase auth and firestore
vi.mock('@/firebase', () => ({
    auth: {
        currentUser: null,
    },
    db: {},
}));

// Mock Firebase auth functions
const mockOnAuthStateChanged = vi.fn();
vi.mock('firebase/auth', () => ({
    onAuthStateChanged: (auth: any, callback: any) => mockOnAuthStateChanged(auth, callback),
}));

// Mock Firestore functions
const mockOnSnapshot = vi.fn();
const mockDoc = vi.fn();
vi.mock('firebase/firestore', () => ({
    doc: (db: any, collection: string, id: string) => mockDoc(db, collection, id),
    onSnapshot: (docRef: any, callback: any, errorCallback?: any) => mockOnSnapshot(docRef, callback, errorCallback),
}));

// Mock AtlasAuthService
vi.mock('@/lib/atlas/auth-service', () => ({
    AtlasAuthService: {
        registerAtlasUser: vi.fn(),
        loginAtlasUser: vi.fn(),
        logoutAtlasUser: vi.fn(),
        getAtlasUser: vi.fn(),
    },
}));

// Test component that uses the hook
const TestComponent = () =>
{
    const auth = useAtlasAuth();
    return (
        <div>
            <div data-testid="user">{auth.user ? auth.user.uid : 'null'}</div>
            <div data-testid="atlasUser">{auth.atlasUser ? auth.atlasUser.uid : 'null'}</div>
            <div data-testid="loading">{auth.loading ? 'true' : 'false'}</div>
            <div data-testid="error">{auth.error || 'null'}</div>
            <button onClick={() => auth.register('test@stitchesafrica.com', 'password123', 'Test User')}>
                Register
            </button>
            <button onClick={() => auth.login('test@stitchesafrica.com', 'password123')}>
                Login
            </button>
            <button onClick={() => auth.logout()}>
                Logout
            </button>
            <button onClick={() => auth.clearError()}>
                Clear Error
            </button>
        </div>
    );
};

describe('AtlasAuthContext', () =>
{
    let authStateCallback: ((user: User | null) => void) | null = null;
    let firestoreCallback: ((snapshot: any) => void) | null = null;
    let firestoreErrorCallback: ((error: any) => void) | null = null;

    beforeEach(() =>
    {
        vi.clearAllMocks();
        authStateCallback = null;
        firestoreCallback = null;
        firestoreErrorCallback = null;

        // Setup onAuthStateChanged mock to capture callback
        mockOnAuthStateChanged.mockImplementation((auth, callback) =>
        {
            authStateCallback = callback;
            // Call immediately with null user (not authenticated)
            callback(null);
            // Return unsubscribe function
            return vi.fn();
        });

        // Setup onSnapshot mock to capture callbacks
        mockOnSnapshot.mockImplementation((docRef, callback, errorCallback) =>
        {
            firestoreCallback = callback;
            firestoreErrorCallback = errorCallback;
            // Return unsubscribe function
            return vi.fn();
        });

        // Setup doc mock
        mockDoc.mockReturnValue({ id: 'test-doc-ref' });
    });

    afterEach(() =>
    {
        authStateCallback = null;
        firestoreCallback = null;
        firestoreErrorCallback = null;
    });

    describe('useAtlasAuth hook', () =>
    {
        it('should throw error when used outside provider', () =>
        {
            // Suppress console.error for this test
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });

            expect(() =>
            {
                render(<TestComponent />);
            }).toThrow('useAtlasAuth must be used within an AtlasAuthProvider');

            consoleError.mockRestore();
        });

        it('should provide auth context when used inside provider', () =>
        {
            const { getByTestId } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            expect(getByTestId('user')).toHaveTextContent('null');
            expect(getByTestId('loading')).toHaveTextContent('false');
        });
    });

    describe('Authentication state changes', () =>
    {
        it('should update user state when auth state changes to authenticated', async () =>
        {
            const mockUser = {
                uid: 'test-uid-123',
                email: 'test@stitchesafrica.com',
            } as User;

            const mockAtlasUser = {
                uid: 'test-uid-123',
                email: 'test@stitchesafrica.com',
                fullName: 'Test User',
                role: 'superadmin' as const,
                isAtlasUser: true,
                createdAt: {} as any,
                updatedAt: {} as any,
            };

            const { getByTestId } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            // Initially not authenticated
            expect(getByTestId('user')).toHaveTextContent('null');

            // Simulate auth state change to authenticated
            await act(async () =>
            {
                if (authStateCallback)
                {
                    authStateCallback(mockUser);
                }
            });

            // Wait for user to be set
            await waitFor(() =>
            {
                expect(getByTestId('user')).toHaveTextContent('test-uid-123');
            });

            // Simulate Firestore document snapshot
            await act(async () =>
            {
                if (firestoreCallback)
                {
                    const mockSnapshot = {
                        exists: () => true,
                        data: () => mockAtlasUser,
                    };
                    firestoreCallback(mockSnapshot);
                }
            });

            // Wait for atlas user data to be updated
            await waitFor(() =>
            {
                expect(getByTestId('atlasUser')).toHaveTextContent('test-uid-123');
            });
        });

        it('should clear user state when auth state changes to unauthenticated', async () =>
        {
            const mockUser = {
                uid: 'test-uid-123',
                email: 'test@stitchesafrica.com',
            } as User;

            const mockAtlasUser = {
                uid: 'test-uid-123',
                email: 'test@stitchesafrica.com',
                fullName: 'Test User',
                role: 'superadmin' as const,
                isAtlasUser: true,
                createdAt: {} as any,
                updatedAt: {} as any,
            };

            vi.mocked(AtlasAuthService.getAtlasUser).mockResolvedValue(mockAtlasUser);

            const { getByTestId } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            // Simulate auth state change to authenticated
            await act(async () =>
            {
                if (authStateCallback)
                {
                    authStateCallback(mockUser);
                }
            });

            await waitFor(() =>
            {
                expect(getByTestId('user')).toHaveTextContent('test-uid-123');
            });

            // Simulate Firestore document snapshot
            await act(async () =>
            {
                if (firestoreCallback)
                {
                    const mockSnapshot = {
                        exists: () => true,
                        data: () => mockAtlasUser,
                    };
                    firestoreCallback(mockSnapshot);
                }
            });

            await waitFor(() =>
            {
                expect(getByTestId('atlasUser')).toHaveTextContent('test-uid-123');
            });

            // Simulate auth state change to unauthenticated
            await act(async () =>
            {
                if (authStateCallback)
                {
                    authStateCallback(null);
                }
            });

            await waitFor(() =>
            {
                expect(getByTestId('user')).toHaveTextContent('null');
                expect(getByTestId('atlasUser')).toHaveTextContent('null');
            });
        });

        it('should sign out user without Atlas access', async () =>
        {
            const mockUser = {
                uid: 'test-uid-123',
                email: 'test@stitchesafrica.com',
            } as User;

            const mockAtlasUserWithoutAccess = {
                uid: 'test-uid-123',
                email: 'test@stitchesafrica.com',
                fullName: 'Test User',
                role: 'superadmin' as const,
                isAtlasUser: false, // No Atlas access
                createdAt: {} as any,
                updatedAt: {} as any,
            };

            vi.mocked(AtlasAuthService.logoutAtlasUser).mockResolvedValue({ success: true });

            const { getByTestId } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            // Simulate auth state change to authenticated
            await act(async () =>
            {
                if (authStateCallback)
                {
                    authStateCallback(mockUser);
                }
            });

            // Simulate Firestore document snapshot with deactivated user
            await act(async () =>
            {
                if (firestoreCallback)
                {
                    const mockSnapshot = {
                        exists: () => true,
                        data: () => mockAtlasUserWithoutAccess,
                    };
                    firestoreCallback(mockSnapshot);
                }
            });

            // Wait for error to be set
            await waitFor(() =>
            {
                expect(getByTestId('error')).toHaveTextContent(
                    'Your access has been revoked. Please contact your administrator.'
                );
            });

            // Verify logout was called
            expect(AtlasAuthService.logoutAtlasUser).toHaveBeenCalled();
        });
    });

    describe('Register method', () =>
    {
        it('should call registerAtlasUser service on register', async () =>
        {
            vi.mocked(AtlasAuthService.registerAtlasUser).mockResolvedValue({ success: true });

            const { getByText } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            await act(async () =>
            {
                getByText('Register').click();
            });

            await waitFor(() =>
            {
                expect(AtlasAuthService.registerAtlasUser).toHaveBeenCalledWith(
                    'test@stitchesafrica.com',
                    'password123',
                    'Test User'
                );
            });
        });

        it('should set error when registration fails', async () =>
        {
            vi.mocked(AtlasAuthService.registerAtlasUser).mockResolvedValue({
                success: false,
                error: 'Registration failed',
            });

            const { getByText, getByTestId } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            await act(async () =>
            {
                getByText('Register').click();
            });

            await waitFor(() =>
            {
                expect(getByTestId('error')).toHaveTextContent('Registration failed');
            });
        });
    });

    describe('Login method', () =>
    {
        it('should call loginAtlasUser service on login', async () =>
        {
            vi.mocked(AtlasAuthService.loginAtlasUser).mockResolvedValue({ success: true });

            const { getByText } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            await act(async () =>
            {
                getByText('Login').click();
            });

            await waitFor(() =>
            {
                expect(AtlasAuthService.loginAtlasUser).toHaveBeenCalledWith(
                    'test@stitchesafrica.com',
                    'password123'
                );
            });
        });

        it('should set error when login fails', async () =>
        {
            vi.mocked(AtlasAuthService.loginAtlasUser).mockResolvedValue({
                success: false,
                error: 'Invalid credentials',
            });

            const { getByText, getByTestId } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            await act(async () =>
            {
                getByText('Login').click();
            });

            await waitFor(() =>
            {
                expect(getByTestId('error')).toHaveTextContent('Invalid credentials');
            });
        });
    });

    describe('Logout method', () =>
    {
        it('should call logoutAtlasUser service on logout', async () =>
        {
            vi.mocked(AtlasAuthService.logoutAtlasUser).mockResolvedValue({ success: true });

            const { getByText } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            await act(async () =>
            {
                getByText('Logout').click();
            });

            await waitFor(() =>
            {
                expect(AtlasAuthService.logoutAtlasUser).toHaveBeenCalled();
            });
        });

        it('should set error when logout fails', async () =>
        {
            vi.mocked(AtlasAuthService.logoutAtlasUser).mockResolvedValue({
                success: false,
                error: 'Logout failed',
            });

            const { getByText, getByTestId } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            await act(async () =>
            {
                getByText('Logout').click();
            });

            await waitFor(() =>
            {
                expect(getByTestId('error')).toHaveTextContent('Logout failed');
            });
        });
    });

    describe('Error handling', () =>
    {
        it('should clear error when clearError is called', async () =>
        {
            vi.mocked(AtlasAuthService.loginAtlasUser).mockResolvedValue({
                success: false,
                error: 'Test error',
            });

            const { getByText, getByTestId } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            // Trigger an error
            await act(async () =>
            {
                getByText('Login').click();
            });

            await waitFor(() =>
            {
                expect(getByTestId('error')).toHaveTextContent('Test error');
            });

            // Clear the error
            await act(async () =>
            {
                getByText('Clear Error').click();
            });

            await waitFor(() =>
            {
                expect(getByTestId('error')).toHaveTextContent('null');
            });
        });

        it('should handle error when Firestore listener fails', async () =>
        {
            const mockUser = {
                uid: 'test-uid-123',
                email: 'test@stitchesafrica.com',
            } as User;

            const { getByTestId } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            // Simulate auth state change to authenticated
            await act(async () =>
            {
                if (authStateCallback)
                {
                    authStateCallback(mockUser);
                }
            });

            // Simulate Firestore error
            await act(async () =>
            {
                if (firestoreErrorCallback)
                {
                    firestoreErrorCallback(new Error('Firestore error'));
                }
            });

            // Wait for error to be set
            await waitFor(() =>
            {
                expect(getByTestId('error')).toHaveTextContent('Failed to sync user data. Please refresh the page.');
            });
        });

        it('should handle role changes in real-time', async () =>
        {
            const mockUser = {
                uid: 'test-uid-123',
                email: 'test@stitchesafrica.com',
            } as User;

            const initialAtlasUser = {
                uid: 'test-uid-123',
                email: 'test@stitchesafrica.com',
                fullName: 'Test User',
                role: 'superadmin' as const,
                isAtlasUser: true,
                createdAt: {} as any,
                updatedAt: {} as any,
            };

            const updatedAtlasUser = {
                ...initialAtlasUser,
                role: 'sales_lead' as const,
            };

            const { getByTestId } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            // Simulate auth state change to authenticated
            await act(async () =>
            {
                if (authStateCallback)
                {
                    authStateCallback(mockUser);
                }
            });

            await waitFor(() =>
            {
                expect(getByTestId('user')).toHaveTextContent('test-uid-123');
            });

            // Simulate initial Firestore document snapshot
            await act(async () =>
            {
                if (firestoreCallback)
                {
                    const mockSnapshot = {
                        exists: () => true,
                        data: () => initialAtlasUser,
                    };
                    firestoreCallback(mockSnapshot);
                }
            });

            await waitFor(() =>
            {
                expect(getByTestId('atlasUser')).toHaveTextContent('test-uid-123');
            });

            // Simulate role change
            await act(async () =>
            {
                if (firestoreCallback)
                {
                    const mockSnapshot = {
                        exists: () => true,
                        data: () => updatedAtlasUser,
                    };
                    firestoreCallback(mockSnapshot);
                }
            });

            // The user should still be authenticated but with updated role
            await waitFor(() =>
            {
                expect(getByTestId('user')).toHaveTextContent('test-uid-123');
                expect(getByTestId('atlasUser')).toHaveTextContent('test-uid-123');
            });
        });

        it('should sign out user when document does not exist', async () =>
        {
            const mockUser = {
                uid: 'test-uid-123',
                email: 'test@stitchesafrica.com',
            } as User;

            vi.mocked(AtlasAuthService.logoutAtlasUser).mockResolvedValue({ success: true });

            const { getByTestId } = render(
                <AtlasAuthProvider>
                    <TestComponent />
                </AtlasAuthProvider>
            );

            // Simulate auth state change to authenticated
            await act(async () =>
            {
                if (authStateCallback)
                {
                    authStateCallback(mockUser);
                }
            });

            // Simulate Firestore document not existing
            await act(async () =>
            {
                if (firestoreCallback)
                {
                    const mockSnapshot = {
                        exists: () => false,
                        data: () => null,
                    };
                    firestoreCallback(mockSnapshot);
                }
            });

            // Wait for error to be set
            await waitFor(() =>
            {
                expect(getByTestId('error')).toHaveTextContent(
                    'Account not found. Please contact your administrator.'
                );
            });

            // Verify logout was called
            expect(AtlasAuthService.logoutAtlasUser).toHaveBeenCalled();
        });
    });
});
