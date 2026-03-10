/**
 * Atlas Dashboard - Invitation Acceptance Page
 * Handles invitation validation and user account creation/login flow
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 14.1, 14.2, 14.3, 14.5
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Mail, ShieldAlert } from 'lucide-react';
import InvitationCreateAccountForm from '@/components/atlas/InvitationCreateAccountForm';
import InvitationLoginForm from '@/components/atlas/InvitationLoginForm';

/**
 * Helper function to get detailed error messages for specific error codes
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
interface ErrorMessageDetails
{
    title: string;
    description: string;
    action: string;
    actionLink?: string;
    icon: 'error' | 'warning' | 'info' | 'domain';
}

function getErrorMessage(code?: string, error?: string): ErrorMessageDetails
{
    switch (code)
    {
        case 'INVALID_TOKEN':
        case 'MALFORMED':
        case 'INVALID_SIGNATURE':
            return {
                title: 'Invalid Invitation Link',
                description: 'This invitation link is invalid or has been tampered with. The link may have been copied incorrectly or modified. Please contact your administrator for a new invitation link.',
                action: 'Contact Support',
                actionLink: '/support',
                icon: 'error'
            };
        case 'EXPIRED':
            return {
                title: 'Invitation Expired',
                description: 'This invitation has expired. Invitations are valid for 7 days from the time they are sent. Please request a new invitation from your administrator to continue.',
                action: 'Request New Invitation',
                actionLink: '/support',
                icon: 'warning'
            };
        case 'ALREADY_USED':
            return {
                title: 'Invitation Already Used',
                description: 'This invitation has already been accepted and cannot be used again. If you already have an account, please sign in directly using the login page.',
                action: 'Go to Login',
                actionLink: '/atlas/auth',
                icon: 'info'
            };
        case 'NOT_FOUND':
            return {
                title: 'Invitation Not Found',
                description: 'This invitation could not be found in our system. It may have been deleted, revoked, or never existed. Please contact your administrator for assistance.',
                action: 'Contact Support',
                actionLink: '/support',
                icon: 'error'
            };
        case 'INVALID_DOMAIN':
            return {
                title: 'Invalid Email Domain',
                description: 'Only STITCHES Africa team members with company email addresses (@stitchesafrica.com or @stitchesafrica.pro) are allowed to access Atlas. Please use your company email address.',
                action: 'Contact Support',
                actionLink: '/support',
                icon: 'domain'
            };
        case 'WRONG_SYSTEM':
            return {
                title: 'Wrong System',
                description: 'This invitation is not for the Atlas system. Please check that you are using the correct invitation link for Atlas.',
                action: 'Contact Support',
                actionLink: '/support',
                icon: 'error'
            };
        case 'MISSING_FIELDS':
            return {
                title: 'Invalid Invitation Data',
                description: 'This invitation is missing required information. The invitation may be corrupted. Please contact your administrator for a new invitation link.',
                action: 'Contact Support',
                actionLink: '/support',
                icon: 'error'
            };
        default:
            return {
                title: 'Validation Error',
                description: error || 'An unexpected error occurred while validating your invitation. Please try again or contact support if the problem persists.',
                action: 'Try Again',
                icon: 'error'
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
    code?: 'NOT_FOUND' | 'EXPIRED' | 'ALREADY_USED' | 'INVALID_TOKEN' | 'INVALID_DOMAIN' | 'MALFORMED' | 'INVALID_SIGNATURE' | 'WRONG_SYSTEM' | 'MISSING_FIELDS';
}

interface InvitationPageState
{
    loading: boolean;
    validation: InvitationValidationResult | null;
    step: 'validating' | 'create_account' | 'login' | 'error' | 'success';
    error: string | null;
}

function AtlasInvitationAcceptancePageContent()
{
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = params.token as string;
    const forceLogin = searchParams.get('force_login') === 'true';

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

    // Also check if user is already signed in (client-side check)
    useEffect(() =>
    {
        const checkCurrentUser = async () =>
        {
            try
            {
                const { auth } = await import('@/firebase');
                const { onAuthStateChanged } = await import('firebase/auth');
                
                const unsubscribe = onAuthStateChanged(auth, async (user) =>
                {
                    if (user && state.validation?.invitation)
                    {
                        // If user is signed in and email matches invitation, redirect to sign in page
                        if (user.email === state.validation.invitation.email)
                        {
                            console.log('[Invitation Page] User already signed in, redirecting to sign in page', {
                                email: user.email
                            });
                            router.replace(`/atlas/auth?invite=${encodeURIComponent(token)}`);
                        }
                    }
                });

                return () => unsubscribe();
            } catch (error)
            {
                console.error('[Invitation Page] Error checking current user', error);
            }
        };

        checkCurrentUser();
    }, [state.validation, token, router]);

    // Auto-redirect to dashboard after success
    useEffect(() =>
    {
        if (state.step === 'success')
        {
            // Wait a moment to show success message, then redirect
            const redirectTimer = setTimeout(() =>
            {
                console.log('[Invitation Page] Redirecting to Atlas dashboard');
                router.push('/atlas');
            }, 2000); // 2 second delay to show success message

            return () => clearTimeout(redirectTimer);
        }
    }, [state.step, router]);

    const validateInvitation = async () =>
    {
        try
        {
            setState(prev => ({ ...prev, loading: true, error: null }));

            console.log('[Invitation Page] Validating invitation', {
                token: token ? `${token.substring(0, 10)}...` : 'missing',
                timestamp: new Date().toISOString()
            });

            const response = await fetch(`/api/atlas/invites/validate/${token}`);
            const data = await response.json();

            console.log('[Invitation Page] Validation response', {
                ok: response.ok,
                status: response.status,
                valid: data.valid,
                code: data.code,
                hasInvitation: !!data.invitation
            });

            if (!response.ok || !data.valid)
            {
                console.error('[Invitation Page] Validation failed', {
                    status: response.status,
                    error: data.error,
                    code: data.code
                });

                setState(prev => ({
                    ...prev,
                    loading: false,
                    step: 'error',
                    error: data.error || 'Invalid invitation',
                    validation: data
                }));
                return;
            }

            console.log('[Invitation Page] Validation successful', {
                email: data.invitation.email,
                role: data.invitation.role,
                status: data.invitation.status
            });

            // Check if user already exists in Firebase (unless force_login is set)
            const userExists = forceLogin || await checkUserExists(data.invitation.email);

            console.log('[Invitation Page] Determining flow', {
                userExists,
                forceLogin,
                email: data.invitation.email,
                nextStep: userExists ? 'redirect_to_signin' : 'create_account'
            });

            // If user exists or force_login is set, redirect to sign in page with invitation token
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
                router.replace(`/atlas/auth?invite=${encodeURIComponent(token)}`);
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
            console.error('[Invitation Page] Validation error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });

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
            console.log('[Invitation Page] Checking user existence', { email });

            // Import Firebase auth functions dynamically
            const { fetchSignInMethodsForEmail } = await import('firebase/auth');
            const { auth } = await import('@/firebase');

            const signInMethods = await fetchSignInMethodsForEmail(auth, email);
            const exists = signInMethods.length > 0;

            console.log('[Invitation Page] Firebase user check complete', {
                email,
                signInMethodsCount: signInMethods.length,
                signInMethods: signInMethods,
                exists
            });

            // If user exists, log and return true
            if (exists)
            {
                console.log('[Invitation Page] User exists in Firebase Auth - will redirect to sign in');
            }

            return exists;
        } catch (error)
        {
            console.error('[Invitation Page] Error checking user existence', {
                email,
                error: error instanceof Error ? error.message : 'Unknown error',
                errorCode: (error as any)?.code,
                errorName: (error as any)?.name,
                stack: error instanceof Error ? error.stack : undefined
            });

            // Check if it's a specific Firebase error that indicates user doesn't exist
            // Firebase returns 'auth/user-not-found' when user doesn't exist, which is not an error
            // but a valid response. However, fetchSignInMethodsForEmail doesn't throw for non-existent users
            // It just returns an empty array
            
            // If we get here, it's a real error (network, permission, etc.)
            // For safety, default to create account flow
            console.log('[Invitation Page] Error occurred, defaulting to create account flow');
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
     * Get appropriate icon for error state
     * Requirements: 7.5
     */
    const getErrorIcon = (iconType: 'error' | 'warning' | 'info' | 'domain') =>
    {
        switch (iconType)
        {
            case 'warning':
                return <AlertTriangle className="h-12 w-12 text-orange-500" />;
            case 'info':
                return <CheckCircle className="h-12 w-12 text-blue-500" />;
            case 'domain':
                return <ShieldAlert className="h-12 w-12 text-red-500" />;
            case 'error':
            default:
                return <XCircle className="h-12 w-12 text-red-500" />;
        }
    };

    const getRoleDisplayName = (role: string) =>
    {
        const roleMap: Record<string, string> = {
            'superadmin': 'Super Admin',
            'admin': 'Admin',
            'analyst': 'Analyst',
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
        const errorDetails = getErrorMessage(state.validation?.code, state.error || undefined);

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 pb-6">
                        <div className="flex flex-col items-center space-y-6">
                            {/* Error Icon */}
                            <div className="flex items-center justify-center">
                                {getErrorIcon(errorDetails.icon)}
                            </div>

                            {/* Error Title and Description */}
                            <div className="text-center space-y-3">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {errorDetails.title}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {errorDetails.description}
                                </p>
                            </div>

                            {/* Contextual Alert Messages */}
                            {state.validation?.code === 'EXPIRED' && (
                                <Alert className="w-full">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Next Steps:</strong> Contact your administrator to request a new invitation link.
                                        Invitations expire after 7 days for security purposes.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {state.validation?.code === 'INVALID_DOMAIN' && (
                                <Alert className="w-full">
                                    <ShieldAlert className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Access Restricted:</strong> Atlas is only accessible to STITCHES Africa team members
                                        with company email addresses (@stitchesafrica.com or @stitchesafrica.pro).
                                    </AlertDescription>
                                </Alert>
                            )}

                            {state.validation?.code === 'NOT_FOUND' && (
                                <Alert className="w-full">
                                    <XCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Invitation Missing:</strong> This invitation may have been deleted or revoked by an administrator.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {(state.validation?.code === 'INVALID_TOKEN' ||
                                state.validation?.code === 'MALFORMED' ||
                                state.validation?.code === 'INVALID_SIGNATURE') && (
                                    <Alert className="w-full">
                                        <XCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            <strong>Link Error:</strong> The invitation link appears to be corrupted or incomplete.
                                            Please ensure you copied the entire link from your email.
                                        </AlertDescription>
                                    </Alert>
                                )}

                            {state.validation?.code === 'WRONG_SYSTEM' && (
                                <Alert className="w-full">
                                    <XCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>System Mismatch:</strong> This invitation is for a different system.
                                        Please use the correct invitation link for Atlas.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {state.validation?.code === 'MISSING_FIELDS' && (
                                <Alert className="w-full">
                                    <XCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Data Error:</strong> The invitation is missing required information.
                                        Please request a new invitation from your administrator.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {state.validation?.code === 'ALREADY_USED' && (
                                <Alert className="w-full">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Already Accepted:</strong> This invitation has been used.
                                        If you have an account, please sign in using the login page.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Action Buttons */}
                            <div className="w-full space-y-3">
                                {errorDetails.actionLink ? (
                                    <Button
                                        onClick={() => router.push(errorDetails.actionLink!)}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {errorDetails.action}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleRetry}
                                        variant="outline"
                                        className="w-full"
                                        size="lg"
                                    >
                                        {errorDetails.action}
                                    </Button>
                                )}

                                {/* Secondary action for ALREADY_USED */}
                                {state.validation?.code === 'ALREADY_USED' && (
                                    <Button
                                        onClick={() => router.push('/atlas/auth')}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <Mail className="mr-2 h-4 w-4" />
                                        Sign In to Atlas
                                    </Button>
                                )}
                            </div>

                            {/* Contact Support Link */}
                            <div className="text-center pt-4 border-t w-full">
                                <p className="text-sm text-gray-500">
                                    Need help? {' '}
                                    <a
                                        href="/support"
                                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                                    >
                                        Contact Support
                                    </a>
                                </p>
                            </div>
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
                                    Welcome to Atlas!
                                </h3>
                                <p className="text-sm text-gray-600 mt-2">
                                    Your account has been successfully set up. You'll be redirected to your dashboard shortly.
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push('/atlas')}
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
                    <CardTitle>Join STITCHES Africa Atlas</CardTitle>
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

export default function AtlasInvitationAcceptancePage()
{
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">Loading...</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        }>
            <AtlasInvitationAcceptancePageContent />
        </Suspense>
    );
}
