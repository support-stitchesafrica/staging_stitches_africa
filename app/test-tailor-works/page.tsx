'use client';

import { useState } from 'react';

export default function TestTailorWorksPage() {
  const [vendorId, setVendorId] = useState('nBWsfFJcXnTUrXikQn8UmQJJtPX2');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testTailorWorksAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/storefront/products?vendorId=${vendorId}&action=products&limit=10`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const addTestTailorWork = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/add-tailor-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tailorId: vendorId })
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
      <h1 className="text-2xl font-bold mb-6">Test Tailor Works Collection</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Vendor ID (Tailor ID)</label>
          <input
            type="text"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={testTailorWorksAPI}
            disabled={loading || !vendorId}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Tailor Works API'}
          </button>

          <button
            onClick={addTestTailorWork}
            disabled={loading || !vendorId}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Add Test Tailor Work
          </button>
        </div>

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