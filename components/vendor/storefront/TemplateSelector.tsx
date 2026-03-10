'use client';

import { useState } from 'react';
import { StorefrontTemplate, ThemeConfiguration } from '@/types/storefront';
import Image from 'next/image';

// Advanced template data with modern, responsive designs
const templates: StorefrontTemplate[] = [
  {
    id: 'luxury-jewelry',
    name: 'Luxury Jewelry',
    description: 'Elegant design perfect for jewelry, accessories, and luxury goods',
    category: 'modern',
    previewImage: '/templates/luxury-jewelry-preview.jpg',
    features: ['Elegant product showcase', 'Premium feel', 'Mobile-first', 'High-end aesthetics', 'Image-focused'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    defaultTheme: {
      colors: {
        primary: '#D4AF37',
        secondary: '#8B7355',
        accent: '#F5F5DC',
        background: '#FFFFFF',
        text: '#2C2C2C'
      },
      typography: {
        headingFont: 'Playfair Display',
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
        headerStyle: 'luxury',
        productCardStyle: 'elegant',
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem'
        }
      },
      media: {}
    }
  },
  {
    id: 'modern-fashion',
    name: 'Modern Fashion',
    description: 'Contemporary design with clean lines and sophisticated layouts',
    category: 'modern',
    previewImage: '/templates/modern-fashion-preview.jpg',
    features: ['Clean aesthetics', 'Grid layouts', 'Minimalist design', 'Fashion-focused', 'Responsive'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    defaultTheme: {
      colors: {
        primary: '#1A1A1A',
        secondary: '#666666',
        accent: '#E5E5E5',
        background: '#FAFAFA',
        text: '#333333'
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
        headerStyle: 'modern-clean',
        productCardStyle: 'minimal-card',
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem'
        }
      },
      media: {}
    }
  },
  {
    id: 'artisan-craft',
    name: 'Artisan Craft',
    description: 'Warm, handcrafted feel perfect for artisan and handmade products',
    category: 'classic',
    previewImage: '/templates/artisan-craft-preview.jpg',
    features: ['Warm aesthetics', 'Handcrafted feel', 'Organic layouts', 'Artisan-focused', 'Cozy design'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    defaultTheme: {
      colors: {
        primary: '#8B4513',
        secondary: '#A0522D',
        accent: '#DEB887',
        background: '#FFF8DC',
        text: '#4A4A4A'
      },
      typography: {
        headingFont: 'Merriweather',
        bodyFont: 'Source Sans Pro',
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
        headerStyle: 'artisan',
        productCardStyle: 'warm-card',
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem'
        }
      },
      media: {}
    }
  },
  {
    id: 'tech-minimal',
    name: 'Tech Minimal',
    description: 'Ultra-modern design with bold typography and clean interfaces',
    category: 'minimal',
    previewImage: '/templates/tech-minimal-preview.jpg',
    features: ['Ultra-clean', 'Bold typography', 'Tech-focused', 'Minimal UI', 'High contrast'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    defaultTheme: {
      colors: {
        primary: '#0070F3',
        secondary: '#666666',
        accent: '#F0F0F0',
        background: '#FFFFFF',
        text: '#000000'
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
        headerStyle: 'tech-minimal',
        productCardStyle: 'tech-card',
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem'
        }
      },
      media: {}
    }
  },
  {
    id: 'modern-grid',
    name: 'Modern Grid',
    description: 'Clean e-commerce layout with advanced filtering and sorting options',
    category: 'modern',
    previewImage: '/templates/modern-grid-preview.jpg',
    features: ['Advanced filters', 'Sort options', 'Grid layout', 'Wishlist support', 'Mobile responsive'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    defaultTheme: {
      colors: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#F5F5F5',
        background: '#FFFFFF',
        text: '#333333'
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
        headerStyle: 'modern-grid',
        productCardStyle: 'grid-card',
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem'
        }
      },
      media: {}
    }
  }
];

interface TemplateSelectorProps {
  selectedTemplate: StorefrontTemplate | null;
  onTemplateSelect: (template: StorefrontTemplate) => void;
}

