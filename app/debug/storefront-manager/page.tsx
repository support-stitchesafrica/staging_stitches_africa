'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';

export default function StorefrontManagerPage()
{
  const [vendorId, setVendorId] = useState('');
  const [handle, setHandle] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createStorefront = async () =>
  {
    if (!vendorId || !handle)
    {
      alert('Please enter both vendor ID and handle');
      return;
    }

    setLoading(true);
    try
    {
      const response = await fetch('/api/storefront/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendorId,
          handle,
          isPublic: true
        })
      });

      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error)
    {
      setResult({ error: error.message });
    } finally
    {
      setLoading(false);
    }
  };

  const testStorefront = async () =>
  {
    if (!handle)
    {
      alert('Please enter a handle');
      return;
    }

    setLoading(true);
    try
    {
      const response = await fetch(`/api/debug/storefront-info?handle=${handle}`);
      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error)
    {
      setResult({ error: error.message });
    } finally
    {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Storefront Manager</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New Storefront</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Vendor ID:</label>
            <input
              type="text"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter vendor ID (e.g., user123)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Handle:</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter storefront handle (e.g., my-store)"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={createStorefront}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Storefront'}
            </button>

            <button
              onClick={testStorefront}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Existing'}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>

          {result.data?.success && result.data?.url && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-medium">✅ Storefront created successfully!</p>
              <p className="text-green-700 mt-2">
                Visit: <a href={result.data.url} target="_blank" rel="noopener noreferrer" className="underline">{result.data.url}</a>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <h3 className="font-semibold text-yellow-800 mb-2">Quick Setup Guide:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Enter your vendor ID (this should match your user ID in the system)</li>
          <li>Enter a unique handle for your storefront (e.g., "my-awesome-store")</li>
          <li>Click "Create Storefront" to create a new storefront</li>
          <li>Use "Test Existing" to check if a storefront already exists</li>
          <li>Visit the generated URL to see your storefront</li>
        </ol>

        <div className="mt-4 p-3 bg-yellow-100 rounded">
          <p className="text-yellow-800 font-medium">Environment Note:</p>
          <p className="text-yellow-700 text-sm">
            This will create the storefront in your current environment.
            For live deployment, you'll need to create it in the production database.
          </p>
        </div>
      </div>
    </div>
  );
}