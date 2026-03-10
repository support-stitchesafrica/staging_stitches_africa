'use client';

import { useState } from 'react';
import { ThemeConfiguration } from '@/types/storefront';

interface ThemeCustomizerProps {
  theme: ThemeConfiguration;
  onThemeChange: (theme: ThemeConfiguration) => void;
}

const fontOptions = [
  { value: 'Inter', label: 'Inter', category: 'Modern' },
  { value: 'Poppins', label: 'Poppins', category: 'Modern' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'Elegant' },
  { value: 'Merriweather', label: 'Merriweather', category: 'Classic' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro', category: 'Clean' },
  { value: 'Roboto', label: 'Roboto', category: 'Tech' },
  { value: 'Open Sans', label: 'Open Sans', category: 'Friendly' },
  { value: 'Montserrat', label: 'Montserrat', category: 'Fashion' },
  { value: 'Lora', label: 'Lora', category: 'Artisan' },
  { value: 'Space Grotesk', label: 'Space Grotesk', category: 'Tech' }
];

const colorPresets = [
  {
    name: 'Luxury Gold',
    colors: {
      primary: '#D4AF37',
      secondary: '#8B7355',
      accent: '#F5F5DC',
      background: '#FFFFFF',
      text: '#2C2C2C'
    }
  },
  {
    name: 'Modern Indigo',
    colors: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#F59E0B',
      background: '#FFFFFF',
      text: '#1F2937'
    }
  },
  {
    name: 'Emerald Fresh',
    colors: {
      primary: '#059669',
      secondary: '#0D9488',
      accent: '#F97316',
      background: '#F8FAFC',
      text: '#0F172A'
    }
  },
  {
    name: 'Rose Elegant',
    colors: {
      primary: '#E11D48',
      secondary: '#BE185D',
      accent: '#FBBF24',
      background: '#FFFBF7',
      text: '#1C1917'
    }
  },
  {
    name: 'Dark Luxury',
    colors: {
      primary: '#F59E0B',
      secondary: '#D97706',
      accent: '#FCD34D',
      background: '#0F0F0F',
      text: '#F8F9FA'
    }
  },
  {
    name: 'Ocean Blue',
    colors: {
      primary: '#0EA5E9',
      secondary: '#0284C7',
      accent: '#38BDF8',
      background: '#F0F9FF',
      text: '#0C4A6E'
    }
  }
];

export function ThemeCustomizer({ theme, onThemeChange }: ThemeCustomizerProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography'>('colors');

  const handleColorChange = (colorKey: keyof ThemeConfiguration['colors'], value: string) => {
    const updatedTheme = {
      ...theme,
      colors: {
        ...theme.colors,
        [colorKey]: value
      }
    };
    onThemeChange(updatedTheme);
  };

  const handleFontChange = (fontType: 'headingFont' | 'bodyFont', value: string) => {
    const updatedTheme = {
      ...theme,
      typography: {
        ...theme.typography,
        [fontType]: value
      }
    };
    onThemeChange(updatedTheme);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('colors')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'colors'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Colors
        </button>
        <button
          onClick={() => setActiveTab('typography')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'typography'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Typography
        </button>
      </div>

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          <h3 className="text-sm font-medium text-gray-900">Color Palette</h3>
          
          {/* Color Presets */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Quick Presets</h4>
            <div className="grid grid-cols-2 gap-2">
              {colorPresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const updatedTheme = {
                      ...theme,
                      colors: preset.colors
                    };
                    onThemeChange(updatedTheme);
                  }}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors group"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.colors.primary }}
                    ></div>
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.colors.secondary }}
                    ></div>
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.colors.accent }}
                    ></div>
                  </div>
                  <p className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                    {preset.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4"></div>
          
          {/* Primary Color */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Primary Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={theme.colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={theme.colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Secondary Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={theme.colors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={theme.colors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#64748B"
              />
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Accent Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={theme.colors.accent}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={theme.colors.accent}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#F59E0B"
              />
            </div>
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Background Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={theme.colors.background}
                onChange={(e) => handleColorChange('background', e.target.value)}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={theme.colors.background}
                onChange={(e) => handleColorChange('background', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#FFFFFF"
              />
            </div>
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Text Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={theme.colors.text}
                onChange={(e) => handleColorChange('text', e.target.value)}
                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={theme.colors.text}
                onChange={(e) => handleColorChange('text', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#1F2937"
              />
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-4 rounded-lg border" style={{ backgroundColor: theme.colors.background }}>
            <h4 className="text-sm font-medium mb-3" style={{ color: theme.colors.text }}>
              Color Preview
            </h4>
            <div className="flex space-x-2">
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: theme.colors.primary }}
                title="Primary"
              ></div>
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: theme.colors.secondary }}
                title="Secondary"
              ></div>
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: theme.colors.accent }}
                title="Accent"
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Typography Tab */}
      {activeTab === 'typography' && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Typography</h3>
          
          {/* Heading Font */}
          <div className="space-y-2">
            <label htmlFor="heading-font" className="block text-sm font-medium text-gray-700">
              Heading Font
            </label>
            <select
              id="heading-font"
              value={theme.typography.headingFont}
              onChange={(e) => handleFontChange('headingFont', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label} ({font.category})
                </option>
              ))}
            </select>
          </div>

          {/* Body Font */}
          <div className="space-y-2">
            <label htmlFor="body-font" className="block text-sm font-medium text-gray-700">
              Body Font
            </label>
            <select
              id="body-font"
              value={theme.typography.bodyFont}
              onChange={(e) => handleFontChange('bodyFont', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label} ({font.category})
                </option>
              ))}
            </select>
          </div>

          {/* Typography Preview */}
          <div className="mt-6 p-4 rounded-lg border bg-white">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Typography Preview</h4>
            <div className="space-y-3">
              <h1 
                className="text-2xl font-bold"
                style={{ 
                  fontFamily: theme.typography.headingFont,
                  color: theme.colors.text 
                }}
              >
                Heading Example
              </h1>
              <p 
                className="text-base"
                style={{ 
                  fontFamily: theme.typography.bodyFont,
                  color: theme.colors.text 
                }}
              >
                This is an example of body text using your selected font. It shows how your content will appear to visitors.
              </p>
              <button
                className="px-4 py-2 rounded-md text-white text-sm font-medium"
                style={{ backgroundColor: theme.colors.primary }}
              >
                Button Example
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}