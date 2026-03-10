'use client';

import { useState } from 'react';
import MediaUploader from '@/components/vendor/storefront/MediaUploader';

export default function MediaUploadDemo() {
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [bannerUrl, setBannerUrl] = useState<string | undefined>();
  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [uploadMessage, setUploadMessage] = useState<string>('');

  const handleUploadComplete = (type: string) => (url: string, metadata?: any) => {
    setUploadMessage(`${type} uploaded successfully!`);
    console.log(`${type} uploaded:`, { url, metadata });
    
    // Clear message after 3 seconds
    setTimeout(() => setUploadMessage(''), 3000);
  };

  const handleUploadError = (type: string) => (error: string) => {
    setUploadMessage(`${type} upload failed: ${error}`);
    console.error(`${type} upload error:`, error);
    
    // Clear message after 5 seconds
    setTimeout(() => setUploadMessage(''), 5000);
  };

  const handleDelete = (type: string) => () => {
    switch (type) {
      case 'logo':
        setLogoUrl(undefined);
        break;
      case 'banner':
        setBannerUrl(undefined);
        break;
      case 'video':
        setVideoUrl(undefined);
        break;
    }
    setUploadMessage(`${type} deleted successfully!`);
    setTimeout(() => setUploadMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Media Upload Demo</h1>
          <p className="mt-2 text-gray-600">
            Test the drag & drop file upload functionality for storefront media assets.
          </p>
          
          {uploadMessage && (
            <div className={`mt-4 p-4 rounded-md ${
              uploadMessage.includes('failed') || uploadMessage.includes('error')
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-green-50 border border-green-200 text-green-800'
            }`}>
              {uploadMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Logo Upload */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Logo Upload</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload your store logo. Supports JPG, PNG, WebP up to 10MB.
            </p>
            <MediaUploader
              vendorId="demo-vendor"
              uploadType="logo"
              currentUrl={logoUrl}
              onUploadComplete={handleUploadComplete('Logo')}
              onUploadError={handleUploadError('Logo')}
              onDelete={handleDelete('logo')}
            />
          </div>

          {/* Banner Upload */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Banner Upload</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload your store banner. Supports JPG, PNG, WebP up to 10MB.
            </p>
            <MediaUploader
              vendorId="demo-vendor"
              uploadType="banner"
              currentUrl={bannerUrl}
              onUploadComplete={handleUploadComplete('Banner')}
              onUploadError={handleUploadError('Banner')}
              onDelete={handleDelete('banner')}
            />
          </div>

          {/* Video Upload */}
          <div className="bg-white rounded-lg shadow-sm border p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Banner Upload</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload a video banner for your store. Supports MP4, WebM up to 100MB.
            </p>
            <MediaUploader
              vendorId="demo-vendor"
              uploadType="video"
              currentUrl={videoUrl}
              onUploadComplete={handleUploadComplete('Video')}
              onUploadError={handleUploadError('Video')}
              onDelete={handleDelete('video')}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">How to Test</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Drag & Drop:</strong> Drag files from your computer directly onto the upload areas</li>
            <li>• <strong>Click to Upload:</strong> Click on any upload area to open the file picker</li>
            <li>• <strong>File Validation:</strong> Try uploading unsupported file types to see validation in action</li>
            <li>• <strong>Progress Tracking:</strong> Watch the upload progress bar during file processing</li>
            <li>• <strong>Preview & Delete:</strong> View uploaded files and delete them using the X button</li>
          </ul>
        </div>

        {/* Current State Display */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Upload State</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Logo:</strong>
              <div className="mt-1 text-gray-600">
                {logoUrl ? (
                  <a href={logoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Logo
                  </a>
                ) : (
                  'No logo uploaded'
                )}
              </div>
            </div>
            <div>
              <strong>Banner:</strong>
              <div className="mt-1 text-gray-600">
                {bannerUrl ? (
                  <a href={bannerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Banner
                  </a>
                ) : (
                  'No banner uploaded'
                )}
              </div>
            </div>
            <div>
              <strong>Video:</strong>
              <div className="mt-1 text-gray-600">
                {videoUrl ? (
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Video
                  </a>
                ) : (
                  'No video uploaded'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}