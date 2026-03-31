'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';

export default function EnhancedProductsDebugPage()
{
  const [vendorId, setVendorId] = useState('');
  const [handle, setHandle] = useState('aso-ebi');
  const [section, setSection] = useState('new-arrivals');
  const [results, setResults] = useState<any>(null);
  const [storefrontInfo, setStorefrontInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getStorefrontInfo = async () =>
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
      setStorefrontInfo({ status: response.status, data });
      if (data.success)
      {
        setVendorId(data.storefront.vendorId);
      }
    } catch (error)
    {
      setStorefrontInfo({ error: error.message });
    } finally
    {
      setLoading(false);
    }
  };

  const testAPI = async () =>
  {
    if (!vendorId)
    {
      alert('Please enter a vendor ID or get storefront info first');
      return;
    }

    setLoading(true);
    try
    {
      const response = await fetch(`/api/storefront/enhanced-products?vendorId=${vendorId}&section=${section}&limit=6`);
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
      <h1 className="text-3xl font-bold mb-8">Enhanced Products API Debug</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test API</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Storefront Handle:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter storefront handle (e.g., aso-ebi)"
              />
              <button
                onClick={getStorefrontInfo}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Get Info
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Vendor ID:</label>
            <input
              type="text"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter vendor ID (or get from storefront info)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Section:</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="new-arrivals">New Arrivals</option>
              <option value="best-selling">Best Selling</option>
              <option value="promotions">Promotions</option>
              <option value="all">All Products</option>
            </select>
          </div>

          <button
            onClick={testAPI}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test API'}
          </button>
        </div>
      </div>

      {storefrontInfo && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Storefront Info</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(storefrontInfo, null, 2)}
          </pre>
        </div>
      )}

      {results && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">API Results</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Enter a vendor ID (you can find this in the Firestore console under the storefronts collection)</li>
          <li>Select a section to test</li>
          <li>Click "Test API" to see the results</li>
          <li>Check the browser console for additional debug information</li>
        </ol>
      </div>
    </div>
  );
}