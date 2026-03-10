'use client';

import { useState, useEffect } from 'react';
import { AnalyticsTracker, useStorefrontAnalytics } from '@/components/storefront/AnalyticsTracker';

export default function StorefrontAnalyticsDebugPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [testStorefrontId] = useState('debug-storefront-123');
  const [isTracking, setIsTracking] = useState(false);
  
  const { trackAddToCart, trackCheckoutStart, trackPurchase } = useStorefrontAnalytics(testStorefrontId, 'debug-user-123');

  // Override fetch to capture analytics calls
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url, options] = args;
      
      // Check if this is an analytics call
      if (typeof url === 'string' && url.includes('/api/storefront/analytics') && options?.method === 'POST') {
        try {
          const body = JSON.parse(options.body as string);
          setEvents(prev => [...prev, {
            timestamp: new Date().toISOString(),
            type: 'API_CALL',
            data: body
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
  }, []);

  const handleTestPageView = () => {
    setIsTracking(true);
    setEvents(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type: 'PAGE_VIEW_TRIGGERED',
      data: { storefrontId: testStorefrontId }
    }]);
    
    // The AnalyticsTracker component will automatically track page view
    setTimeout(() => setIsTracking(false), 1000);
  };

  const handleTestAddToCart = () => {
    const productId = `test-product-${Date.now()}`;
    const productName = 'Test Product';
    const price = 99.99;
    
    setEvents(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type: 'ADD_TO_CART_TRIGGERED',
      data: { productId, productName, price }
    }]);
    
    trackAddToCart(productId, productName, price);
  };

  const handleTestCheckout = () => {
    const cartItems = [
      { id: 'item1', name: 'Test Item 1', price: 50, quantity: 1 },
      { id: 'item2', name: 'Test Item 2', price: 75, quantity: 2 }
    ];
    
    setEvents(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type: 'CHECKOUT_TRIGGERED',
      data: { cartItems }
    }]);
    
    trackCheckoutStart(cartItems);
  };

  const handleTestPurchase = () => {
    const orderId = `order-${Date.now()}`;
    const orderValue = 199.99;
    const items = [
      { id: 'item1', name: 'Test Item 1', price: 50, quantity: 1 },
      { id: 'item2', name: 'Test Item 2', price: 75, quantity: 2 }
    ];
    
    setEvents(prev => [...prev, {
      timestamp: new Date().toISOString(),
      type: 'PURCHASE_TRIGGERED',
      data: { orderId, orderValue, items }
    }]);
    
    trackPurchase(orderId, orderValue, items);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Analytics Tracker Component */}
      <AnalyticsTracker 
        storefrontId={testStorefrontId} 
        userId="debug-user-123"
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Storefront Analytics Debug
          </h1>
          <p className="text-gray-600 mb-6">
            Test and debug storefront analytics tracking in real-time
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={handleTestPageView}
              disabled={isTracking}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isTracking ? 'Tracking...' : 'Test Page View'}
            </button>
            
            <button
              onClick={handleTestAddToCart}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Add to Cart
            </button>
            
            <button
              onClick={handleTestCheckout}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Test Checkout
            </button>
            
            <button
              onClick={handleTestPurchase}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Test Purchase
            </button>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Analytics Events ({events.length})
            </h2>
            <button
              onClick={clearEvents}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Clear Events
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No events tracked yet. Click the buttons above to test analytics tracking.
              </div>
            ) : (
              events.map((event, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      event.type === 'API_CALL' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {event.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-sm text-gray-700 bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How to Use This Debug Tool
          </h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• <strong>Test Page View:</strong> Triggers automatic page view tracking</li>
            <li>• <strong>Test Add to Cart:</strong> Simulates adding a product to cart</li>
            <li>• <strong>Test Checkout:</strong> Simulates starting checkout process</li>
            <li>• <strong>Test Purchase:</strong> Simulates completing a purchase</li>
            <li>• Events are captured in real-time and sent to the analytics API</li>
            <li>• Check the browser network tab to see actual API calls</li>
          </ul>
        </div>
      </div>
    </div>
  );
}