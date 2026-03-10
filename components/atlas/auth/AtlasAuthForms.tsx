'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAtlasAuth } from '@/contexts/AtlasAuthContext';
import { toast } from 'sonner';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase';

interface AtlasAuthFormsProps
{
    onSuccess?: () => void;
}

export const AtlasAuthForms: React.FC<AtlasAuthFormsProps> = ({ onSuccess }) =>
{
    const searchParams = useSearchParams();
    const invitationToken = searchParams.get('invite');
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isAcceptingInvitation, setIsAcceptingInvitation] = useState(false);

    const { login, loading, error, clearError } = useAtlasAuth();

    // Log invitation token if present
    useEffect(() => {
        if (invitationToken) {
            console.log('[Atlas Sign In] Invitation token detected', {
                tokenLength: invitationToken.length,
                tokenPrefix: invitationToken.substring(0, 20) + '...',
                timestamp: new Date().toISOString()
            });
        }
    }, [invitationToken]);

    // Handle email change
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const value = e.target.value;
        setEmail(value);
        setEmailError(null);
    };

    // Handle password change
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const value = e.target.value;
        setPassword(value);
        setPasswordError(null);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        clearError();
        setEmailError(null);
        setPasswordError(null);

        // Validate inputs
        let hasError = false;

        if (!email.trim())
        {
            const errorMsg = 'Email address is required';
            setEmailError(errorMsg);
            hasError = true;
        }

        if (!password)
        {
            const errorMsg = 'Password is required';
            setPasswordError(errorMsg);
            hasError = true;
        }

        if (hasError)
        {
            toast.error('Please fill in all required fields');
            return;
        }

        console.log('[Atlas Sign In] Starting sign-in process', {
            email: email.trim(),
            hasInvitationToken: !!invitationToken,
            timestamp: new Date().toISOString()
        });

        try
        {
            // Step 1: Sign in with Firebase Auth
            console.log('[Atlas Sign In] Step 1: Authenticating with Firebase', {
                email: email.trim(),
                timestamp: new Date().toISOString()
            });

            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            const firebaseUser = userCredential.user;

            console.log('[Atlas Sign In] Step 1: Firebase authentication successful', {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                timestamp: new Date().toISOString()
            });

            // Step 2: If there's an invitation token, accept it
            if (invitationToken)
            {
                console.log('[Atlas Sign In] Step 2: Invitation token present, accepting invitation', {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    tokenPrefix: invitationToken.substring(0, 20) + '...',
                    timestamp: new Date().toISOString()
                });

                setIsAcceptingInvitation(true);

                try
                {
                    // Get ID token for authentication
                    console.log('[Atlas Sign In] Step 2a: Getting ID token', {
                        uid: firebaseUser.uid,
                        timestamp: new Date().toISOString()
                    });

                    let idToken: string;
                    try
                    {
                        idToken = await firebaseUser.getIdToken(true); // Force refresh
                        console.log('[Atlas Sign In] Step 2a: ID token obtained successfully', {
                            hasToken: !!idToken,
                            tokenLength: idToken?.length || 0,
                            timestamp: new Date().toISOString()
                        });
                    } catch (tokenError)
                    {
                        console.error('[Atlas Sign In] Step 2a: Failed to get ID token', {
                            error: tokenError instanceof Error ? tokenError.message : 'Unknown error',
                            timestamp: new Date().toISOString()
                        });
                        throw new Error('Failed to obtain authentication token. Please try again.');
                    }

                    // Accept the invitation
                    console.log('[Atlas Sign In] Step 2b: Sending invitation acceptance request', {
                        tokenPrefix: invitationToken.substring(0, 20) + '...',
                        hasIdToken: !!idToken,
                        timestamp: new Date().toISOString()
                    });

                    const encodedToken = encodeURIComponent(invitationToken);
                    const acceptResponse = await fetch(`/api/atlas/invites/accept/${encodedToken}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        }
                    });

                    console.log('[Atlas Sign In] Step 2b: Invitation acceptance response received', {
                        ok: acceptResponse.ok,
                        status: acceptResponse.status,
                        statusText: acceptResponse.statusText,
                        timestamp: new Date().toISOString()
                    });

                    if (!acceptResponse.ok)
                    {
                        const errorData = await acceptResponse.json();
                        console.error('[Atlas Sign In] Step 2b: Invitation acceptance failed', {
                            status: acceptResponse.status,
                            error: errorData.error,
                            code: errorData.code,
                            timestamp: new Date().toISOString()
                        });
                        throw new Error(errorData.error || 'Failed to accept invitation');
                    }

                    const successData = await acceptResponse.json();
                    console.log('[Atlas Sign In] Step 2b: Invitation accepted successfully', {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        redirectTo: successData.redirectTo,
                        timestamp: new Date().toISOString()
                    });

                    toast.success('Welcome to Atlas! Your invitation has been accepted.');
                } catch (invitationError)
                {
                    console.error('[Atlas Sign In] Step 2: Failed to accept invitation', {
                        error: invitationError instanceof Error ? invitationError.message : 'Unknown error',
                        errorType: invitationError instanceof Error ? invitationError.constructor.name : typeof invitationError,
                        timestamp: new Date().toISOString()
                    });
                    toast.error(invitationError instanceof Error ? invitationError.message : 'Failed to accept invitation');
                    setIsAcceptingInvitation(false);
                    // Don't throw - allow user to continue even if invitation acceptance fails
                } finally
                {
                    setIsAcceptingInvitation(false);
                }
            }

            // Step 3: Ensure auth state is properly set by refreshing the token
            console.log('[Atlas Sign In] Step 3: Refreshing auth token', {
                uid: firebaseUser.uid,
                timestamp: new Date().toISOString()
            });

            try
            {
                await firebaseUser.getIdToken(true); // Force refresh
                console.log('[Atlas Sign In] Step 3: Auth token refreshed, auth state should be updated', {
                    uid: firebaseUser.uid,
                    timestamp: new Date().toISOString()
                });
            } catch (tokenError)
            {
                console.warn('[Atlas Sign In] Step 3: Token refresh warning (non-critical)', {
                    error: tokenError instanceof Error ? tokenError.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
            }

            // Step 4: Small delay to allow auth state to propagate
            console.log('[Atlas Sign In] Step 4: Waiting for auth state to propagate', {
                uid: firebaseUser.uid,
                timestamp: new Date().toISOString()
            });
            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 5: Call the login function to update context (if needed)
            // Note: We've already signed in directly, but we should still call login
            // to ensure the context is updated properly
            console.log('[Atlas Sign In] Step 5: Updating auth context', {
                uid: firebaseUser.uid,
                timestamp: new Date().toISOString()
            });

            // Call the login function from context to ensure state is updated
            // This might trigger the context update, but we've already signed in
            try
            {
                await login(email.trim(), password);
                console.log('[Atlas Sign In] Step 5: Auth context updated', {
                    uid: firebaseUser.uid,
                    timestamp: new Date().toISOString()
                });
            } catch (contextError)
            {
                // If login fails but we're already signed in, that's okay
                // The user is authenticated, context might just need time to update
                console.warn('[Atlas Sign In] Step 5: Context update warning (user is still authenticated)', {
                    error: contextError instanceof Error ? contextError.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
            }

            // Step 6: Success
            console.log('[Atlas Sign In] Sign-in process completed successfully', {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                hasInvitationToken: !!invitationToken,
                invitationAccepted: !!invitationToken,
                timestamp: new Date().toISOString()
            });

            if (!error)
            {
                console.log('[Atlas Sign In] Calling onSuccess callback', {
                    timestamp: new Date().toISOString()
                });
                onSuccess?.();
            }
        } catch (err)
        {
            console.error('[Atlas Sign In] Sign-in process failed', {
                error: err instanceof Error ? err.message : 'Unknown error',
                errorType: err instanceof Error ? err.constructor.name : typeof err,
                email: email.trim(),
                timestamp: new Date().toISOString()
            });
            
            // Set error message for display
            if (err instanceof Error)
            {
                if (err.message.includes('auth/user-not-found') || err.message.includes('auth/wrong-password'))
                {
                    setPasswordError('Invalid email or password');
                    toast.error('Invalid email or password');
                }
                else if (err.message.includes('auth/invalid-email'))
                {
                    setEmailError('Invalid email address');
                    toast.error('Invalid email address');
                }
                else
                {
                    toast.error(err.message || 'Failed to sign in');
                }
            }
            else
            {
                toast.error('Failed to sign in. Please try again.');
            }
        } finally
        {
            setIsAcceptingInvitation(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Form Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-ga-primary font-ga">
                    Welcome Back
                </h2>
                <p className="mt-2 text-sm text-ga-secondary">
                    Sign in to access the analytics dashboard
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-ga-red/10 border border-ga-red/30 rounded-lg">
                    <p className="text-sm text-ga-red">{error}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-ga-primary mb-1">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={handleEmailChange}
                        className={`w-full px-3 py-2 bg-ga-background border rounded-lg text-ga-primary placeholder-ga-secondary focus:outline-none focus:ring-2 transition-ga-fast ${emailError
                            ? 'border-ga-red focus:ring-ga-red'
                            : 'border-ga focus:ring-ga-blue focus:border-transparent'
                            }`}
                        placeholder="Enter your email"
                        disabled={loading}
                    />
                    {emailError && (
                        <p className="mt-1 text-xs text-ga-red">{emailError}</p>
                    )}
                </div>

                {/* Password Field */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-ga-primary mb-1">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={handlePasswordChange}
                            className={`w-full px-3 py-2 pr-10 bg-ga-background border rounded-lg text-ga-primary placeholder-ga-secondary focus:outline-none focus:ring-2 transition-ga-fast ${passwordError
                                ? 'border-ga-red focus:ring-ga-red'
                                : 'border-ga focus:ring-ga-blue focus:border-transparent'
                                }`}
                            placeholder="Enter your password"
                            minLength={6}
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ga-secondary hover:text-ga-primary focus:outline-none"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {passwordError && (
                        <p className="mt-1 text-xs text-ga-red">{passwordError}</p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || isAcceptingInvitation || !!emailError || !!passwordError}
                    className="w-full py-2.5 px-4 bg-ga-blue text-white font-medium rounded-lg shadow-ga-card hover:shadow-ga-card-hover transition-ga-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-ga-card"
                >
                    {loading || isAcceptingInvitation ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isAcceptingInvitation ? 'Accepting invitation...' : 'Signing in...'}
                        </span>
                    ) : (
                        'Sign In'
                    )}
                </button>
            </form>

            {/* Information about invitations */}
            <div className="mt-6">
                <div className="p-4 bg-ga-blue/10 border border-ga-blue/30 rounded-lg">
                    <p className="text-sm text-ga-primary font-medium mb-1">
                        Need access to Atlas Dashboard?
                    </p>
                    <p className="text-xs text-ga-secondary">
                        New team members must be invited by an administrator. If you received an invitation, please use the invitation link from your email. Otherwise, contact your administrator for access.
                    </p>
                </div>
            </div>
        </div>
    );
};
