'use client';

import { useState } from 'react';

export default function TestStorefrontPage() {
  const [vendorId, setVendorId] = useState('');
  const [handle, setHandle] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const createTestStorefront = async () => {
    if (!vendorId || !handle) {
      alert('Please enter both vendor ID and handle');
      return;
    }

    setLoading(true);
    try {
      // First, validate the handle
      const validateResponse = await fetch('/api/storefront/validate-handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle })
      });
      
      const validateData = await validateResponse.json();
      console.log('Validation result:', validateData);

      if (!validateData.success || !validateData.data.isValid || !validateData.data.isAvailable) {
        setResult({ error: 'Handle validation failed', details: validateData });
        return;
      }

      // Create the storefront
      const createResponse = await fetch('/api/storefront/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          handle,
          isPublic: true,
          templateId: 'modern-fashion',
          theme: {
            colors: {
              primary: '#3B82F6',
              secondary: '#64748B',
              accent: '#F59E0B',
              background: '#FFFFFF',
              text: '#1F2937',
            },
            typography: {
              headingFont: 'Inter',
              bodyFont: 'Inter',
              sizes: {
                xs: '0.75rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.125rem',
                xl: '1.25rem',
                '2xl': '1.5rem',
                '3xl': '1.875rem',
                '4xl': '2.25rem',
              },
            },
            layout: {
              headerStyle: 'modern',
              productCardStyle: 'card',
              spacing: {
                xs: '0.25rem',
                sm: '0.5rem',
                md: '1rem',
                lg: '1.5rem',
                xl: '2rem',
                '2xl': '3rem',
              },
            },
            media: {},
          }
        })
      });

      const createData = await createResponse.json();
      console.log('Create result:', createData);

      if (createData.success) {
        // Test if we can access the storefront
        const storefrontUrl = `/store/${handle}`;
        setResult({
          success: true,
          storefrontUrl,
          data: createData.data,
          message: 'Storefront created successfully!'
        });
      } else {
        setResult({ error: 'Failed to create storefront', details: createData });
      }

    } catch (error) {
      console.error('Error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Test Storefront Creation</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Vendor ID</label>
          <input
            type="text"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            placeholder="Enter vendor ID"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Handle</label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="Enter storefront handle"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <button
          onClick={createTestStorefront}
          disabled={loading || !vendorId || !handle}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Test Storefront'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Result:</h3>
            {result.success ? (
              <div className="space-y-2">
                <p className="text-green-600 font-medium">{result.message}</p>
                <p>Storefront URL: <a href={result.storefrontUrl} target="_blank" className="text-blue-600 underline">{result.storefrontUrl}</a></p>
              </div>
            ) : (
              <div className="text-red-600">
                <p className="font-medium">Error: {result.error}</p>
              </div>
            )}
            <pre className="mt-4 bg-white p-4 rounded border overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}