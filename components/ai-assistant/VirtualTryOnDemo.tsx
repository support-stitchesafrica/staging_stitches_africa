/**
 * Virtual Try-On Demo Component
 * 
 * Demonstrates the virtual try-on modal functionality
 * For testing and demonstration purposes
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VirtualTryOnModal } from './VirtualTryOnModal';
import type { AvatarConfig } from './Avatar3DViewer';
import type { Product } from '@/types';

export function VirtualTryOnDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sample avatar configuration
  const avatarConfig: AvatarConfig = {
    height: 170,
    bodyType: 'average',
    skinTone: '#C68642',
    gender: 'unisex',
  };

  // Sample product
  const sampleProduct: Product = {
    product_id: 'demo-product-1',
    title: 'Traditional African Print Dress',
    description: 'Beautiful handcrafted dress with authentic African prints',
    type: 'ready-to-wear',
    category: 'Dresses',
    availability: 'in_stock',
    status: 'verified',
    price: {
      base: 15000,
      currency: '$',
      discount: 10,
    },
    discount: 10,
    deliveryTimeline: '3-5 business days',
    returnPolicy: '14 days return policy',
    rtwOptions: {
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colors: ['#E74C3C', '#3498DB', '#F39C12'],
      fabric: 'Cotton blend',
      season: 'All seasons',
    },
    images: ['/placeholder-product.svg'],
    thumbnail: '/placeholder-product.svg',
    tailor_id: 'demo-tailor',
    tailor: 'Demo Tailor',
    vendor: {
      id: 'demo-vendor',
      name: 'African Fashion House',
      location: 'Lagos, Nigeria',
    },
    tags: ['dress', 'african print', 'traditional'],
    featured: true,
    isNewArrival: true,
  };

  const handleAddToCart = (product: Product, size?: string) => {
    console.log('Added to cart:', product.title, 'Size:', size);
    alert(`Added "${product.title}" (Size: ${size}) to cart!`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Virtual Try-On Demo</h1>
        <p className="text-gray-600">
          Click the button below to test the virtual try-on modal
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Avatar Configuration</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Height:</span> {avatarConfig.height}cm
          </div>
          <div>
            <span className="font-medium">Body Type:</span> {avatarConfig.bodyType}
          </div>
          <div>
            <span className="font-medium">Skin Tone:</span>{' '}
            <span
              className="inline-block w-6 h-6 rounded-full border border-gray-300 align-middle ml-2"
              style={{ backgroundColor: avatarConfig.skinTone }}
            />
          </div>
          <div>
            <span className="font-medium">Gender:</span> {avatarConfig.gender}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Product Details</h2>
        <div className="flex gap-4">
          <img
            src={sampleProduct.thumbnail}
            alt={sampleProduct.title}
            className="w-32 h-32 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{sampleProduct.title}</h3>
            <p className="text-gray-600 text-sm mb-2">{sampleProduct.description}</p>
            <p className="text-2xl font-bold text-gray-900">
              {sampleProduct.price.currency}
              {sampleProduct.price.base.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              Available sizes: {sampleProduct.rtwOptions?.sizes.join(', ')}
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
        >
          Open Virtual Try-On Modal
        </Button>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Features to Test:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ 3D avatar rendering with product overlay</li>
          <li>✓ 360-degree rotation (drag to rotate)</li>
          <li>✓ Zoom controls (scroll to zoom)</li>
          <li>✓ Automatic size recommendation</li>
          <li>✓ Size selection</li>
          <li>✓ Fit information display</li>
          <li>✓ Add to cart with size</li>
          <li>✓ Mobile responsive layout</li>
          <li>✓ Rotation instructions (auto-hide)</li>
        </ul>
      </div>

      {/* Virtual Try-On Modal */}
      <VirtualTryOnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={sampleProduct}
        avatarConfig={avatarConfig}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
