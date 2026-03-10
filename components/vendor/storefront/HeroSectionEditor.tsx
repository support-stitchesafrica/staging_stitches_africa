'use client';

import React, {  useState, useEffect , memo } from "react";
import { ThemeConfiguration } from '@/types/storefront';

interface HeroContent {
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

interface BusinessInfo {
  businessName: string;
  description: string;
  handle: string;
  slogan: string;
}

interface HeroSectionEditorProps {
  vendorId: string;
  theme: ThemeConfiguration;
  heroContent?: HeroContent;
  businessInfo?: BusinessInfo;
  onContentChange: (content: HeroContent) => void;
  onBusinessInfoChange: (info: BusinessInfo) => void;
  onSave: (content: HeroContent, businessInfo: BusinessInfo) => Promise<void>;
}

function HeroSectionEditor({
  vendorId,
  theme,
  heroContent,
  businessInfo,
  onContentChange,
  onBusinessInfoChange,
  onSave
}: HeroSectionProps) {
  const [content, setContent] = useState<HeroContent>({
    title: heroContent?.title || businessInfo?.businessName || 'Your Brand Name',
    subtitle: heroContent?.subtitle || businessInfo?.slogan || 'Your Brand Slogan',
    description: heroContent?.description || businessInfo?.description || 'Discover our amazing collection',
    ctaText: heroContent?.ctaText || 'Shop Now',
    ctaLink: heroContent?.ctaLink || '#products'
  });

  const [business, setBusiness] = useState<BusinessInfo>({
    businessName: businessInfo?.businessName || 'Your Business',
    description: businessInfo?.description || 'Business description',
    handle: businessInfo?.handle || 'your-handle',
    slogan: businessInfo?.slogan || 'Your slogan here'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'business'>('hero');

  // Update parent components when content changes
  useEffect(() => {
    onContentChange(content);
  }, [content, onContentChange]);

  useEffect(() => {
    onBusinessInfoChange(business);
  }, [business, onBusinessInfoChange]);

  const handleContentChange = (field: keyof HeroContent, value: string) => {
    const newContent = { ...content, [field]: value };
    setContent(newContent);
  };

  const handleBusinessChange = (field: keyof BusinessInfo, value: string) => {
    const newBusiness = { ...business, [field]: value };
    setBusiness(newBusiness);
    
    // Auto-sync business name to hero title if they match
    if (field === 'businessName' && content.title === business.businessName) {
      handleContentChange('title', value);
    }
    
    // Auto-sync slogan to hero subtitle if they match
    if (field === 'slogan' && content.subtitle === business.slogan) {
      handleContentChange('subtitle', value);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(content, business);
    } catch (error) {
      console.error('Error saving hero content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const syncBusinessToHero = () => {
    setContent(prev => ({
      ...prev,
      title: business.businessName,
      subtitle: business.slogan,
      description: business.description
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Hero Section & Business Info
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
            isSaving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('hero')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'hero'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Hero Content
        </button>
        <button
          onClick={() => setActiveTab('business')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'business'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Business Info
        </button>
      </div>

      {activeTab === 'hero' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Hero Section Content</h3>
            <button
              onClick={syncBusinessToHero}
              className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
            >
              Sync from Business Info
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Title
            </label>
            <input
              type="text"
              value={content.title}
              onChange={(e) => handleContentChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your Brand Name"
            />
            <p className="mt-1 text-xs text-gray-500">
              This will be the main headline on your storefront
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle/Slogan
            </label>
            <input
              type="text"
              value={content.subtitle}
              onChange={(e) => handleContentChange('subtitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your Brand Slogan"
            />
            <p className="mt-1 text-xs text-gray-500">
              A catchy tagline that describes your brand
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={content.description}
              onChange={(e) => handleContentChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what makes your brand special..."
            />
            <p className="mt-1 text-xs text-gray-500">
              A brief description of your products or brand story
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call-to-Action Text
              </label>
              <input
                type="text"
                value={content.ctaText}
                onChange={(e) => handleContentChange('ctaText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Shop Now"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CTA Link
              </label>
              <input
                type="text"
                value={content.ctaLink}
                onChange={(e) => handleContentChange('ctaLink', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#products"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <div className="text-center">
              <h1 
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ 
                  color: theme.colors.primary,
                  fontFamily: theme.typography.headingFont 
                }}
              >
                {content.title}
              </h1>
              <p 
                className="text-lg mb-3"
                style={{ 
                  color: theme.colors.secondary,
                  fontFamily: theme.typography.bodyFont 
                }}
              >
                {content.subtitle}
              </p>
              <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                {content.description}
              </p>
              <button
                className="px-6 py-2 text-white rounded-md font-medium"
                style={{ backgroundColor: theme.colors.primary }}
              >
                {content.ctaText}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'business' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Business Information</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={business.businessName}
              onChange={(e) => handleBusinessChange('businessName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your Business Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Handle
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                store/
              </span>
              <input
                type="text"
                value={business.handle}
                onChange={(e) => handleBusinessChange('handle', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-store-handle"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              This will be your storefront URL: /store/{business.handle}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Slogan
            </label>
            <input
              type="text"
              value={business.slogan}
              onChange={(e) => handleBusinessChange('slogan', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your brand slogan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Description
            </label>
            <textarea
              value={business.description}
              onChange={(e) => handleBusinessChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell customers about your business, what you sell, and what makes you unique..."
            />
          </div>

          {/* Business Info Preview */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Business Card Preview</h4>
            <div className="bg-white p-4 rounded border">
              <h3 className="font-bold text-lg text-gray-900">{business.businessName}</h3>
              <p className="text-sm text-gray-600 italic">"{business.slogan}"</p>
              <p className="text-sm text-gray-700 mt-2">{business.description}</p>
              <p className="text-xs text-gray-500 mt-2">store/{business.handle}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(HeroSectionEditor);