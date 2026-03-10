/**
 * Promotional Events - Invitation Acceptance Page
 * Handles invitation validation and user account creation flow
 * Requirements: 1.3
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Mail, HelpCircle } from 'lucide-react';
import { PromotionalInvitationService, InvitationValidationResult } from '@/lib/promotionals/invitation-service';
import type { PromotionalInvitation } from '@/types/promotionals';

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
                actionHref: '/promotionals/auth',
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

interface InvitationPageState
{
    loading: boolean;
    validation: InvitationValidationResult | null;
    step: 'validating' | 'create_account' | 'error' | 'success';
    error: string | null;
}

export default function PromotionalInvitationAcceptancePage()
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
            const redirectTimer = setTimeout(() =>
            {
                console.log('[Promotional Invitation] Redirecting to dashboard');
                router.push('/promotionals');
            }, 2000);

            return () => clearTimeout(redirectTimer);
        }
    }, [state.step, router]);

    const validateInvitation = async () =>
    {
        try
        {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const validation = await PromotionalInvitationService.validateInvitation(token);

            if (!validation.isValid)
            {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    step: 'error',
                    error: validation.error || 'Invalid invitation',
                    validation
                }));
                return;
            }

            // Check if user already exists in Firebase
            const userExists = await PromotionalInvitationService.checkEmailExists(
                validation.invitation!.email
            );

            console.log('[Promotional Invitation] Determining flow', {
                userExists,
                email: validation.invitation!.email,
                nextStep: userExists ? 'redirect_to_signin' : 'create_account'
            });

            // If user exists, redirect to sign in page with invitation token
            if (userExists)
            {
                console.log('[Promotional Invitation] User exists, redirecting to sign in');

                setState(prev => ({
                    ...prev,
                    loading: true,
                    step: 'validating'
                }));

                router.replace(`/promotionals/auth?invite=${encodeURIComponent(token)}`);
                return;
            }

            setState(prev => ({
                ...prev,
                loading: false,
                validation,
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
            'admin': 'Admin',
            'editor': 'Editor'
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
        const errorConfig = getErrorMessage(state.validation?.errorCode, state.error || undefined);

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-lg">
                    <CardContent className="pt-8 pb-8">
                        <div className="flex flex-col items-center space-y-6">
                            <div className="flex items-center justify-center">
                                {renderErrorIcon(errorConfig.icon)}
                            </div>

                            <div className="text-center space-y-3 max-w-md">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {errorConfig.title}
                                </h2>
                                <p className="text-base text-gray-600 leading-relaxed">
                                    {errorConfig.description}
                                </p>
                            </div>

                            {errorConfig.additionalInfo && (
                                <Alert className="w-full">
                                    <HelpCircle className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        {errorConfig.additionalInfo}
                                    </AlertDescription>
                                </Alert>
                            )}

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

                                {state.validation?.errorCode === 'ALREADY_USED' && (
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

                            {process.env.NODE_ENV === 'development' && state.validation?.errorCode && (
                                <div className="w-full pt-4 border-t border-gray-200">
                                    <details className="text-xs text-gray-500">
                                        <summary className="cursor-pointer hover:text-gray-700">
                                            Debug Information
                                        </summary>
                                        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 font-mono">
                                            <p>Error Code: {state.validation.errorCode}</p>
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
                                    Welcome to Promotional Events!
                                </h3>
                                <p className="text-sm text-gray-600 mt-2">
                                    Your account has been successfully set up. You'll be redirected to your dashboard shortly.
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push('/promotionals')}
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
                    <CardTitle>Join Promotional Events Team</CardTitle>
                    <CardDescription>
                        Create your account to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {state.validation?.invitation && (
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm">
                                <p className="font-medium text-blue-900">
                                    Invitation Details
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

                    <div className="text-center text-sm text-gray-600">
                        Account creation form will be implemented in the next step
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
