/**
 * Storefront Not Found Page
 * Displayed when a storefront handle is invalid or private
 */

import Link from 'next/link';

export default function StorefrontNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center bg-white p-12 rounded-xl shadow-2xl max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Store Not Found</h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          The store you're looking for doesn't exist or is currently unavailable.
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Link 
            href="/" 
            className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-200 no-underline"
          >
            Back to Stitches Africa
          </Link>
          <Link 
            href="/shops" 
            className="px-6 py-3 bg-transparent text-blue-600 border-2 border-blue-600 rounded-md font-semibold hover:bg-blue-600 hover:text-white hover:-translate-y-0.5 transition-all duration-200 no-underline"
          >
            Browse All Stores
          </Link>
        </div>
      </div>
    </div>
  );
}