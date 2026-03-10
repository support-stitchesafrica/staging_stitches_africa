/**
 * Atlas Dashboard - Invitation Account Creation Form
 * Handles new user account creation from invitation
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

'use client';

import React, { useState, memo } from "react";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface InvitationCreateAccountFormProps
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
    name: string;
    password: string;
    confirmPassword: string;
}

interface FormErrors
{
    name?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

function InvitationCreateAccountForm({
    invitation,
    token,
    onSuccess
}: InvitationCreateAccountFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        name: invitation.name || '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validateForm = (): boolean =>
    {
        const newErrors: FormErrors = {};

        // Validate name
        if (!formData.name.trim())
        {
            newErrors.name = 'Full name is required';
        } else if (formData.name.trim().length < 2)
        {
            newErrors.name = 'Name must be at least 2 characters';
        }

        // Validate password
        if (!formData.password)
        {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6)
        {
            newErrors.password = 'Password must be at least 6 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password))
        {
            newErrors.password = 'Password must contain both uppercase and lowercase letters';
        }

        // Validate confirm password
        if (!formData.confirmPassword)
        {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword)
        {
            newErrors.confirmPassword = 'Passwords do not match';
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
            // Log account creation start
            console.log('[Atlas Create Account] Starting account creation', {
                email: invitation.email,
                name: formData.name.trim(),
                role: invitation.role,
                timestamp: new Date().toISOString()
            });

            // Create Firebase account
            const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
            const { auth } = await import('@/firebase');

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                invitation.email,
                formData.password
            );

            // Log Firebase account creation success
            console.log('[Atlas Create Account] Firebase account created successfully', {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                timestamp: new Date().toISOString()
            });

            // Update user profile with name
            await updateProfile(userCredential.user, {
                displayName: formData.name.trim()
            });

            // Log profile update completion
            console.log('[Atlas Create Account] Profile updated with display name', {
                uid: userCredential.user.uid,
                displayName: formData.name.trim(),
                timestamp: new Date().toISOString()
            });

            // Get ID token
            let idToken: string;
            try
            {
                idToken = await userCredential.user.getIdToken();

                // Log ID token retrieval
                console.log('[Atlas Create Account] ID token obtained successfully', {
                    uid: userCredential.user.uid,
                    tokenLength: idToken.length,
                    timestamp: new Date().toISOString()
                });
            } catch (tokenError)
            {
                console.error('[Atlas Create Account] Failed to obtain ID token', {
                    uid: userCredential.user.uid,
                    error: tokenError instanceof Error ? tokenError.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
                throw new Error('Failed to obtain authentication token. Please try again.');
            }

            // Log invitation acceptance request
            console.log('[Atlas Create Account] Sending invitation acceptance request', {
                token: token.substring(0, 20) + '...',
                hasIdToken: !!idToken,
                timestamp: new Date().toISOString()
            });

            // Accept the invitation and create atlas user profile
            // Encode token for URL to handle any special characters safely
            const encodedToken = encodeURIComponent(token);
            const acceptResponse = await fetch(`/api/atlas/invites/accept/${encodedToken}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    name: formData.name.trim()
                })
            });

            // Log invitation acceptance response
            console.log('[Atlas Create Account] Invitation acceptance response received', {
                ok: acceptResponse.ok,
                status: acceptResponse.status,
                statusText: acceptResponse.statusText,
                timestamp: new Date().toISOString()
            });

            if (!acceptResponse.ok)
            {
                const errorData = await acceptResponse.json();
                console.error('[Atlas Create Account] Invitation acceptance failed', {
                    status: acceptResponse.status,
                    error: errorData.error,
                    code: errorData.code,
                    timestamp: new Date().toISOString()
                });
                throw new Error(errorData.error || 'Failed to accept invitation');
            }

            const successData = await acceptResponse.json();

            // Log final success
            console.log('[Atlas Create Account] Account creation completed successfully', {
                uid: userCredential.user.uid,
                email: invitation.email,
                role: invitation.role,
                redirectTo: successData.redirectTo,
                timestamp: new Date().toISOString()
            });

            // Ensure auth state is properly set by refreshing the token
            // This helps ensure the auth context recognizes the new user
            try {
                await userCredential.user.getIdToken(true); // Force refresh
                console.log('[Atlas Create Account] Auth token refreshed, auth state should be updated');
            } catch (tokenError) {
                console.warn('[Atlas Create Account] Token refresh warning (non-critical):', tokenError);
            }

            // Small delay to allow auth state to propagate
            await new Promise(resolve => setTimeout(resolve, 500));

            // Success - call onSuccess callback
            onSuccess();

        } catch (error)
        {
            // Log final error
            console.error('[Atlas Create Account] Account creation failed', {
                email: invitation.email,
                error: error instanceof Error ? error.message : 'Unknown error',
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                timestamp: new Date().toISOString()
            });

            let errorMessage = 'Failed to create account';

            if (error instanceof Error)
            {
                // Handle specific Firebase auth errors
                if (error.message.includes('auth/email-already-in-use'))
                {
                    errorMessage = 'An account with this email already exists. Please try signing in instead.';
                } else if (error.message.includes('auth/weak-password'))
                {
                    errorMessage = 'Password is too weak. Please choose a stronger password.';
                } else if (error.message.includes('auth/invalid-email'))
                {
                    errorMessage = 'Invalid email address format.';
                } else if (error.message.includes('auth/operation-not-allowed'))
                {
                    errorMessage = 'Email/password accounts are not enabled. Please contact support.';
                } else if (error.message.includes('auth/too-many-requests'))
                {
                    errorMessage = 'Too many failed attempts. Please try again later.';
                } else if (error.message.includes('network-request-failed') || error.message.includes('Failed to fetch'))
                {
                    errorMessage = 'Network error. Please check your internet connection and try again.';
                } else if (error.message.includes('Failed to obtain authentication token'))
                {
                    errorMessage = error.message;
                } else if (error.message.includes('Failed to accept invitation'))
                {
                    errorMessage = 'Account created but failed to complete setup. Please contact support.';
                } else
                {
                    errorMessage = error.message;
                }
            }

            setErrors({ general: errorMessage });
        } finally
        {
            setLoading(false);
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
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
            )}

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
                <p className="text-xs text-gray-500">
                    This email is pre-filled from your invitation
                </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    disabled={loading}
                    className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                )}
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
                        placeholder="Create a strong password"
                        disabled={loading}
                        className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
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
                <p className="text-xs text-gray-500">
                    Must be at least 6 characters with uppercase and lowercase letters
                </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm your password"
                        disabled={loading}
                        className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                        )}
                    </Button>
                </div>
                {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
            </div>

            {/* Role Information */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                    <span className="font-medium">Your Role:</span> {getRoleDisplayName(invitation.role)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                    This role determines your permissions in the Atlas dashboard
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
                        Creating Account...
                    </>
                ) : (
                    'Create Account & Join Team'
                )}
            </Button>

            {/* Help Text */}
            <div className="text-center">
                <p className="text-xs text-gray-500">
                    By creating an account, you agree to join the STITCHES Africa Atlas team
                    with the role specified in your invitation.
                </p>
            </div>

            {/* Alternative Action */}
            <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                    Already have an account with this email?{' '}
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => router.push(`/atlas/auth?invite=${encodeURIComponent(token)}`)}
                        disabled={loading}
                        className="p-0 h-auto"
                    >
                        Sign in instead
                    </Button>
                </p>
            </div>
        </form>
    );
}

export default memo(InvitationCreateAccountForm);