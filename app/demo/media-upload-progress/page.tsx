'use client';

import React, { useState } from 'react';
import MediaUploader from '@/components/vendor/storefront/MediaUploader';

export default function MediaUploadProgressDemo() {
  const [uploadResults, setUploadResults] = useState<{
    logo?: string;
    banner?: string;
    video?: string;
  }>({});

  const handleUploadComplete = (type: string) => (url: string, metadata?: any) => {
    console.log(`${type} upload complete:`, { url, metadata });
    setUploadResults(prev => ({ ...prev, [type]: url }));
  };

  const handleUploadError = (type: string) => (error: string) => {
    console.error(`${type} upload error:`, error);
  };

  const handleDelete = (type: string) => () => {
    console.log(`${type} deleted`);
    setUploadResults(prev => ({ ...prev, [type]: undefined }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Media Upload Progress Demo
          </h1>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Logo Upload</h2>
              <MediaUploader
                vendorId="demo-vendor"
                uploadType="logo"
                currentUrl={uploadResults.logo}
                onUploadComplete={handleUploadComplete('logo')}
                onUploadError={handleUploadError('logo')}
                onDelete={handleDelete('logo')}
                className="max-w-md"
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Banner Upload</h2>
              <MediaUploader
                vendorId="demo-vendor"
                uploadType="banner"
                currentUrl={uploadResults.banner}
                onUploadComplete={handleUploadComplete('banner')}
                onUploadError={handleUploadError('banner')}
                onDelete={handleDelete('banner')}
                className="max-w-2xl"
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Video Upload</h2>
              <MediaUploader
                vendorId="demo-vendor"
                uploadType="video"
                currentUrl={uploadResults.video}
                onUploadComplete={handleUploadComplete('video')}
                onUploadError={handleUploadError('video')}
                onDelete={handleDelete('video')}
                className="max-w-2xl"
              />
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Upload Results:</h3>
            <pre className="text-sm text-gray-600 overflow-auto">
              {JSON.stringify(uploadResults, null, 2)}
            </pre>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Progress Bar Features:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Visual progress bar with percentage</li>
              <li>• Real-time progress updates during upload</li>
              <li>• Loading spinner animation</li>
              <li>• File name display during upload</li>
              <li>• Success/error status indicators</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}