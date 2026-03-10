'use client';

import React from 'react';
import { useStorefrontCart } from '@/contexts/StorefrontCartContext';
import { Product } from '@/types';

/**
 * Example component demonstrating storefront cart integration
 * 
 * This component shows how cart items include storefront context
 * when added from a storefront page.
 */

interface StorefrontCartExampleProps {
  storefrontId?: string;
  storefrontHandle?: string;
  sampleProducts: Product[];
}

export const StorefrontCartExample: React.FC<StorefrontCartExampleProps> = ({
  storefrontId,
  storefrontHandle,
  sampleProducts
}) => {
  const {
    items,
    totalAmount,
    itemCount,
    addItem,
    removeItem,
    initiateCheckout,
    storefrontContext
  } = useStorefrontCart();

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem(product, 1, { size: 'M', color: 'blue' });
      console.log('Item added with storefront context:', {
        productId: product.product_id,
        storefrontContext
      });
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  };

  const handleCheckout = async () => {
    try {
      const result = await initiateCheckout();
      if (result.success) {
        console.log('Checkout initiated successfully');
      } else {
        console.error('Checkout failed:', result.error);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <div className="storefront-cart-example p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Storefront Cart Example</h2>
      
      {/* Storefront Context Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Storefront Context</h3>
        <div className="text-sm text-blue-600">
          <p><strong>Storefront ID:</strong> {storefrontContext.storefrontId || 'Not set'}</p>
          <p><strong>Storefront Handle:</strong> {storefrontContext.storefrontHandle || 'Not set'}</p>
        </div>
      </div>

      {/* Sample Products */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Sample Products</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleProducts.map((product) => (
            <div key={product.product_id} className="border rounded-lg p-4">
              <img 
                src={product.images[0] || '/placeholder-product.svg'} 
                alt={product.title}
                className="w-full h-32 object-cover rounded mb-2"
              />
              <h4 className="font-medium">{product.title}</h4>
              <p className="text-gray-600 text-sm mb-2">{product.description}</p>
              <p className="font-bold text-lg mb-3">
                ${typeof product.price === 'number' ? product.price : product.price.base}
              </p>
              <button
                onClick={() => handleAddToCart(product)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">Cart Summary</h3>
        <div className="space-y-2">
          <p><strong>Items:</strong> {itemCount}</p>
          <p><strong>Total:</strong> ${totalAmount.toFixed(2)}</p>
        </div>
        
        {items.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Cart Items:</h4>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={`${item.product_id}-${index}`} className="flex justify-between items-center text-sm">
                  <span>{item.title} (x{item.quantity})</span>
                  <div className="flex items-center space-x-2">
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Button */}
      {items.length > 0 && (
        <button
          onClick={handleCheckout}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Proceed to Checkout
        </button>
      )}

      {/* Debug Information */}
      <details className="mt-6">
        <summary className="cursor-pointer font-medium text-gray-700">
          Debug: Cart Items with Context
        </summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify(items.map(item => ({
            product_id: item.product_id,
            title: item.title,
            quantity: item.quantity,
            storefrontContext: item.storefrontContext
          })), null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default StorefrontCartExample;