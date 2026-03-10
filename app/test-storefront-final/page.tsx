'use client';

import { useState } from 'react';

export default function TestStorefrontFinalPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEverything = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Check tailor works API
      console.log('Testing tailor works API...');
      const tailorWorksResponse = await fetch('/api/storefront/products?vendorId=nBWsfFJcXnTUrXikQn8UmQJJtPX2&action=products&limit=10');
      const tailorWorksData = await tailorWorksResponse.json();
      results.tailorWorks = tailorWorksData;

      // Test 2: Check storefront config
      console.log('Testing storefront config...');
      const storefrontResponse = await fetch('/api/debug/storefront?vendorId=nBWsfFJcXnTUrXikQn8UmQJJtPX2');
      const storefrontData = await storefrontResponse.json();
      results.storefront = storefrontData;

      setResult({
        success: true,
        tests: results,
        summary: {
          tailorWorksCount: tailorWorksData.products?.length || 0,
          storefrontExists: storefrontData.storefront?.found || false,
          storefrontHandle: storefrontData.storefront?.data?.handle || 'Not found',
          storefrontUrl: storefrontData.storefront?.data?.handle ? `/store/${storefrontData.storefront.data.handle}` : 'No URL'
        }
      });

    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Final Storefront Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testEverything}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run Complete Test'}
        </button>

        {result && (
          <div className="space-y-4">
            {result.success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Test Results ✅</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-4 rounded border">
                    <h4 className="font-medium mb-2">Tailor Works</h4>
                    <p className="text-sm text-gray-600">Products found: <span className="font-bold">{result.summary.tailorWorksCount}</span></p>
                  </div>
                  
                  <div className="bg-white p-4 rounded border">
                    <h4 className="font-medium mb-2">Storefront Config</h4>
                    <p className="text-sm text-gray-600">Exists: <span className="font-bold">{result.summary.storefrontExists ? 'Yes' : 'No'}</span></p>
                    <p className="text-sm text-gray-600">Handle: <span className="font-bold">{result.summary.storefrontHandle}</span></p>
                  </div>
                </div>

                {result.summary.storefrontUrl !== 'No URL' && (
                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <h4 className="font-medium mb-2">Your Storefront URL:</h4>
                    <a 
                      href={result.summary.storefrontUrl} 
                      target="_blank" 
                      className="text-blue-600 underline font-mono"
                    >
                      {result.summary.storefrontUrl}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Test Failed ❌</h3>
                <p className="text-red-700">{result.error}</p>
              </div>
            )}

            <details className="bg-gray-50 p-4 rounded-lg">
              <summary className="cursor-pointer font-medium">Raw Test Data</summary>
              <pre className="mt-4 bg-white p-4 rounded border overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}