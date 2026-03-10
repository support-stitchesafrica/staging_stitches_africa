'use client';

import { useState } from 'react';

export default function StorefrontDebugPage() {
  const [handle, setHandle] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkStorefront = async (type: 'handle' | 'vendor' | 'all') => {
    setLoading(true);
    try {
      let url = '/api/debug/storefront';
      if (type === 'handle' && handle) {
        url += `?handle=${encodeURIComponent(handle)}`;
      } else if (type === 'vendor' && vendorId) {
        url += `?vendorId=${encodeURIComponent(vendorId)}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const addTestProducts = async () => {
    if (!vendorId) {
      alert('Please enter a vendor ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/debug/add-test-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Storefront Debug Tool</h1>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Check by Handle</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="Enter handle"
              className="w-full px-3 py-2 border rounded-md"
            />
            <button
              onClick={() => checkStorefront('handle')}
              disabled={!handle || loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Check Handle
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Check by Vendor ID</label>
            <input
              type="text"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              placeholder="Enter vendor ID"
              className="w-full px-3 py-2 border rounded-md"
            />
            <button
              onClick={() => checkStorefront('vendor')}
              disabled={!vendorId || loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Check Vendor
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">List All</label>
            <div className="h-10"></div>
            <button
              onClick={() => checkStorefront('all')}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              List All Storefronts
            </button>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Add Test Products</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Vendor ID for Test Products</label>
            <input
              type="text"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              placeholder="Enter vendor ID"
              className="w-full px-3 py-2 border rounded-md"
            />
            <button
              onClick={addTestProducts}
              disabled={!vendorId || loading}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              Add Test Products
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}

        {result && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Result:</h3>
            <pre className="bg-white p-4 rounded border overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}