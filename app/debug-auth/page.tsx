'use client';

import { useState } from 'react';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

export default function DebugAuthPage() {
  const { firebaseUser, marketingUser, loading, error } = useMarketingAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const testAuthentication = async () => {
    if (!firebaseUser) {
      setTestResult({ error: 'No Firebase user found' });
      return;
    }

    setTesting(true);
    try {
      // Get ID token
      const idToken = await firebaseUser.getIdToken();
      console.log('Got ID token, length:', idToken.length);

      // Test the debug endpoint
      const response = await fetch('/api/debug-vvip-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const result = await response.json();
      setTestResult(result);

      // Also test the VVIP permissions endpoint
      const vvipResponse = await fetch('/api/marketing/vvip/permissions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const vvipResult = await vvipResponse.json();
      setTestResult(prev => ({
        ...prev,
        vvipTest: {
          status: vvipResponse.status,
          data: vvipResult
        }
      }));

    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading authentication...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="space-y-6">
        {/* Firebase User Info */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Firebase User</h2>
          {firebaseUser ? (
            <div className="space-y-1 text-sm">
              <div><strong>UID:</strong> {firebaseUser.uid}</div>
              <div><strong>Email:</strong> {firebaseUser.email}</div>
              <div><strong>Email Verified:</strong> {firebaseUser.emailVerified ? 'Yes' : 'No'}</div>
            </div>
          ) : (
            <div className="text-red-600">No Firebase user found</div>
          )}
        </div>

        {/* Marketing User Info */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Marketing User</h2>
          {marketingUser ? (
            <div className="space-y-1 text-sm">
              <div><strong>UID:</strong> {marketingUser.uid}</div>
              <div><strong>Email:</strong> {marketingUser.email}</div>
              <div><strong>Role:</strong> {marketingUser.role}</div>
              <div><strong>Active:</strong> {marketingUser.isActive ? 'Yes' : 'No'}</div>
            </div>
          ) : (
            <div className="text-red-600">No marketing user found</div>
          )}
        </div>

        {/* Error Info */}
        {error && (
          <div className="bg-red-100 p-4 rounded">
            <h2 className="font-semibold mb-2 text-red-800">Error</h2>
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {/* Test Button */}
        <div>
          <button
            onClick={testAuthentication}
            disabled={testing || !firebaseUser}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test Authentication'}
          </button>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Test Results</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}