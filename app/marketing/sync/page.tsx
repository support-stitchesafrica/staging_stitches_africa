'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';

export default function SyncUserPage()
{
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSync = async () =>
    {
        setLoading(true);
        setError(null);

        try
        {
            const user = auth.currentUser;

            if (!user)
            {
                setError('No user logged in');
                setLoading(false);
                return;
            }

            const idToken = await user.getIdToken();

            const response = await fetch('/api/marketing/users/sync', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: user.displayName || 'User',
                    phoneNumber: user.phoneNumber || '',
                    role: 'super_admin'
                })
            });

            const data = await response.json();

            if (!data.success)
            {
                setError(data.error || 'Failed to sync user');
                setLoading(false);
                return;
            }

            setSuccess(true);

            // Redirect to dashboard after 2 seconds
            setTimeout(() =>
            {
                router.push('/marketing');
            }, 2000);

        } catch (err)
        {
            console.error('Sync error:', err);
            setError('An error occurred while syncing');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    Sync Your Account
                </h1>

                {!success ? (
                    <>
                        <p className="text-gray-600 mb-6">
                            Your Firebase account needs to be synced with the marketing system.
                            Click the button below to complete the setup.
                        </p>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleSync}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Syncing...' : 'Sync Account'}
                        </button>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="text-green-600 text-5xl mb-4">✓</div>
                        <p className="text-gray-900 font-semibold mb-2">Account Synced!</p>
                        <p className="text-gray-600">Redirecting to dashboard...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