export function TemplateSelector({ selectedTemplate, onTemplateSelect }: TemplateSelectorProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className={`relative border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
            selectedTemplate?.id === template.id
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
          onClick={() => onTemplateSelect(template)}
          onMouseEnter={() => setHoveredTemplate(template.id)}
          onMouseLeave={() => setHoveredTemplate(null)}
        >
          {/* Template Preview */}
          <div className="relative w-full h-40 mb-3 rounded-md overflow-hidden bg-gray-100">
            {/* Advanced template previews with realistic layouts */}
            <div className="w-full h-full relative">
              {template.id === 'luxury-jewelry' && (
                <div className="w-full h-full bg-gradient-to-b from-white to-gray-50 border">
                  {/* Header */}
                  <div className="h-6 bg-white border-b flex items-center px-2">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mr-1"></div>
                    <div className="h-1 bg-gray-300 rounded flex-1 mr-2"></div>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                  {/* Hero */}
                  <div className="h-8 bg-gradient-to-r from-yellow-50 to-yellow-100 flex items-center justify-center">
                    <div className="text-xs text-yellow-800 font-semibold">✨ Luxury Collection</div>
                  </div>
                  {/* Products */}
                  <div className="p-2 grid grid-cols-4 gap-1">
                    <div className="aspect-square bg-white rounded shadow-sm border border-yellow-200"></div>
                    <div className="aspect-square bg-white rounded shadow-sm border border-yellow-200"></div>
                    <div className="aspect-square bg-white rounded shadow-sm border border-yellow-200"></div>
                    <div className="aspect-square bg-white rounded shadow-sm border border-yellow-200"></div>
                  </div>
                </div>
              )}
              {template.id === 'modern-fashion' && (
                <div className="w-full h-full bg-gray-50 border">
                  {/* Header */}
                  <div className="h-6 bg-white border-b flex items-center px-2">
                    <div className="w-2 h-2 bg-black rounded-sm mr-1"></div>
                    <div className="h-1 bg-gray-800 rounded flex-1 mr-2"></div>
                    <div className="flex space-x-1">
                      <div className="w-3 h-1 bg-gray-300 rounded"></div>
                      <div className="w-3 h-1 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  {/* Hero */}
                  <div className="h-8 bg-black flex items-center justify-center">
                    <div className="text-xs text-white font-light">MODERN COLLECTION</div>
                  </div>
                  {/* Products Grid */}
                  <div className="p-2 grid grid-cols-3 gap-2">
                    <div className="aspect-square bg-white rounded-sm"></div>
                    <div className="aspect-square bg-white rounded-sm"></div>
                    <div className="aspect-square bg-white rounded-sm"></div>
                  </div>
                </div>
              )}
              {template.id === 'artisan-craft' && (
                <div className="w-full h-full bg-yellow-50 border border-yellow-200">
                  {/* Header */}
                  <div className="h-6 bg-yellow-100 border-b border-yellow-200 flex items-center px-2">
                    <div className="w-2 h-2 bg-yellow-700 rounded-full mr-1"></div>
                    <div className="h-1 bg-yellow-600 rounded flex-1 mr-2"></div>
                    <div className="text-xs text-yellow-800">🏺</div>
                  </div>
                  {/* Hero */}
                  <div className="h-8 bg-gradient-to-r from-yellow-100 to-orange-100 flex items-center justify-center">
                    <div className="text-xs text-yellow-900 font-medium">Handcrafted Goods</div>
                  </div>
                  {/* Products */}
                  <div className="p-2 grid grid-cols-2 gap-2">
                    <div className="aspect-square bg-white rounded border border-yellow-300 shadow-sm"></div>
                    <div className="aspect-square bg-white rounded border border-yellow-300 shadow-sm"></div>
                  </div>
                </div>
              )}
              {template.id === 'tech-minimal' && (
                <div className="w-full h-full bg-white border">
                  {/* Header */}
                  <div className="h-6 bg-white border-b flex items-center px-2">
                    <div className="w-2 h-2 bg-blue-500 rounded mr-1"></div>
                    <div className="h-1 bg-gray-900 rounded flex-1 mr-2"></div>
                    <div className="w-4 h-1 bg-blue-500 rounded"></div>
                  </div>
                  {/* Hero */}
                  <div className="h-8 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                    <div className="text-xs text-white font-bold">TECH</div>
                  </div>
                  {/* Products */}
                  <div className="p-2 space-y-1">
                    <div className="h-4 bg-gray-100 rounded flex items-center px-1">
                      <div className="w-3 h-3 bg-white rounded mr-1 shadow-sm"></div>
                      <div className="h-1 bg-gray-300 rounded flex-1"></div>
                    </div>
                    <div className="h-4 bg-gray-100 rounded flex items-center px-1">
                      <div className="w-3 h-3 bg-white rounded mr-1 shadow-sm"></div>
                      <div className="h-1 bg-gray-300 rounded flex-1"></div>
                    </div>
                  </div>
                </div>
              )}
              {template.id === 'modern-grid' && (
                <div className="w-full h-full bg-white border">
                  {/* Header with filters */}
                  <div className="h-6 bg-white border-b flex items-center px-2">
                    <div className="w-2 h-2 bg-black rounded-sm mr-1"></div>
                    <div className="h-1 bg-gray-800 rounded flex-1 mr-2"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  </div>
                  {/* Filter bar */}
                  <div className="h-4 bg-gray-50 border-b flex items-center px-2 space-x-1">
                    <div className="w-4 h-2 bg-gray-300 rounded text-xs"></div>
                    <div className="w-3 h-2 bg-black rounded text-xs"></div>
                    <div className="w-3 h-2 bg-gray-300 rounded text-xs"></div>
                    <div className="flex-1"></div>
                    <div className="w-6 h-2 bg-gray-300 rounded text-xs"></div>
                  </div>
                  {/* Product Grid */}
                  <div className="p-2 grid grid-cols-4 gap-1">
                    <div className="aspect-square bg-gray-100 rounded-sm relative">
                      <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="aspect-square bg-gray-100 rounded-sm relative">
                      <div className="absolute top-0.5 left-0.5 w-2 h-1 bg-red-500 rounded text-xs"></div>
                      <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="aspect-square bg-gray-100 rounded-sm relative">
                      <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="aspect-square bg-gray-100 rounded-sm relative">
                      <div className="absolute top-0.5 left-0.5 w-2 h-1 bg-red-500 rounded text-xs"></div>
                      <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Selection indicator */}
            {selectedTemplate?.id === template.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Template Info */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                template.category === 'minimal' ? 'bg-gray-100 text-gray-800' :
                template.category === 'modern' ? 'bg-blue-100 text-blue-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {template.category}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{template.description}</p>
            
            {/* Features */}
            <div className="flex flex-wrap gap-1">
              {template.features.slice(0, 2).map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  {feature}
                </span>
              ))}
              {template.features.length > 2 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  +{template.features.length - 2} more
                </span>
              )}
            </div>
          </div>

          {/* Hover effect */}
          {hoveredTemplate === template.id && selectedTemplate?.id !== template.id && (
            <div className="absolute inset-0 bg-blue-50 bg-opacity-50 rounded-lg pointer-events-none"></div>
          )}
        </div>
      ))}
    </div>
  );
}