/**
 * Collections Dashboard - Invitation Acceptance Page
 * Handles invitation validation and user account creation/login flow
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 14.1, 14.2, 14.3, 14.5
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Mail, HelpCircle } from 'lucide-react';
import InvitationCreateAccountForm from '@/components/collections/InvitationCreateAccountForm';
import InvitationLoginForm from '@/components/collections/InvitationLoginForm';

/**
 * Error message configuration for different error codes
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
interface ErrorMessageConfig
{
    title: string;
    description: string;
    actionText: string;
    actionHref?: string;
    actionHandler?: () => void;
    icon: 'error' | 'warning' | 'info';
    showContactSupport: boolean;
    additionalInfo?: string;
}

/**
 * Get error message configuration based on error code
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
function getErrorMessage(code?: string, error?: string): ErrorMessageConfig
{
    switch (code)
    {
        case 'INVALID_TOKEN':
            return {
                title: 'Invalid Invitation Link',
                description: 'This invitation link is invalid or has been tampered with. The link may have been copied incorrectly or modified.',
                actionText: 'Contact Administrator',
                actionHref: '/support',
                icon: 'error',
                showContactSupport: true,
                additionalInfo: 'Please request a new invitation link from your administrator to continue.'
            };

        case 'EXPIRED':
            return {
                title: 'Invitation Expired',
                description: 'This invitation has expired. Invitations are valid for 7 days from the time they are sent.',
                actionText: 'Request New Invitation',
                actionHref: '/support',
                icon: 'warning',
                showContactSupport: true,
                additionalInfo: 'Contact your administrator to receive a new invitation link.'
            };

        case 'ALREADY_USED':
            return {
                title: 'Invitation Already Used',
                description: 'This invitation has already been accepted. If you already have an account, you can sign in directly.',
                actionText: 'Go to Login',
                actionHref: '/collections/auth',
                icon: 'info',
                showContactSupport: false,
                additionalInfo: 'If you\'re having trouble accessing your account, please contact support.'
            };

        case 'NOT_FOUND':
            return {
                title: 'Invitation Not Found',
                description: 'This invitation could not be found in our system. It may have been deleted or revoked by an administrator.',
                actionText: 'Contact Administrator',
                actionHref: '/support',
                icon: 'error',
                showContactSupport: true,
                additionalInfo: 'Please verify the invitation link with your administrator.'
            };

        default:
            return {
                title: 'Validation Error',
                description: error || 'An unexpected error occurred while validating your invitation. This may be a temporary issue.',
                actionText: 'Try Again',
                icon: 'error',
                showContactSupport: true,
                additionalInfo: 'If the problem persists, please contact support for assistance.'
            };
    }
}

interface InvitationData
{
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    expiresAt: any;
    createdAt: any;
}

interface InvitationValidationResult
{
    valid: boolean;
    invitation?: InvitationData;
    error?: string;
    code?: 'NOT_FOUND' | 'EXPIRED' | 'ALREADY_USED' | 'INVALID_TOKEN';
}

interface InvitationPageState
{
    loading: boolean;
    validation: InvitationValidationResult | null;
    step: 'validating' | 'create_account' | 'login' | 'error' | 'success';
    error: string | null;
}

export default function CollectionsInvitationAcceptancePage()
{
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [state, setState] = useState<InvitationPageState>({
        loading: true,
        validation: null,
        step: 'validating',
        error: null
    });

    // Validate invitation token on page load
    useEffect(() =>
    {
        if (!token)
        {
            setState(prev => ({
                ...prev,
                loading: false,
                step: 'error',
                error: 'Invalid invitation link'
            }));
            return;
        }

        validateInvitation();
    }, [token]);

    // Auto-redirect to dashboard after success
    useEffect(() =>
    {
        if (state.step === 'success')
        {
            // Wait a moment to show success message, then redirect
            const redirectTimer = setTimeout(() =>
            {
                console.log('[Invitation Page] Redirecting to Collections dashboard');
                router.push('/collections');
            }, 2000); // 2 second delay to show success message

            return () => clearTimeout(redirectTimer);
        }
    }, [state.step, router]);

    const validateInvitation = async () =>
    {
        try
        {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const response = await fetch(`/api/collections/invites/validate/${token}`);
            const data = await response.json();

            if (!response.ok)
            {
                throw new Error(data.error || 'Failed to validate invitation');
            }

            if (!data.valid)
            {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    step: 'error',
                    error: data.error || 'Invalid invitation',
                    validation: data
                }));
                return;
            }

            // Check if user already exists in Firebase
            const userExists = await checkUserExists(data.invitation.email);

            console.log('[Invitation Page] Determining flow', {
                userExists,
                email: data.invitation.email,
                nextStep: userExists ? 'redirect_to_signin' : 'create_account'
            });

            // If user exists, redirect to sign in page with invitation token
            if (userExists)
            {
                console.log('[Invitation Page] User exists, redirecting to sign in', {
                    email: data.invitation.email,
                    token: token.substring(0, 20) + '...'
                });
                
                // Set loading state to prevent showing create account form
                setState(prev => ({
                    ...prev,
                    loading: true,
                    step: 'validating'
                }));
                
                // Use replace instead of push to avoid adding to history
                router.replace(`/collections/auth?invite=${encodeURIComponent(token)}`);
                return;
            }

            setState(prev => ({
                ...prev,
                loading: false,
                validation: data,
                step: 'create_account'
            }));

        } catch (error)
        {
            console.error('Invitation validation error:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                step: 'error',
                error: error instanceof Error ? error.message : 'Failed to validate invitation'
            }));
        }
    };

    const checkUserExists = async (email: string): Promise<boolean> =>
    {
        try
        {
            // Import Firebase auth functions dynamically
            const { fetchSignInMethodsForEmail } = await import('firebase/auth');
            const { auth } = await import('@/firebase');

            const signInMethods = await fetchSignInMethodsForEmail(auth, email);
            return signInMethods.length > 0;
        } catch (error)
        {
            console.error('Error checking user existence:', error);
            // If we can't check, default to create account flow
            return false;
        }
    };

    const handleAccountCreated = () =>
    {
        setState(prev => ({ ...prev, step: 'success' }));
    };

    const handleLoginSuccess = () =>
    {
        setState(prev => ({ ...prev, step: 'success' }));
    };

    const handleRetry = () =>
    {
        setState(prev => ({
            ...prev,
            loading: true,
            step: 'validating',
            error: null
        }));
        validateInvitation();
    };

    /**
     * Render error icon based on error type
     * Requirements: 7.5
     */
    const renderErrorIcon = (iconType: 'error' | 'warning' | 'info') =>
    {
        switch (iconType)
        {
            case 'warning':
                return <AlertTriangle className="h-16 w-16 text-orange-500" />;
            case 'info':
                return <CheckCircle className="h-16 w-16 text-blue-500" />;
            case 'error':
            default:
                return <XCircle className="h-16 w-16 text-red-500" />;
        }
    };

    const getRoleDisplayName = (role: string) =>
    {
        const roleMap: Record<string, string> = {
            'superadmin': 'Super Admin',
            'editor': 'Editor',
            'viewer': 'Viewer'
        };
        return roleMap[role] || role;
    };

    if (state.loading || state.step === 'validating')
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">Validating Invitation</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Please wait while we verify your invitation...
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (state.step === 'error')
    {
        const errorConfig = getErrorMessage(state.validation?.code, state.error || undefined);

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-lg">
                    <CardContent className="pt-8 pb-8">
                        <div className="flex flex-col items-center space-y-6">
                            {/* Error Icon - Requirements: 7.5 */}
                            <div className="flex items-center justify-center">
                                {renderErrorIcon(errorConfig.icon)}
                            </div>

                            {/* Error Title and Description - Requirements: 7.1, 7.2, 7.3 */}
                            <div className="text-center space-y-3 max-w-md">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {errorConfig.title}
                                </h2>
                                <p className="text-base text-gray-600 leading-relaxed">
                                    {errorConfig.description}
                                </p>
                            </div>

                            {/* Additional Information - Requirements: 7.3 */}
                            {errorConfig.additionalInfo && (
                                <Alert className="w-full">
                                    <HelpCircle className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        {errorConfig.additionalInfo}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Action Buttons - Requirements: 7.3, 7.4 */}
                            <div className="w-full space-y-3">
                                {errorConfig.actionHref ? (
                                    <Button
                                        onClick={() => router.push(errorConfig.actionHref!)}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {errorConfig.actionText}
                                    </Button>
                                ) : errorConfig.actionHandler ? (
                                    <Button
                                        onClick={errorConfig.actionHandler}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {errorConfig.actionText}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleRetry}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {errorConfig.actionText}
                                    </Button>
                                )}

                                {/* Secondary action for ALREADY_USED case */}
                                {state.validation?.code === 'ALREADY_USED' && (
                                    <Button
                                        onClick={() => router.push('/support')}
                                        variant="outline"
                                        className="w-full"
                                        size="lg"
                                    >
                                        <HelpCircle className="h-4 w-4 mr-2" />
                                        Need Help?
                                    </Button>
                                )}
                            </div>

                            {/* Contact Support Section - Requirements: 7.4, 7.5 */}
                            {errorConfig.showContactSupport && (
                                <div className="w-full pt-4 border-t border-gray-200">
                                    <div className="flex flex-col items-center space-y-3">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Mail className="h-4 w-4 mr-2" />
                                            <span>Need assistance?</span>
                                        </div>
                                        <Button
                                            onClick={() => router.push('/support')}
                                            variant="link"
                                            className="text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Contact Support Team
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Debug Information (only in development) */}
                            {process.env.NODE_ENV === 'development' && state.validation?.code && (
                                <div className="w-full pt-4 border-t border-gray-200">
                                    <details className="text-xs text-gray-500">
                                        <summary className="cursor-pointer hover:text-gray-700">
                                            Debug Information
                                        </summary>
                                        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 font-mono">
                                            <p>Error Code: {state.validation.code}</p>
                                            <p>Error Message: {state.error}</p>
                                        </div>
                                    </details>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (state.step === 'success')
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center space-y-4">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Welcome to Collections!
                                </h3>
                                <p className="text-sm text-gray-600 mt-2">
                                    Your account has been successfully set up. You'll be redirected to your dashboard shortly.
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push('/collections')}
                                className="w-full"
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>Join STITCHES Africa Collections</CardTitle>
                    <CardDescription>
                        {state.step === 'create_account'
                            ? 'Create your account to get started'
                            : 'Sign in to continue'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {state.validation?.invitation && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm">
                                <p className="font-medium text-blue-900">
                                    Invitation for: {state.validation.invitation.name}
                                </p>
                                <p className="text-blue-700">
                                    Role: {getRoleDisplayName(state.validation.invitation.role)}
                                </p>
                                <p className="text-blue-700">
                                    Email: {state.validation.invitation.email}
                                </p>
                            </div>
                        </div>
                    )}

                    {state.step === 'create_account' && state.validation?.invitation && (
                        <InvitationCreateAccountForm
                            invitation={state.validation.invitation}
                            token={token}
                            onSuccess={handleAccountCreated}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
