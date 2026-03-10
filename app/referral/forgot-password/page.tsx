/**
 * Referral Program Forgot Password Page
 * Allows users to reset their password
 * Requirements: 2.3
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase';

export default function ForgotPasswordPage()
{
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        setError(null);

        if (!email.trim())
        {
            setError('Email address is required');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try
        {
            await sendPasswordResetEmail(auth, email);
            setEmailSent(true);
            toast.success('Password reset email sent!', {
                duration: 5000,
                description: 'Check your inbox for instructions to reset your password.',
            });
        } catch (err: any)
        {
            console.error('Password reset error:', err);

            let errorMsg = 'Failed to send password reset email';

            if (err.code === 'auth/user-not-found')
            {
                errorMsg = 'No account found with this email address';
            } else if (err.code === 'auth/invalid-email')
            {
                errorMsg = 'Invalid email address';
            } else if (err.code === 'auth/too-many-requests')
            {
                errorMsg = 'Too many requests. Please try again later.';
            }

            setError(errorMsg);
            toast.error('Error', {
                duration: 5000,
                description: errorMsg,
            });
        } finally
        {
            setLoading(false);
        }
    };

    if (emailSent)
    {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                            Check Your Email
                        </h2>
                        <p className="text-gray-600 mb-6">
                            We've sent password reset instructions to <strong>{email}</strong>
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Didn't receive the email? Check your spam folder or try again.
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={() =>
                                {
                                    setEmailSent(false);
                                    setEmail('');
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                Try Another Email
                            </Button>
                            <a href="/referral/login" className="block">
                                <Button variant="default" className="w-full">
                                    Back to Login
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
            <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-6 sm:p-8 border border-gray-100">
                <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        Reset Your Password
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-gray-600">
                        Enter your email address and we'll send you instructions to reset your password
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) =>
                            {
                                setEmail(e.target.value);
                                setError(null);
                            }}
                            className={error ? 'border-red-500' : ''}
                            placeholder="Enter your email"
                            disabled={loading}
                            aria-invalid={!!error}
                        />
                    </div>

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
                                Sending...
                            </span>
                        ) : (
                            'Send Reset Instructions'
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <a
                        href="/referral/login"
                        className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                    >
                        ← Back to Login
                    </a>
                </div>
            </div>
        </div>
    );
}
