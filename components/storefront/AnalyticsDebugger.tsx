'use client';

import { useEffect, useState } from 'react';

interface AnalyticsDebuggerProps {
  vendorId: string;
  enabled?: boolean;
}

/**
 * Analytics Debugger Component
 * Shows real-time analytics tracking for debugging purposes
 * Only use in development/testing
 */
export function AnalyticsDebugger({ vendorId, enabled = false }: AnalyticsDebuggerProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Override fetch to intercept analytics calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      
      // Check if this is an analytics call
      if (typeof url === 'string' && url.includes('/api/storefront/analytics') && options?.method === 'POST') {
        try {
          const body = JSON.parse(options.body as string);
          setEvents(prev => [...prev.slice(-9), {
            timestamp: new Date().toLocaleTimeString(),
            eventType: body.eventType,
            productId: body.productId,
            metadata: body.metadata
          }]);
        } catch (error) {
          console.warn('Failed to parse analytics body:', error);
        }
      }
      
      return originalFetch(...args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        style={{ fontSize: '12px' }}
      >
        📊 Analytics ({events.length})
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-sm max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm">Analytics Debug</h3>
            <button
              onClick={() => setEvents([])}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          
          <div className="text-xs text-gray-600 mb-2">
            Vendor: {vendorId}
          </div>

          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="text-xs text-gray-500 italic">
                No events tracked yet...
              </div>
            ) : (
              events.map((event, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                  <div className="font-medium text-blue-600">
                    {event.eventType}
                  </div>
                  <div className="text-gray-500">
                    {event.timestamp}
                  </div>
                  {event.productId && (
                    <div className="text-gray-600">
                      Product: {event.productId}
                    </div>
                  )}
                  {event.metadata?.productName && (
                    <div className="text-gray-600">
                      {event.metadata.productName}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}