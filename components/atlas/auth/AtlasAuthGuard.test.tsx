import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { AtlasAuthGuard } from './AtlasAuthGuard';
import { useAtlasAuth } from '@/contexts/AtlasAuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { AtlasTeamService } from '@/lib/atlas/team-service';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    usePathname: vi.fn(),
}));

// Mock AtlasAuthContext
vi.mock('@/contexts/AtlasAuthContext', () => ({
    useAtlasAuth: vi.fn(),
}));

// Mock AtlasTeamService
vi.mock('@/lib/atlas/team-service', () => ({
    AtlasTeamService: {
        hasAccessToDashboard: vi.fn(),
    },
}));

// Mock LoadingSpinner
vi.mock('@/components/LoadingSpinner', () => ({
    default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

describe('AtlasAuthGuard', () =>
{
    const mockPush = vi.fn();
    const mockRouter = {
        push: mockPush,
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    };

    beforeEach(() =>
    {
        vi.clearAllMocks();
        vi.mocked(useRouter).mockReturnValue(mockRouter);
        vi.mocked(usePathname).mockReturnValue('/atlas');
        vi.mocked(AtlasTeamService.hasAccessToDashboard).mockReturnValue(true);
    });

    describe('Loading state', () =>
    {
        it('should show loading spinner when loading is true', () =>
        {
            vi.mocked(useAtlasAuth).mockReturnValue({
                user: null,
                atlasUser: null,
                loading: true,
                error: null,
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            const { getByTestId } = render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            expect(getByTestId('loading-spinner')).toBeInTheDocument();
        });
    });

    describe('Redirect behavior for unauthenticated users', () =>
    {
        it('should redirect to /atlas/auth when user is not authenticated', async () =>
        {
            vi.mocked(useAtlasAuth).mockReturnValue({
                user: null,
                atlasUser: null,
                loading: false,
                error: null,
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            await waitFor(() =>
            {
                expect(mockPush).toHaveBeenCalledWith('/atlas/auth');
            });
        });

        it('should show loading spinner while redirecting unauthenticated user', () =>
        {
            vi.mocked(useAtlasAuth).mockReturnValue({
                user: null,
                atlasUser: null,
                loading: false,
                error: null,
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            const { getByTestId } = render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            expect(getByTestId('loading-spinner')).toBeInTheDocument();
        });
    });

    describe('Redirect behavior for non-Atlas users', () =>
    {
        it('should redirect to /atlas/auth when atlasUser is null', async () =>
        {
            vi.mocked(useAtlasAuth).mockReturnValue({
                user: { uid: 'test-uid' } as any,
                atlasUser: null,
                loading: false,
                error: null,
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            await waitFor(() =>
            {
                expect(mockPush).toHaveBeenCalledWith('/atlas/auth');
            });
        });

        it('should redirect to /atlas/auth when isAtlasUser is false', async () =>
        {
            vi.mocked(useAtlasAuth).mockReturnValue({
                user: { uid: 'test-uid' } as any,
                atlasUser: {
                    uid: 'test-uid',
                    email: 'test@example.com',
                    fullName: 'Test User',
                    role: 'superadmin',
                    isAtlasUser: false,
                    createdAt: {} as any,
                    updatedAt: {} as any,
                },
                loading: false,
                error: null,
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            await waitFor(() =>
            {
                expect(mockPush).toHaveBeenCalledWith('/atlas/auth');
            });
        });

        it('should show loading spinner while redirecting non-Atlas user', () =>
        {
            vi.mocked(useAtlasAuth).mockReturnValue({
                user: { uid: 'test-uid' } as any,
                atlasUser: null,
                loading: false,
                error: null,
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            const { getByTestId } = render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            expect(getByTestId('loading-spinner')).toBeInTheDocument();
        });
    });

    describe('Successful access for authorized users', () =>
    {
        it('should render children when user is authenticated and has Atlas access', () =>
        {
            vi.mocked(useAtlasAuth).mockReturnValue({
                user: { uid: 'test-uid' } as any,
                atlasUser: {
                    uid: 'test-uid',
                    email: 'test@stitchesafrica.com',
                    fullName: 'Test User',
                    role: 'superadmin',
                    isAtlasUser: true,
                    createdAt: {} as any,
                    updatedAt: {} as any,
                },
                loading: false,
                error: null,
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            const { getByText, queryByTestId } = render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            expect(getByText('Protected Content')).toBeInTheDocument();
            expect(queryByTestId('loading-spinner')).not.toBeInTheDocument();
        });

        it('should not redirect when user is authorized', () =>
        {
            vi.mocked(useAtlasAuth).mockReturnValue({
                user: { uid: 'test-uid' } as any,
                atlasUser: {
                    uid: 'test-uid',
                    email: 'test@stitchesafrica.com',
                    fullName: 'Test User',
                    role: 'superadmin',
                    isAtlasUser: true,
                    createdAt: {} as any,
                    updatedAt: {} as any,
                },
                loading: false,
                error: null,
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            expect(mockPush).not.toHaveBeenCalled();
        });
    });

    describe('Error handling', () =>
    {
        it('should display error message when error is present', () =>
        {
            vi.mocked(useAtlasAuth).mockReturnValue({
                user: null,
                atlasUser: null,
                loading: false,
                error: 'You are not authorized to access Atlas. Please contact your administrator.',
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            const { getByText } = render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            expect(getByText('Access Denied')).toBeInTheDocument();
            expect(
                getByText('You are not authorized to access Atlas. Please contact your administrator.')
            ).toBeInTheDocument();
        });

        it('should show "Go to Login" button when error is present', () =>
        {
            vi.mocked(useAtlasAuth).mockReturnValue({
                user: null,
                atlasUser: null,
                loading: false,
                error: 'Test error message',
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            const { getByText } = render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            const loginButton = getByText('Go to Login');
            expect(loginButton).toBeInTheDocument();

            // Click the button
            loginButton.click();

            expect(mockPush).toHaveBeenCalledWith('/atlas/auth');
        });

        it('should not render protected content when error is present', () =>
        {
            vi.mocked(useAtlasAuth).mockReturnValue({
                user: null,
                atlasUser: null,
                loading: false,
                error: 'Test error',
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            const { queryByText } = render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            expect(queryByText('Protected Content')).not.toBeInTheDocument();
        });
    });

    describe('Role-based access control', () =>
    {
        it('should allow access when user has permission for the dashboard', () =>
        {
            vi.mocked(usePathname).mockReturnValue('/atlas/vendor-sales');
            vi.mocked(AtlasTeamService.hasAccessToDashboard).mockReturnValue(true);

            vi.mocked(useAtlasAuth).mockReturnValue({
                user: { uid: 'test-uid' } as any,
                atlasUser: {
                    uid: 'test-uid',
                    email: 'test@stitchesafrica.com',
                    fullName: 'Test User',
                    role: 'sales_lead',
                    isAtlasUser: true,
                    createdAt: {} as any,
                    updatedAt: {} as any,
                },
                loading: false,
                error: null,
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            const { getByText } = render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            expect(getByText('Protected Content')).toBeInTheDocument();
            expect(mockPush).not.toHaveBeenCalled();
        });

        it('should redirect to overview when user does not have permission for the dashboard', async () =>
        {
            vi.mocked(usePathname).mockReturnValue('/atlas/team');
            vi.mocked(AtlasTeamService.hasAccessToDashboard).mockReturnValue(false);

            vi.mocked(useAtlasAuth).mockReturnValue({
                user: { uid: 'test-uid' } as any,
                atlasUser: {
                    uid: 'test-uid',
                    email: 'test@stitchesafrica.com',
                    fullName: 'Test User',
                    role: 'sales_lead',
                    isAtlasUser: true,
                    createdAt: {} as any,
                    updatedAt: {} as any,
                },
                loading: false,
                error: null,
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            await waitFor(() =>
            {
                expect(mockPush).toHaveBeenCalledWith('/atlas');
            });
        });

        it('should call hasAccessToDashboard with correct parameters', () =>
        {
            const pathname = '/atlas/logistics';
            vi.mocked(usePathname).mockReturnValue(pathname);
            vi.mocked(AtlasTeamService.hasAccessToDashboard).mockReturnValue(true);

            vi.mocked(useAtlasAuth).mockReturnValue({
                user: { uid: 'test-uid' } as any,
                atlasUser: {
                    uid: 'test-uid',
                    email: 'test@stitchesafrica.com',
                    fullName: 'Test User',
                    role: 'logistics_lead',
                    isAtlasUser: true,
                    createdAt: {} as any,
                    updatedAt: {} as any,
                },
                loading: false,
                error: null,
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            expect(AtlasTeamService.hasAccessToDashboard).toHaveBeenCalledWith(
                'logistics_lead',
                pathname
            );
        });

        it('should not render protected content for unauthorized dashboard access', async () =>
        {
            vi.mocked(usePathname).mockReturnValue('/atlas/team');
            vi.mocked(AtlasTeamService.hasAccessToDashboard).mockReturnValue(false);

            vi.mocked(useAtlasAuth).mockReturnValue({
                user: { uid: 'test-uid' } as any,
                atlasUser: {
                    uid: 'test-uid',
                    email: 'test@stitchesafrica.com',
                    fullName: 'Test User',
                    role: 'brand_lead',
                    isAtlasUser: true,
                    createdAt: {} as any,
                    updatedAt: {} as any,
                },
                loading: false,
                error: null,
                register: vi.fn(),
                login: vi.fn(),
                logout: vi.fn(),
                clearError: vi.fn(),
            });

            render(
                <AtlasAuthGuard>
                    <div>Protected Content</div>
                </AtlasAuthGuard>
            );

            await waitFor(() =>
            {
                expect(mockPush).toHaveBeenCalledWith('/atlas');
            });
        });
    });
});
