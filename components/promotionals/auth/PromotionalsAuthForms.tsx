'use client';

import React, { useState, useEffect } from 'react';
import { usePromotionalsAuth } from '@/contexts/PromotionalsAuthContext';
import { PromotionalsAuthService } from '@/lib/promotionals/auth-service';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface PromotionalsAuthFormsProps
{
    onSuccess?: () => void;
}

export const PromotionalsAuthForms: React.FC<PromotionalsAuthFormsProps> = ({ onSuccess }) =>
{
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [fullNameError, setFullNameError] = useState<string | null>(null);
    const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
    const [checkingUsers, setCheckingUsers] = useState(true);

    const { login, register, loading, error, clearError } = usePromotionalsAuth();

    // Check if any users exist on component mount
    useEffect(() =>
    {
        // Force login mode - always show login page instead of first-time setup
        setIsFirstUser(false);
        setCheckingUsers(false);
        
        // Uncomment below to re-enable first-time user detection
        // checkForExistingUsers();
    }, []);

    const checkForExistingUsers = async () =>
    {
        try
        {
            setCheckingUsers(true);
            const usersExist = await PromotionalsAuthService.checkIfAnyUsersExist();
            setIsFirstUser(!usersExist);
        } catch (error)
        {
            console.error('Error checking for existing users:', error);
            setIsFirstUser(false);
        } finally
        {
            setCheckingUsers(false);
        }
    };

    // Handle email change with validation
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const value = e.target.value;
        setEmail(value);
        setEmailError(null);
    };

    // Handle password change with validation
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const value = e.target.value;
        setPassword(value);
        setPasswordError(null);
    };

    // Handle full name change with validation
    const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const value = e.target.value;
        setFullName(value);
        setFullNameError(null);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        clearError();
        setEmailError(null);
        setPasswordError(null);
        setFullNameError(null);

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
        } else if (password.length < 6)
        {
            const errorMsg = 'Password must be at least 6 characters';
            setPasswordError(errorMsg);
            hasError = true;
        }

        if (isFirstUser && !fullName.trim())
        {
            const errorMsg = 'Full name is required';
            setFullNameError(errorMsg);
            hasError = true;
        }

        if (hasError)
        {
            toast.error('Please fill in all required fields', {
                duration: 4000,
            });
            return;
        }

        console.log(isFirstUser ? 'Submitting registration form for:' : 'Submitting login form for:', email);

        try
        {
            if (isFirstUser)
            {
                // First user registration
                await register(email, password, fullName);
                if (!error)
                {
                    toast.success('Account created successfully! Welcome to Promotional Events.');
                    onSuccess?.();
                }
            } else
            {
                // Regular login
                await login(email, password);
                if (!error)
                {
                    onSuccess?.();
                }
            }
        } catch (err)
        {
            console.error('Auth form error:', err);
        }
    };

    // Show loading state while checking for users
    if (checkingUsers)
    {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                    <p className="text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Form Header */}
            <div className="text-center mb-6">
                {isFirstUser && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                            First Time Setup
                        </p>
                        <p className="text-xs text-blue-700">
                            Create your Super Admin account to get started with Promotional Events Management.
                        </p>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Field (only for first user) */}
                {isFirstUser && (
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            required
                            value={fullName}
                            onChange={handleFullNameChange}
                            className={`w-full px-3 py-2 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${fullNameError
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                                }`}
                            placeholder="Enter your full name"
                            disabled={loading}
                        />
                        {fullNameError && (
                            <p className="mt-1 text-xs text-red-600">{fullNameError}</p>
                        )}
                    </div>
                )}

                {/* Email Field */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={handleEmailChange}
                        className={`w-full px-3 py-2 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${emailError
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                            }`}
                        placeholder="Enter your email"
                        disabled={loading}
                    />
                    {emailError && (
                        <p className="mt-1 text-xs text-red-600">{emailError}</p>
                    )}
                </div>

                {/* Password Field */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={handlePasswordChange}
                            className={`w-full px-3 py-2 pr-10 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${passwordError
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                                }`}
                            placeholder="Enter your password"
                            minLength={6}
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
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
                        <p className="mt-1 text-xs text-red-600">{passwordError}</p>
                    )}
                    {isFirstUser && (
                        <p className="mt-1 text-xs text-gray-500">
                            Password must be at least 6 characters
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !!emailError || !!passwordError || (isFirstUser && !!fullNameError)}
                    className="w-full py-2.5 px-4 bg-black text-white font-medium rounded-lg shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isFirstUser ? 'Creating Account...' : 'Signing in...'}
                        </span>
                    ) : (
                        isFirstUser ? 'Create Super Admin Account' : 'Sign In'
                    )}
                </button>
            </form>

            {/* Information about invitations (only show for login, not first-time setup) */}
            {!isFirstUser && (
                <div className="mt-6 text-center">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium mb-1">
                            Need access to Promotional Events?
                        </p>
                        <p className="text-xs text-blue-700">
                            New team members must be invited by a Super Admin. If you received an invitation, please use the invitation link from your email. Otherwise, contact your administrator for access.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
