'use client';

import { useState, useEffect } from 'react';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { useRouter } from 'next/navigation';

export default function TestAuthPage() {
  const { firebaseUser, marketingUser, loading, error } = useMarketingAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const router = useRouter();

  const runAuthTests = async () => {
    setTesting(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      // Test 1: Check Firebase user
      results.tests.firebaseUser = {
        present: !!firebaseUser,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        emailVerified: firebaseUser?.emailVerified
      };

      // Test 2: Check marketing user
      results.tests.marketingUser = {
        present: !!marketingUser,
        uid: marketingUser?.uid,
        email: marketingUser?.email,
        role: marketingUser?.role,
        isActive: marketingUser?.isActive
      };

      // Test 3: Try to get ID token
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          results.tests.idToken = {
            success: true,
            length: idToken.length,
            preview: `${idToken.substring(0, 20)}...`
          };

          // Test 4: Test auth status endpoint
          const authStatusResponse = await fetch('/api/debug-auth-status', {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          const authStatusData = await authStatusResponse.json();
          results.tests.authStatus = {
            success: authStatusResponse.ok,
            data: authStatusData
          };

          // Test 5: Test VVIP permissions endpoint
          const vvipResponse = await fetch('/api/marketing/vvip/permissions', {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            }
          });
          
          results.tests.vvipPermissions = {
            success: vvipResponse.ok,
            status: vvipResponse.status,
            data: vvipResponse.ok ? await vvipResponse.json() : await vvipResponse.text()
          };

        } catch (tokenError) {
          results.tests.idToken = {
            success: false,
            error: tokenError instanceof Error ? tokenError.message : 'Unknown error'
          };
        }
      } else {
        results.tests.idToken = {
          success: false,
          error: 'No Firebase user available'
        };
      }

      setTestResults(results);
    } catch (error) {
      console.error('Test error:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  const handleLogin = () => {
    router.push('/marketing/auth/login');
  };

  const handleVVIP = () => {
    router.push('/marketing/vvip');
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
        <div className="text-center py-8">Loading authentication...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test & Debug</h1>
      
      <div className="space-y-6">
        {/* Current Status */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-semibold mb-3">Current Authentication Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Firebase User:</strong> {firebaseUser ? '✅ Logged in' : '❌ Not logged in'}
            </div>
            <div>
              <strong>Marketing User:</strong> {marketingUser ? '✅ Found' : '❌ Not found'}
            </div>
            {firebaseUser && (
              <>
                <div><strong>Email:</strong> {firebaseUser.email}</div>
                <div><strong>UID:</strong> {firebaseUser.uid}</div>
              </>
            )}
            {marketingUser && (
              <>
                <div><strong>Role:</strong> {marketingUser.role}</div>
                <div><strong>Active:</strong> {marketingUser.isActive ? 'Yes' : 'No'}</div>
              </>
            )}
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-100 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {!firebaseUser && (
            <button
              onClick={handleLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Login
            </button>
          )}
          
          <button
            onClick={runAuthTests}
            disabled={testing}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {testing ? 'Running Tests...' : 'Run Authentication Tests'}
          </button>
          
          {firebaseUser && (
            <button
              onClick={handleVVIP}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Go to VVIP Dashboard
            </button>
          )}
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h2 className="font-semibold mb-3">Test Results</h2>
            <pre className="text-xs overflow-auto bg-white p-3 rounded border max-h-96">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-3">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>If you're not logged in, click "Go to Login" and use these credentials:
              <div className="ml-4 mt-1 font-mono text-xs bg-gray-200 p-2 rounded">
                Email: uchinedu@stitchesafrica.com<br/>
                Password: StitchesVVIP2024!
              </div>
            </li>
            <li>After logging in, come back to this page and click "Run Authentication Tests"</li>
            <li>Check the test results to see if VVIP permissions are working</li>
            <li>If tests pass, click "Go to VVIP Dashboard" to access the orders</li>
          </ol>
        </div>
      </div>
    </div>
  );
}