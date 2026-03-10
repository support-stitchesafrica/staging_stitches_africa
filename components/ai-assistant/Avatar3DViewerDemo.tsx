/**
 * Avatar 3D Viewer Demo Component
 * 
 * Example usage of the 3D viewer for testing and demonstration
 * This can be used in a test page or Storybook
 */

'use client';

import { useState } from 'react';
import { Avatar3DViewer, VirtualTryOnModal, AvatarConfig, ProductVisualization } from './index';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';

export function Avatar3DViewerDemo() {
  const [showModal, setShowModal] = useState(false);
  const [selectedBodyType, setSelectedBodyType] = useState<AvatarConfig['bodyType']>('average');
  const [selectedHeight, setSelectedHeight] = useState(170);
  const [selectedCategory, setSelectedCategory] = useState<string>('top');
  const [selectedColor, setSelectedColor] = useState('#4A90E2');

  // Avatar configuration
  const avatarConfig: AvatarConfig = {
    height: selectedHeight,
    bodyType: selectedBodyType,
    skinTone: '#D4A574',
    gender: 'unisex',
  };

  // Product visualization
  const productVisualization: ProductVisualization = {
    productId: 'demo-product',
    category: selectedCategory,
    color: selectedColor,
  };

  // Mock product for modal
  const mockProduct: Product = {
    product_id: 'demo-product-123',
    title: 'Demo Traditional Dress',
    description: 'A beautiful traditional dress for demonstration',
    type: 'ready-to-wear',
    category: 'Dresses',
    availability: 'in_stock',
    status: 'verified',
    price: {
      base: 25000,
      currency: '$',
    },
    discount: 0,
    deliveryTimeline: '3-5 days',
    returnPolicy: '14 days',
    rtwOptions: {
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      colors: ['#4A90E2', '#E74C3C', '#2ECC71', '#F39C12'],
    },
    images: ['/placeholder-product.svg'],
    thumbnail: '/placeholder-product.svg',
    tailor_id: 'demo-tailor',
    tailor: 'Demo Tailor',
    tags: ['traditional', 'dress', 'demo'],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          3D Avatar Viewer Demo
        </h1>
        <p className="text-gray-600 mb-8">
          Interactive demonstration of the virtual try-on feature
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Avatar Settings
              </h2>

              {/* Body Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['slim', 'average', 'athletic', 'plus-size'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedBodyType(type)}
                      className={`px-3 py-2 text-sm rounded-lg border-2 transition-all capitalize ${
                        selectedBodyType === type
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height: {selectedHeight}cm
                </label>
                <input
                  type="range"
                  min="150"
                  max="200"
                  value={selectedHeight}
                  onChange={(e) => setSelectedHeight(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>150cm</span>
                  <span>200cm</span>
                </div>
              </div>
            </div>

            {/* Product Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Product Settings
              </h2>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['top', 'bottom', 'dress', 'outerwear'].map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-2 text-sm rounded-lg border-2 transition-all capitalize ${
                        selectedCategory === category
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: 'Blue', value: '#4A90E2' },
                    { name: 'Red', value: '#E74C3C' },
                    { name: 'Green', value: '#2ECC71' },
                    { name: 'Orange', value: '#F39C12' },
                    { name: 'Purple', value: '#9B59B6' },
                    { name: 'Pink', value: '#E91E63' },
                    { name: 'Teal', value: '#1ABC9C' },
                    { name: 'Gray', value: '#95A5A6' },
                  ].map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${
                        selectedColor === color.value
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h2>
              <Button
                onClick={() => setShowModal(true)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Open Full Try-On Modal
              </Button>
            </div>
          </div>

          {/* 3D Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  3D Preview
                </h2>
                <p className="text-sm text-gray-600">
                  Drag to rotate • Scroll to zoom
                </p>
              </div>
              <div className="h-[600px]">
                <Avatar3DViewer
                  avatarConfig={avatarConfig}
                  product={productVisualization}
                  enableRotation={true}
                  autoRotate={false}
                />
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Avatar Info
                </h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Height:</dt>
                    <dd className="font-medium">{selectedHeight}cm</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Body Type:</dt>
                    <dd className="font-medium capitalize">{selectedBodyType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Skin Tone:</dt>
                    <dd className="font-medium">#D4A574</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Product Info
                </h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Category:</dt>
                    <dd className="font-medium capitalize">{selectedCategory}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Color:</dt>
                    <dd className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: selectedColor }}
                      />
                      <span className="font-medium">{selectedColor}</span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Try-On Modal */}
      <VirtualTryOnModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        product={mockProduct}
        avatarConfig={avatarConfig}
        onAddToCart={(product, size) => {
          console.log('Added to cart:', product.title, 'Size:', size);
          alert(`Added ${product.title} (Size: ${size}) to cart!`);
        }}
      />
    </div>
  );
}
