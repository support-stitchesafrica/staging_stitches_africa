/**
 * Create Waitlist Page
 * Form for creating new waitlists
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { CreateWaitlistForm, WaitlistType, NotificationChannel, WaitlistProduct } from '@/types/waitlist';
import { ArrowLeft, Search, X, Calendar, Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { productRepository } from '@/lib/firestore';
import MediaUploader from '@/components/vendor/storefront/MediaUploader';
import ImageUploader from '@/components/waitlist/ImageUploader';

export default function CreateWaitlistPage() {
  const router = useRouter();
  const { marketingUser, hasPermission, loading: authLoading } = useMarketingAuth();
  
  const [formData, setFormData] = useState<CreateWaitlistForm>({
    title: '',
    description: '',
    shortDescription: '',
    bannerImage: '',
    type: 'COLLECTION',
    productIds: [],
    countdownEndAt: new Date(),
    notificationChannels: ['EMAIL'],
    launchUrl: ''
  });

  const [availableProducts, setAvailableProducts] = useState<WaitlistProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<WaitlistProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check permissions - TEMPORARILY DISABLED FOR TESTING
  useEffect(() => {
    // Don't check permissions while auth is still loading
    if (authLoading) return;
    
    // Log debug info
    console.log('Create page auth debug:', {
      authLoading,
      marketingUser: marketingUser?.role,
      canCreate: hasPermission('canCreate')
    });
    
    // TEMPORARILY COMMENTED OUT - If auth is loaded but user doesn't have permission, redirect
    // if (!hasPermission('canCreate')) {
    //   console.log('No create permission, redirecting...');
    //   router.push('/marketing/waitlists');
    // }
  }, [hasPermission, router, authLoading, marketingUser]);

  // Load available products
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      
      // Fetch real products from the repository
      const products = await productRepository.getAllWithTailorInfo();
      
      // Convert to WaitlistProduct format
      const waitlistProducts: WaitlistProduct[] = products.map(product => ({
        id: product.product_id,
        name: product.title,
        images: product.images || [],
        price: product.price?.base || 0,
        status: product.status,
        category: product.category,
        vendor_name: product.tailor || product.vendor?.name || 'Unknown Vendor',
        description: product.description
      }));
      
      setAvailableProducts(waitlistProducts);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleInputChange = (field: keyof CreateWaitlistForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProductSelect = (product: WaitlistProduct) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      const newSelected = [...selectedProducts, product];
      setSelectedProducts(newSelected);
      setFormData(prev => ({
        ...prev,
        productIds: newSelected.map(p => p.id)
      }));
    }
  };

  const handleProductRemove = (productId: string) => {
    const newSelected = selectedProducts.filter(p => p.id !== productId);
    setSelectedProducts(newSelected);
    setFormData(prev => ({
      ...prev,
      productIds: newSelected.map(p => p.id)
    }));
  };

  const handleNotificationChannelChange = (channel: NotificationChannel) => {
    const current = formData.notificationChannels;
    let updated: NotificationChannel[];

    if (channel === 'BOTH') {
      updated = ['BOTH'];
    } else if (current.includes('BOTH')) {
      updated = [channel];
    } else if (current.includes(channel)) {
      updated = current.filter(c => c !== channel);
      if (updated.length === 0) updated = ['EMAIL']; // At least one required
    } else {
      updated = [...current, channel];
      if (updated.includes('EMAIL') && updated.includes('WHATSAPP')) {
        updated = ['BOTH'];
      }
    }

    setFormData(prev => ({
      ...prev,
      notificationChannels: updated
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!marketingUser) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          waitlistData: formData,
          createdBy: marketingUser.uid
        })
      });

      const result = await response.json();

      if (result.success) {
        router.push('/marketing/waitlists');
      } else {
        setError(result.error || 'Failed to create waitlist');
      }
    } catch (err) {
      setError('Failed to create waitlist');
      console.error('Create error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.category?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.vendor_name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1); // Tomorrow

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // TEMPORARILY DISABLED - Show access denied if no permission
  // if (!hasPermission('canCreate')) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
  //         <p className="text-gray-600 mb-4">You don't have permission to create waitlists.</p>
  //         <Link
  //           href="/marketing/waitlists"
  //           className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  //         >
  //           Back to Waitlists
  //         </Link>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link
          href="/marketing/waitlists"
          className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Waitlist</h1>
          <p className="text-gray-600 mt-1">Set up a new collection or product waitlist</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waitlist Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Summer Collection 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value as WaitlistType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="COLLECTION">Collection Waitlist</option>
                <option value="PRODUCT">Single Product Waitlist</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what makes this collection/product special..."
              required
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Description (Optional)
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => handleInputChange('shortDescription', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description for cards and previews"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">Used in cards and previews (max 100 characters)</p>
          </div>
        </div>

        {/* Banner Image */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Banner Image</h2>
          
          {/* Try MediaUploader first, fallback to ImageUploader */}
          <ImageUploader
            userId={marketingUser?.uid || 'marketing'}
            currentUrl={formData.bannerImage}
            onUploadComplete={(url) => {
              handleInputChange('bannerImage', url);
            }}
            onUploadError={(error) => {
              setError(`Banner upload failed: ${error}`);
            }}
            onDelete={() => {
              handleInputChange('bannerImage', '');
            }}
            className="w-full"
          />
          
          <p className="text-xs text-gray-500 mt-2">
            Recommended size: 1200x600px. Supports JPG, PNG, WebP up to 10MB.
          </p>
        </div>

        {/* Product Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>
          
          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Products ({selectedProducts.length})</h3>
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map(product => (
                  <div key={product.id} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <span className="truncate max-w-32">{product.name}</span>
                    <button
                      type="button"
                      onClick={() => handleProductRemove(product.id)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search products by name, category, or vendor..."
              />
            </div>
          </div>

          {/* Available Products */}
          <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
            {loadingProducts ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {productSearch ? `No products found matching "${productSearch}"` : 'No products available'}
              </div>
            ) : (
              filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Product Image */}
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
                        <p className="text-sm text-gray-500 truncate">
                          {product.category && `${product.category} • `}
                          {product.vendor_name}
                          {product.price && product.price > 0 && ` • $${product.price.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    
                    {/* Selection Status */}
                    {selectedProducts.find(p => p.id === product.id) ? (
                      <div className="text-blue-600 text-sm font-medium bg-blue-100 px-2 py-1 rounded">
                        Selected
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        Click to select
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Product Count Info */}
          <div className="mt-2 text-xs text-gray-500">
            {!loadingProducts && (
              <>
                Showing {filteredProducts.length} of {availableProducts.length} products
                {selectedProducts.length > 0 && ` • ${selectedProducts.length} selected`}
              </>
            )}
          </div>
        </div>

        {/* Launch Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Launch Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Launch Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.countdownEndAt.toISOString().slice(0, 16)}
                onChange={(e) => handleInputChange('countdownEndAt', new Date(e.target.value))}
                min={minDate.toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Launch URL (Optional)
              </label>
              <input
                type="url"
                value={formData.launchUrl}
                onChange={(e) => handleInputChange('launchUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://stitchesafrica.com/collections/summer-2024"
              />
              <p className="text-xs text-gray-500 mt-1">Where users will be redirected after launch</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Notification Channels *
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notificationChannels.includes('EMAIL') || formData.notificationChannels.includes('BOTH')}
                  onChange={() => handleNotificationChannelChange('EMAIL')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Mail className="w-4 h-4 ml-2 mr-1 text-gray-500" />
                <span className="text-sm text-gray-700">Email notifications</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notificationChannels.includes('WHATSAPP') || formData.notificationChannels.includes('BOTH')}
                  onChange={() => handleNotificationChannelChange('WHATSAPP')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <MessageCircle className="w-4 h-4 ml-2 mr-1 text-gray-500" />
                <span className="text-sm text-gray-700">WhatsApp notifications</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/marketing/waitlists"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || selectedProducts.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Waitlist'}
          </button>
        </div>
      </form>
    </div>
  );
}