'use client';

import React, { useState, useEffect } from 'react';
import { SPECIFIC_BOGO_MAPPINGS } from '@/lib/bogo/configure-specific-mappings';

export default function SimpleTestPage() {
  const [bogoData, setBogoData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      console.log('BOGO Mappings:', SPECIFIC_BOGO_MAPPINGS);
      
      // Check if mappings are active
      const now = new Date();
      const activeMappings = SPECIFIC_BOGO_MAPPINGS.filter((mapping) => {
        const startDate = mapping.promotionStartDate instanceof Date
          ? mapping.promotionStartDate
          : new Date(mapping.promotionStartDate);
        const endDate = mapping.promotionEndDate instanceof Date
          ? mapping.promotionEndDate
          : new Date(mapping.promotionEndDate);
        
        console.log(`Mapping ${mapping.mainProductId}:`, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          now: now.toISOString(),
          isActive: now >= startDate && now <= endDate
        });
        
        return now >= startDate && now <= endDate;
      });
      
      setBogoData({
        totalMappings: SPECIFIC_BOGO_MAPPINGS.length,
        activeMappings: activeMappings.length,
        mappings: activeMappings
      });
    } catch (err: any) {
      console.error('Error checking BOGO mappings:', err);
      setError(err.message);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple BOGO Test</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h2 className="text-red-800 font-semibold">Error:</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {bogoData && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">BOGO Mappings Status</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-2xl font-bold text-blue-600">{bogoData.totalMappings}</div>
                <div className="text-sm text-blue-800">Total Mappings</div>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <div className="text-2xl font-bold text-green-600">{bogoData.activeMappings}</div>
                <div className="text-sm text-green-800">Active Mappings</div>
              </div>
            </div>
            
            {bogoData.mappings.length > 0 ? (
              <div>
                <h3 className="font-semibold mb-2">Active Mappings:</h3>
                <div className="space-y-2">
                  {bogoData.mappings.map((mapping: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <div className="font-medium">{mapping.promotionName}</div>
                      <div className="text-sm text-gray-600">
                        Main Product: {mapping.mainProductId}
                      </div>
                      <div className="text-sm text-gray-600">
                        Free Products: {mapping.freeProductIds.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No active BOGO mappings found for current date range.
              </div>
            )}
          </div>
        )}
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Current Date: {new Date().toISOString()}</li>
            <li>• BOGO Period: December 1-31, 2025</li>
            <li>• Check browser console for detailed logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}