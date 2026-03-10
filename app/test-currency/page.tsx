'use client';

import React, { useState, useEffect } from 'react';
import { Price, PriceRange, DiscountedPrice } from '@/components/common/Price';
import { useCurrency } from '@/contexts/CurrencyContext';
import { currencyService } from '@/lib/services/currencyService';

export default function TestCurrencyPage() {
  const { userCurrency, userCountry, isLoading } = useCurrency();
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    const runTests = async () => {
      const tests = [
        { price: 29.99, label: 'Product Price' },
        { price: 99.99, label: 'Premium Product' },
        { price: 15.50, label: 'Budget Item' },
        { price: 199.99, label: 'High-end Product' }
      ];

      const results = await Promise.all(
        tests.map(async (test) => {
          const conversion = await currencyService.convertPrice(test.price, 'USD');
          return {
            ...test,
            conversion
          };
        })
      );

      setTestResults(results);
    };

    if (!isLoading) {
      runTests();
    }
  }, [isLoading]);

  const forceNigeria = () => {
    localStorage.setItem('manualCurrency', 'NGN');
    localStorage.setItem('manualCountry', 'NG');
    window.location.reload();
  };

  const forceCanada = () => {
    localStorage.setItem('manualCurrency', 'CAD');
    localStorage.setItem('manualCountry', 'CA');
    window.location.reload();
  };

  const clearOverride = () => {
    localStorage.removeItem('manualCurrency');
    localStorage.removeItem('manualCountry');
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Currency Conversion Test Page</h1>
      
      {/* Current Status */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Detected Country:</strong> {userCountry}
          </div>
          <div>
            <strong>Currency:</strong> {userCurrency}
          </div>
          <div>
            <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
        <div className="flex gap-4">
          <button
            onClick={forceNigeria}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            🇳🇬 Force Nigeria (NGN)
          </button>
          <button
            onClick={forceCanada}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            🇨🇦 Force Canada (CAD)
          </button>
          <button
            onClick={clearOverride}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            🌍 Auto-detect Location
          </button>
        </div>
      </div>

      {/* Price Component Tests */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Price Component Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Basic Price */}
          <div className="border p-4 rounded">
            <h3 className="font-medium mb-2">Basic Price</h3>
            <Price price={29.99} size="lg" />
          </div>

          {/* Price with Tooltip */}
          <div className="border p-4 rounded">
            <h3 className="font-medium mb-2">Price with Tooltip (hover)</h3>
            <Price price={99.99} showTooltip={true} size="lg" />
          </div>

          {/* Price Range */}
          <div className="border p-4 rounded">
            <h3 className="font-medium mb-2">Price Range</h3>
            <PriceRange minPrice={15.99} maxPrice={49.99} size="lg" />
          </div>

          {/* Discounted Price */}
          <div className="border p-4 rounded">
            <h3 className="font-medium mb-2">Discounted Price</h3>
            <DiscountedPrice originalPrice={199.99} salePrice={149.99} />
          </div>

        </div>
      </div>

      {/* Conversion Results */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Conversion Test Results</h2>
        {testResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left">Product</th>
                  <th className="border border-gray-300 p-3 text-left">Original (USD)</th>
                  <th className="border border-gray-300 p-3 text-left">Converted ({userCurrency})</th>
                  <th className="border border-gray-300 p-3 text-left">Exchange Rate</th>
                  <th className="border border-gray-300 p-3 text-left">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-3">{result.label}</td>
                    <td className="border border-gray-300 p-3">
                      ${result.price.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {currencyService.formatPrice(result.conversion.convertedPrice, result.conversion.convertedCurrency)}
                    </td>
                    <td className="border border-gray-300 p-3">
                      1 USD = {result.conversion.exchangeRate.toFixed(4)} {result.conversion.convertedCurrency}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {new Date(result.conversion.lastRefreshed).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Running conversion tests...</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 p-6 rounded-lg mt-8">
        <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click "Force Nigeria (NGN)" to test Nigerian currency conversion</li>
          <li>Verify prices show in NGN (₦) instead of USD ($)</li>
          <li>Hover over prices to see conversion tooltips</li>
          <li>Check that $29.99 USD converts to approximately ₦49,485 NGN</li>
          <li>Try "Force Canada (CAD)" to test Canadian dollar conversion</li>
          <li>Use "Auto-detect Location" to test automatic location detection</li>
        </ol>
      </div>
    </div>
  );
}