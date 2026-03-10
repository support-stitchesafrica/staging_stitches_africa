/**
 * Referral Sign-Up Form Component
 * Handles user registration for the referral program
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

'use client';

import React, { useState } from 'react';
import { useReferralAuth } from '@/contexts/ReferralAuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SignUpFormProps
{
    onSuccess?: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess }) =>
{
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{
        fullName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const { register, loading, error, clearError } = useReferralAuth();
    const router = useRouter();

    // Validate form fields
    const validateForm = (): boolean =>
    {
        const newErrors: typeof errors = {};
        let isValid = true;

        // Full name validation
        if (!fullName.trim())
        {
            newErrors.fullName = 'Full name is required';
            isValid = false;
        } else if (fullName.trim().length < 2)
        {
            newErrors.fullName = 'Full name must be at least 2 characters';
            isValid = false;
        }

        // Email validation
        if (!email.trim())
        {
            newErrors.email = 'Email address is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        {
            newErrors.email = 'Please enter a valid email address';
            isValid = false;
        }

        // Password validation
        if (!password)
        {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (password.length < 6)
        {
            newErrors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        // Confirm password validation
        if (!confirmPassword)
        {
            newErrors.confirmPassword = 'Please confirm your password';
            isValid = false;
        } else if (password !== confirmPassword)
        {
            newErrors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        clearError();

        if (!validateForm())
        {
            toast.error('Please fix the errors in the form');
            return;
        }

        try
        {
            // Register will now automatically log the user in
            await register(email, password, fullName);

            // After successful registration, wait a moment for auth state to sync
            // then redirect to dashboard
            console.log('Registration complete, redirecting to dashboard...');
            
            // Use a short delay to ensure Firebase Auth state is synced
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (onSuccess)
            {
                onSuccess();
            } else
            {
                // Force navigation to dashboard
                router.push('/referral/dashboard');
            }
        } catch (err)
        {
            console.error('Registration error:', err);
        }
    };

    // Handle field changes with validation clearing
    const handleFieldChange = (field: string, value: string) =>
    {
        switch (field)
        {
            case 'fullName':
                setFullName(value);
                if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                break;
            case 'email':
                setEmail(value);
                if (errors.email) setErrors({ ...errors, email: undefined });
                break;
            case 'password':
                setPassword(value);
                if (errors.password) setErrors({ ...errors, password: undefined });
                if (confirmPassword && value !== confirmPassword)
                {
                    setErrors({ ...errors, password: undefined, confirmPassword: 'Passwords do not match' });
                } else if (confirmPassword && value === confirmPassword)
                {
                    setErrors({ ...errors, password: undefined, confirmPassword: undefined });
                }
                break;
            case 'confirmPassword':
                setConfirmPassword(value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                if (password && value !== password)
                {
                    setErrors({ ...errors, confirmPassword: 'Passwords do not match' });
                } else if (password && value === password)
                {
                    setErrors({ ...errors, confirmPassword: undefined });
                }
                break;
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-gray-200 shadow-sm">
                    <img
                        src="/Stitches-Africa-Logo-06.png"
                        alt="Stitches Africa"
                        className="w-12 h-12 object-contain"
                    />
                </div>
            </div>

            {/* Form Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                    Join the Referral Program
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Start earning rewards by referring others
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Field */}
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                    </label>
                    <Input
                        id="fullName"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => handleFieldChange('fullName', e.target.value)}
                        className={errors.fullName ? 'border-red-500' : ''}
                        placeholder="Enter your full name"
                        disabled={loading}
                        aria-invalid={!!errors.fullName}
                    />
                    {errors.fullName && (
                        <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                    )}
                </div>

                {/* Email Field */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                    </label>
                    <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        className={errors.email ? 'border-red-500' : ''}
                        placeholder="Enter your email"
                        disabled={loading}
                        aria-invalid={!!errors.email}
                    />
                    {errors.email && (
                        <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                    )}
                </div>

                {/* Password Field */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => handleFieldChange('password', e.target.value)}
                            className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                            placeholder="Create a password"
                            minLength={6}
                            disabled={loading}
                            aria-invalid={!!errors.password}
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
                    {errors.password && (
                        <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                    )}
                </div>

                {/* Confirm Password Field */}
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                            className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                            placeholder="Confirm your password"
                            minLength={6}
                            disabled={loading}
                            aria-invalid={!!errors.confirmPassword}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? (
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
                    {errors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                    )}
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Account...
                        </span>
                    ) : (
                        'Create Account'
                    )}
                </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <a
                        href="/referral/login"
                        className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                    >
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
};
