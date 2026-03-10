/**
 * Atlas Dashboard - Invitation Login Form
 * Handles existing user login from invitation
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

'use client';

import React, {  useState , memo } from "react";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle, Info } from 'lucide-react';

interface InvitationLoginFormProps
{
    invitation: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
    token: string;
    onSuccess: () => void;
}

interface FormData
{
    password: string;
}

interface FormErrors
{
    password?: string;
    general?: string;
}

function InvitationLoginForm({ invitation,
    token,
    onSuccess }: InvitationLoginFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        password: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const validateForm = (): boolean =>
    {
        const newErrors: FormErrors = {};

        if (!formData.password)
        {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof FormData, value: string) =>
    {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear field-specific error when user starts typing
        if (errors[field])
        {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();

        if (!validateForm())
        {
            return;
        }

        setLoading(true);
        setErrors({});

        try
        {
            // Log login attempt
            console.log('[Atlas Invitation Login] Login attempt started', {
                email: invitation.email,
                invitationId: invitation.id,
                role: invitation.role,
                timestamp: new Date().toISOString()
            });

            // Sign in with Firebase
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            const { auth } = await import('@/firebase');

            const userCredential = await signInWithEmailAndPassword(
                auth,
                invitation.email,
                formData.password
            );

            // Log successful sign-in
            console.log('[Atlas Invitation Login] Firebase sign-in successful', {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                timestamp: new Date().toISOString()
            });

            // Get ID token
            const idToken = await userCredential.user.getIdToken();

            console.log('[Atlas Invitation Login] ID token retrieved', {
                uid: userCredential.user.uid,
                timestamp: new Date().toISOString()
            });

            // Accept the invitation and assign role
            console.log('[Atlas Invitation Login] Sending invitation acceptance request', {
                token: token.substring(0, 20) + '...',
                timestamp: new Date().toISOString()
            });

            // Encode token for URL to handle any special characters safely
            const encodedToken = encodeURIComponent(token);
            const acceptResponse = await fetch(`/api/atlas/invites/accept/${encodedToken}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                }
            });

            console.log('[Atlas Invitation Login] Invitation acceptance response received', {
                ok: acceptResponse.ok,
                status: acceptResponse.status,
                timestamp: new Date().toISOString()
            });

            if (!acceptResponse.ok)
            {
                const errorData = await acceptResponse.json();
                console.error('[Atlas Invitation Login] Invitation acceptance failed', {
                    status: acceptResponse.status,
                    error: errorData.error,
                    code: errorData.code,
                    timestamp: new Date().toISOString()
                });
                throw new Error(errorData.error || 'Failed to accept invitation');
            }

            const successData = await acceptResponse.json();
            console.log('[Atlas Invitation Login] Login and invitation acceptance successful', {
                uid: userCredential.user.uid,
                email: invitation.email,
                role: invitation.role,
                redirectTo: successData.redirectTo,
                timestamp: new Date().toISOString()
            });

            // Ensure auth state is properly set by refreshing the token
            // This helps ensure the auth context recognizes the user
            try {
                await userCredential.user.getIdToken(true); // Force refresh
                console.log('[Atlas Invitation Login] Auth token refreshed, auth state should be updated');
            } catch (tokenError) {
                console.warn('[Atlas Invitation Login] Token refresh warning (non-critical):', tokenError);
            }

            // Small delay to allow auth state to propagate
            await new Promise(resolve => setTimeout(resolve, 500));

            // Success - call onSuccess callback
            onSuccess();

        } catch (error)
        {
            console.error('[Atlas Invitation Login] Login error occurred', {
                error: error instanceof Error ? error.message : 'Unknown error',
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                email: invitation.email,
                timestamp: new Date().toISOString()
            });

            let errorMessage = 'Failed to sign in';

            if (error instanceof Error)
            {
                // Handle specific Firebase auth errors
                if (error.message.includes('auth/user-not-found') || error.message.includes('user-not-found'))
                {
                    errorMessage = 'No account found with this email. Please contact your administrator.';
                    console.error('[Atlas Invitation Login] User not found', {
                        email: invitation.email,
                        timestamp: new Date().toISOString()
                    });
                } else if (error.message.includes('auth/wrong-password') || error.message.includes('wrong-password') || error.message.includes('auth/invalid-credential'))
                {
                    errorMessage = 'Incorrect password. Please try again.';
                    console.error('[Atlas Invitation Login] Invalid credentials', {
                        email: invitation.email,
                        timestamp: new Date().toISOString()
                    });
                } else if (error.message.includes('auth/invalid-email') || error.message.includes('invalid-email'))
                {
                    errorMessage = 'Invalid email address format.';
                } else if (error.message.includes('auth/user-disabled') || error.message.includes('user-disabled'))
                {
                    errorMessage = 'This account has been disabled. Please contact your administrator.';
                    console.error('[Atlas Invitation Login] Account disabled', {
                        email: invitation.email,
                        timestamp: new Date().toISOString()
                    });
                } else if (error.message.includes('auth/too-many-requests') || error.message.includes('too-many-requests'))
                {
                    errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
                    console.error('[Atlas Invitation Login] Too many requests', {
                        email: invitation.email,
                        timestamp: new Date().toISOString()
                    });
                } else if (error.message.includes('network-request-failed') || error.message.includes('Failed to fetch'))
                {
                    errorMessage = 'Network error. Please check your internet connection and try again.';
                    console.error('[Atlas Invitation Login] Network error', {
                        timestamp: new Date().toISOString()
                    });
                } else if (error.message.includes('Failed to accept invitation'))
                {
                    errorMessage = 'Sign-in successful, but failed to accept invitation. Please try again or contact support.';
                    console.error('[Atlas Invitation Login] Invitation acceptance failed after sign-in', {
                        timestamp: new Date().toISOString()
                    });
                } else
                {
                    errorMessage = error.message;
                    console.error('[Atlas Invitation Login] Unhandled error', {
                        message: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            setErrors({ general: errorMessage });
        } finally
        {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () =>
    {
        try
        {
            console.log('[Atlas Invitation Login] Password reset requested', {
                email: invitation.email,
                timestamp: new Date().toISOString()
            });

            const { sendPasswordResetEmail } = await import('firebase/auth');
            const { auth } = await import('@/firebase');

            await sendPasswordResetEmail(auth, invitation.email);

            console.log('[Atlas Invitation Login] Password reset email sent successfully', {
                email: invitation.email,
                timestamp: new Date().toISOString()
            });

            setErrors({
                general: `Password reset email sent to ${invitation.email}. Please check your inbox and spam folder.`
            });
        } catch (error)
        {
            console.error('[Atlas Invitation Login] Password reset error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                email: invitation.email,
                timestamp: new Date().toISOString()
            });

            let errorMessage = 'Failed to send password reset email. Please try again.';

            if (error instanceof Error)
            {
                if (error.message.includes('auth/user-not-found') || error.message.includes('user-not-found'))
                {
                    errorMessage = 'No account found with this email. Please contact your administrator.';
                } else if (error.message.includes('network-request-failed') || error.message.includes('Failed to fetch'))
                {
                    errorMessage = 'Network error. Please check your internet connection and try again.';
                } else if (error.message.includes('auth/too-many-requests') || error.message.includes('too-many-requests'))
                {
                    errorMessage = 'Too many password reset requests. Please try again later.';
                }
            }

            setErrors({
                general: errorMessage
            });
        }
    };

    const getRoleDisplayName = (role: string) =>
    {
        const roleMap: Record<string, string> = {
            'super_admin': 'Super Admin',
            'admin': 'Admin',
            'analyst': 'Analyst',
            'viewer': 'Viewer'
        };
        return roleMap[role] || role;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
                <Alert variant={errors.general.includes('Password reset email sent') ? 'default' : 'destructive'}>
                    {errors.general.includes('Password reset email sent') ? (
                        <Info className="h-4 w-4" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
            )}

            {/* Account Found Notice */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    We found an existing account for <strong>{invitation.email}</strong>.
                    Please sign in to accept your invitation.
                </AlertDescription>
            </Alert>

            {/* Email (read-only) */}
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    value={invitation.email}
                    disabled
                    className="bg-gray-50"
                />
            </div>

            {/* Password */}
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Enter your password"
                        disabled={loading}
                        className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                        autoFocus
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                    >
                        {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                        )}
                    </Button>
                </div>
                {errors.password && (
                    <p className="text-sm text-red-600">{errors.password}</p>
                )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
                <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="p-0 h-auto text-sm"
                >
                    Forgot your password?
                </Button>
            </div>

            {/* Role Information */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                    <span className="font-medium">Invitation Role:</span> {getRoleDisplayName(invitation.role)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                    After signing in, you'll be granted this role in the Atlas dashboard
                </p>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full"
                disabled={loading}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                    </>
                ) : (
                    'Sign In & Accept Invitation'
                )}
            </Button>

            {/* Help Text */}
            <div className="text-center">
                <p className="text-xs text-gray-500">
                    By signing in, you accept the invitation to join the STITCHES Africa Atlas team
                    with the specified role.
                </p>
            </div>

            {/* Alternative Action */}
            <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                    Don't have an account with this email?{' '}
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => router.push(`/atlas/invite/${token}?force_create=true`)}
                        disabled={loading}
                        className="p-0 h-auto"
                    >
                        Create new account instead
                    </Button>
                </p>
            </div>
        </form>
    );
}


export default memo(InvitationLoginForm);