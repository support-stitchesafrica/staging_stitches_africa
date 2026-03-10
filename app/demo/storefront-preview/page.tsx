/**
 * Storefront Preview Demo Page
 * Shows how a storefront would look to customers
 */

'use client';

import React, { useState, useEffect } from 'react';
import StorefrontRenderer from '@/components/storefront/StorefrontRenderer';
import { StorefrontCartProvider } from '@/contexts/StorefrontCartContext';
import { StorefrontConfig } from '@/types/storefront';
import { Button } from '@/components/ui/button';
import { Eye, ExternalLink, ArrowLeft } from 'lucide-react';

export default function StorefrontPreviewPage() {
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Demo storefront configuration
  const demoStorefront: StorefrontConfig = {
    id: 'demo-storefront',
    vendorId: 'demo-vendor',
    handle: 'demo-fashion-store',
    isPublic: true,
    templateId: 'modern',
    theme: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#111827'
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        }
      },
      layout: {
        headerStyle: 'modern',
        productCardStyle: 'card',
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '3rem',
          '2xl': '6rem'
        }
      },
      media: {
        logoUrl: '/placeholder-logo.svg',
        bannerUrl: '/placeholder-banner.jpg'
      }
    },
    pages: [{
      id: 'home',
      type: 'home',
      title: 'Featured Products',
      content: [],
      seoMetadata: {
        title: 'Demo Fashion Store - Premium Clothing',
        description: 'Discover our curated collection of premium fashion items',
        keywords: ['fashion', 'clothing', 'style'],
        ogTitle: 'Demo Fashion Store',
        ogDescription: 'Premium fashion for the modern lifestyle'
      },
      productDisplay: {
        layout: 'grid',
        productsPerPage: 12,
        showFilters: true,
        showSorting: true,
        cartIntegration: {
          enabled: true,
          redirectToStitchesAfrica: true
        },
        promotionalDisplay: {
          showBadges: true,
          showBanners: true,
          highlightPromotions: true
        }
      }
    }],
    analytics: {
      enabled: true,
      customEvents: [],
      retentionDays: 90,
      exportEnabled: true
    },
    socialPixels: {
      facebook: {
        pixelId: '123456789012345',
        enabled: true
      },
      tiktok: {
        pixelId: 'ABCD1234567890EFGH12',
        enabled: true
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  useEffect(() => {
    // Get vendor ID from localStorage
    const storedVendorId = localStorage.getItem("tailorUID");
    setVendorId(storedVendorId);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Preview Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <a href="/vendor/storefront" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </a>
              </Button>
              
              <div className="h-6 w-px bg-gray-300"></div>
              
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Storefront Preview</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Preview Mode - Not visible to customers
              </div>
              
              <Button size="sm" asChild>
                <a 
                  href={`/store/${demoStorefront.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Live Store
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="bg-white">
        <StorefrontCartProvider>
          <StorefrontRenderer 
            storefront={demoStorefront}
            className="min-h-screen"
          />
        </StorefrontCartProvider>
      </div>

      {/* Preview Footer */}
      <div className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">This is a preview of your storefront</h3>
            <p className="text-gray-300 mb-4">
              Customize your store's appearance, add your products, and configure settings to make it your own.
            </p>
            
            <div className="flex justify-center gap-4">
              <Button variant="secondary" asChild>
                <a href="/vendor/storefront/settings">
                  Configure Settings
                </a>
              </Button>
              
              <Button variant="secondary" asChild>
                <a href="/vendor/storefront/design">
                  Customize Design
                </a>
              </Button>
              
              <Button asChild>
                <a href="/vendor/products">
                  Manage Products
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}