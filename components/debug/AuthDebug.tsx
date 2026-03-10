'use client';

import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { useEffect, useState } from 'react';

export default function AuthDebug() {
  const { firebaseUser, marketingUser, loading, error } = useMarketingAuth();
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    const getToken = async () => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setIdToken(token.substring(0, 50) + '...');
        } catch (error) {
          console.error('Error getting ID token:', error);
        }
      }
    };
    getToken();
  }, [firebaseUser]);

  if (loading) {
    return <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">Loading auth...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded text-sm">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      <div className="space-y-1">
        <div><strong>Firebase User:</strong> {firebaseUser ? '✅ Logged in' : '❌ Not logged in'}</div>
        {firebaseUser && (
          <>
            <div><strong>Email:</strong> {firebaseUser.email}</div>
            <div><strong>UID:</strong> {firebaseUser.uid}</div>
            <div><strong>ID Token:</strong> {idToken || 'Loading...'}</div>
          </>
        )}
        <div><strong>Marketing User:</strong> {marketingUser ? '✅ Found' : '❌ Not found'}</div>
        {marketingUser && (
          <>
            <div><strong>Role:</strong> {marketingUser.role}</div>
            <div><strong>Active:</strong> {marketingUser.isActive ? 'Yes' : 'No'}</div>
          </>
        )}
        {error && <div className="text-red-600"><strong>Error:</strong> {error}</div>}
      </div>
    </div>
  );
}