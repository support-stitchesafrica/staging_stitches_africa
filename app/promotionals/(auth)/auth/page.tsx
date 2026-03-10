'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { usePromotionalsAuth } from '@/contexts/PromotionalsAuthContext';
import { PromotionalsAuthForms } from '@/components/promotionals/auth/PromotionalsAuthForms';

function PromotionalsAuthPageContent()
{
    const router = useRouter();
    const searchParams = useSearchParams();
    const { promotionalUser, loading } = usePromotionalsAuth();
    const [isAcceptingInvitation, setIsAcceptingInvitation] = useState(false);
    const invitationToken = searchParams.get('invite');

    // Auto-accept invitation after successful authentication
    useEffect(() =>
    {
        const acceptInvitation = async () =>
        {
            if (!invitationToken || !promotionalUser || !promotionalUser.isPromotionalUser || isAcceptingInvitation)
            {
                return;
            }

            setIsAcceptingInvitation(true);
            console.log('[Promotionals Auth] Auto-accepting invitation after sign in', {
                email: promotionalUser.email,
                token: invitationToken.substring(0, 20) + '...'
            });

            try
            {
                // Get ID token for authentication
                const { auth } = await import('@/firebase');
                const { getIdToken } = await import('firebase/auth');
                const idToken = await getIdToken(auth.currentUser!);

                // Accept the invitation
                const encodedToken = encodeURIComponent(invitationToken);
                const acceptResponse = await fetch(`/api/promotionals/invites/accept/${encodedToken}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    }
                });

                if (!acceptResponse.ok)
                {
                    const errorData = await acceptResponse.json();
                    throw new Error(errorData.error || 'Failed to accept invitation');
                }

                console.log('[Promotionals Auth] Invitation accepted successfully');
                toast.success('Welcome to Promotional Events Manager! Your invitation has been accepted.');

                // Redirect to promotionals dashboard
                router.replace('/promotionals');
            } catch (error)
            {
                console.error('[Promotionals Auth] Failed to accept invitation', error);
                toast.error(error instanceof Error ? error.message : 'Failed to accept invitation');
                // Still redirect to dashboard even if invitation acceptance fails
                router.replace('/promotionals');
            } finally
            {
                setIsAcceptingInvitation(false);
            }
        };

        acceptInvitation();
    }, [promotionalUser, invitationToken, router, isAcceptingInvitation]);

    // Redirect to promotionals dashboard if already authenticated (and no invitation to accept)
    useEffect(() =>
    {
        if (!loading && promotionalUser && promotionalUser.isPromotionalUser && !invitationToken)
        {
            console.log('User already authenticated, redirecting to promotionals dashboard');
            router.replace('/promotionals');
        }
    }, [promotionalUser, loading, router, invitationToken]);

    // Handle successful authentication
    const handleAuthSuccess = () =>
    {
        // If there's an invitation token, the useEffect above will handle it
        // Otherwise, just redirect normally
        if (!invitationToken)
        {
            toast.success('Welcome to Promotional Events Manager!');
            router.replace('/promotionals');
        }
    };

    // Show loading state while checking authentication
    if (loading)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // If already authenticated, show loading while redirecting
    if (promotionalUser && promotionalUser.isPromotionalUser)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo and Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-6">
                        <div className="relative h-16 w-48 mx-auto">
                            <Image
                                src="/images/Stitches Africa Logo-01.png"
                                alt="Stitches Africa"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Promotional Events Manager
                    </h1>
                    <p className="text-sm text-gray-600">
                        Create and manage promotional campaigns with discounts
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 sm:p-8">
                    <PromotionalsAuthForms onSuccess={handleAuthSuccess} />
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    By signing in, you agree to our{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                        Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function PromotionalsAuthPage()
{
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <PromotionalsAuthPageContent />
        </Suspense>
    );
}
