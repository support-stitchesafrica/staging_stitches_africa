'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import StorefrontRenderer from '@/components/storefront/StorefrontRenderer';
import { StorefrontCartProvider } from '@/contexts/StorefrontCartContext';
import { StorefrontConfig } from '@/types/storefront';
import { ExternalLink, ArrowLeft, Eye } from 'lucide-react';



export default function StorefrontPreviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [storefront, setStorefront] = useState<StorefrontConfig | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/vendor/auth');
    }
  }, [user, authLoading, router]);

  // Load complete storefront configuration
  useEffect(() => {
    const loadStorefrontData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        
        // Load complete storefront configuration
        const response = await fetch(`/api/storefront/config?vendorId=${user.uid}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setStorefront(result.data);
          } else {
            setError('No storefront configuration found. Please set up your storefront first.');
          }
        } else {
          setError('Failed to load storefront configuration.');
        }
      } catch (error) {
        console.error('Error loading storefront data:', error);
        setError('An error occurred while loading your storefront.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadStorefrontData();
    }
  }, [user]);

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleViewLiveStore = () => {
    if (storefront?.handle) {
      window.open(`/store/${storefront.handle}`, '_blank');
    } else {
      alert('Please set up your storefront handle first in the settings.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your storefront preview...</p>
        </div>
      </div>
    );
  }

  if (error || !storefront) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Storefront Not Found</h3>
          <p className="text-gray-600 mb-4">{error || 'Please set up your storefront configuration first.'}</p>
          <button
            onClick={() => router.push('/vendor/storefront/settings')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button
            onClick={handleFullscreenToggle}
            className="px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-colors"
          >
            Exit Fullscreen
          </button>
          {storefront?.handle && (
            <button
              onClick={handleViewLiveStore}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Live
            </button>
          )}
        </div>
        <StorefrontCartProvider>
          <StorefrontRenderer 
            storefront={storefront}
            isEditable={false}
            className="min-h-screen"
          />
        </StorefrontCartProvider>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/vendor/storefront/design')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Design
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Store Preview</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleFullscreenToggle}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fullscreen Preview
              </button>
              {storefront?.handle && (
                <button
                  onClick={handleViewLiveStore}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Live Store
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Preview Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Your Storefront Preview</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {storefront?.handle 
                    ? `This is how your store will appear at: /store/${storefront.handle}`
                    : 'Set up your storefront handle in settings to get a live URL'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                Live Preview
              </div>
            </div>
          </div>

          {/* Preview Container */}
          <div className="p-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <StorefrontCartProvider>
                <StorefrontRenderer 
                  storefront={storefront}
                  isEditable={false}
                />
              </StorefrontCartProvider>
            </div>
          </div>

          {/* Preview Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Preview updates automatically when you make changes to your theme or products.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/vendor/storefront/design')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Customize Design
                </button>
                <button
                  onClick={() => router.push('/vendor/products')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Manage Products
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Customize Design</h3>
            <p className="text-gray-600 text-sm mb-4">
              Change colors, fonts, and layout to match your brand.
            </p>
            <button
              onClick={() => router.push('/vendor/storefront/design')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Go to Design →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add Products</h3>
            <p className="text-gray-600 text-sm mb-4">
              Upload and manage your product catalog.
            </p>
            <button
              onClick={() => router.push('/vendor/products')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Manage Products →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Store Settings</h3>
            <p className="text-gray-600 text-sm mb-4">
              Configure your store URL, SEO, and other settings.
            </p>
            <button
              onClick={() => router.push('/vendor/storefront/settings')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View Settings →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}