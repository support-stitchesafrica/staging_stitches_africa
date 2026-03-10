'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { StorefrontConfig } from '@/types/storefront';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface StorefrontOrderSuccessProps {
  storefront: StorefrontConfig;
  orderId: string;
}

export default function StorefrontOrderSuccess({ storefront, orderId }: StorefrontOrderSuccessProps) {
  const router = useRouter();

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundColor: storefront.theme.colors.background,
        color: storefront.theme.colors.text,
        fontFamily: storefront.theme.typography.bodyFont,
      }}
    >
      <div className="max-w-md w-full mx-4">
        <div className="text-center">
          {/* Success Icon */}
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: storefront.theme.colors.primary + '20' }}
          >
            <CheckCircle 
              className="w-12 h-12"
              style={{ color: storefront.theme.colors.primary }}
            />
          </div>

          {/* Success Message */}
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ 
              color: storefront.theme.colors.primary,
              fontFamily: storefront.theme.typography.headingFont,
            }}
          >
            Order Confirmed!
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Thank you for your purchase from {storefront.handle}
          </p>

          {/* Order Details */}
          <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 text-left">
            <h2 className="text-lg font-semibold mb-4">Order Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span 
                  className="font-medium"
                  style={{ color: storefront.theme.colors.primary }}
                >
                  Confirmed
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              What's Next?
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5" />
                <span>You'll receive an order confirmation email shortly</span>
              </div>
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 mt-0.5" />
                <span>We'll notify you when your order ships</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5" />
                <span>Estimated delivery: 3-5 business days</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href={`/store/${storefront.handle}`}
              className="w-full px-6 py-3 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: storefront.theme.colors.primary }}
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <button
              onClick={() => window.print()}
              className="w-full px-6 py-3 border-2 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold"
              style={{ 
                borderColor: storefront.theme.colors.primary,
                color: storefront.theme.colors.primary
              }}
            >
              Print Receipt
            </button>
          </div>

          {/* Contact Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Questions about your order? Contact {storefront.handle} support
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}