'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';

export default function LiveTestPage()
{
  const [handle, setHandle] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLiveStorefront = async () =>
  {
    if (!handle)
    {
      alert('Please enter a handle');
      return;
    }

    setLoading(true);
    try
    {
      const response = await fetch(`/api/debug/live-storefront?handle=${handle}`);
      const data = await response.json();
      setResults({ status: response.status, data });
    } catch (error)
    {
      setResults({ error: error.message });
    } finally
    {
      setLoading(false);
    }
  };

  const testStorefrontAccess = async () =>
  {
    if (!handle)
    {
      alert('Please enter a handle');
      return;
    }

    setLoading(true);
    try
    {
      // Test the actual storefront endpoint
      const response = await fetch(`/store/${handle}`);
      const isSuccess = response.ok;
      const text = await response.text();

      setResults({
        status: response.status,
        data: {
          success: isSuccess,
          responseText: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
          headers: Object.fromEntries(response.headers.entries())
        }
      });
    } catch (error)
    {
      setResults({ error: error.message });
    } finally
    {
      setLoading(false);
    }
  };

  const fixStorefront = async () =>
  {
    if (!handle)
    {
      alert('Please enter a handle');
      return;
    }

    setLoading(true);
    try
    {
      const response = await fetch('/api/debug/fix-storefronts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ handle })
      });
      const data = await response.json();
      setResults({ status: response.status, data });
    } catch (error)
    {
      setResults({ error: error.message });
    } finally
    {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Live Environment Test</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Storefront Access</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Storefront Handle:</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter storefront handle (e.g., aso-ebi)"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={testLiveStorefront}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Debug Database'}
            </button>

            <button
              onClick={testStorefrontAccess}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Storefront URL'}
            </button>

            <button
              onClick={fixStorefront}
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Fixing...' : 'Fix Storefront'}
            </button>
          </div>
        </div>
      </div>

      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <h3 className="font-semibold text-blue-800 mb-2">Live Environment Debugging:</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Enter the handle of a storefront you created on live</li>
          <li>Click "Debug Database" to see what's in the database</li>
          <li>Click "Test Storefront URL" to test the actual storefront access</li>
          <li>Check the results to identify the issue</li>
        </ol>

        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p className="text-blue-800 font-medium">Common Issues:</p>
          <ul className="text-blue-700 text-sm mt-1 space-y-1">
            <li>• Storefront exists but isPublic is false</li>
            <li>• Firestore indexes not deployed to live</li>
            <li>• Different Firebase project configuration</li>
            <li>• Caching issues on live environment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}