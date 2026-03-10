'use client';

import { ThemeConfiguration } from '@/types/storefront';

interface ThemeVariantsProps {
  theme: ThemeConfiguration;
  onThemeChange: (theme: ThemeConfiguration) => void;
}

export function ThemeVariants({ theme, onThemeChange }: ThemeVariantsProps) {
  const updateVariant = (key: string, value: any) => {
    const updatedTheme = {
      ...theme,
      variants: {
        ...theme.variants,
        [key]: value
      }
    };
    onThemeChange(updatedTheme);
  };

  const updateLayout = (key: string, value: any) => {
    const updatedTheme = {
      ...theme,
      layout: {
        ...theme.layout,
        [key]: value
      }
    };
    onThemeChange(updatedTheme);
  };

  const updateColors = (key: string, value: string) => {
    const updatedTheme = {
      ...theme,
      colors: {
        ...theme.colors,
        [key]: value
      }
    };
    onThemeChange(updatedTheme);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Button Style</h4>
        <div className="grid grid-cols-3 gap-2">
          {['filled', 'outlined', 'ghost'].map((style) => (
            <button
              key={style}
              onClick={() => updateVariant('buttonStyle', style)}
              className={`p-3 text-xs font-medium rounded border-2 transition-colors ${
                theme.variants?.buttonStyle === style
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Card Style</h4>
        <div className="grid grid-cols-3 gap-2">
          {['flat', 'elevated', 'bordered'].map((style) => (
            <button
              key={style}
              onClick={() => updateVariant('cardStyle', style)}
              className={`p-3 text-xs font-medium rounded border-2 transition-colors ${
                theme.variants?.cardStyle === style
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Border Radius</h4>
        <div className="grid grid-cols-4 gap-2">
          {['none', 'small', 'medium', 'large'].map((radius) => (
            <button
              key={radius}
              onClick={() => updateLayout('borderRadius', radius)}
              className={`p-3 text-xs font-medium rounded border-2 transition-colors ${
                theme.layout.borderRadius === radius
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {radius.charAt(0).toUpperCase() + radius.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Shadows</h4>
        <div className="grid grid-cols-4 gap-2">
          {['none', 'subtle', 'medium', 'strong'].map((shadow) => (
            <button
              key={shadow}
              onClick={() => updateLayout('shadows', shadow)}
              className={`p-3 text-xs font-medium rounded border-2 transition-colors ${
                theme.layout.shadows === shadow
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {shadow.charAt(0).toUpperCase() + shadow.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Animation Level</h4>
        <div className="grid grid-cols-4 gap-2">
          {['none', 'subtle', 'moderate', 'high'].map((level) => (
            <button
              key={level}
              onClick={() => updateVariant('animationLevel', level)}
              className={`p-3 text-xs font-medium rounded border-2 transition-colors ${
                theme.variants?.animationLevel === level
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Colors</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Surface Color
            </label>
            <input
              type="color"
              value={theme.colors.surface || '#F9FAFB'}
              onChange={(e) => updateColors('surface', e.target.value)}
              className="w-full h-8 rounded border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Border Color
            </label>
            <input
              type="color"
              value={theme.colors.border || '#E5E7EB'}
              onChange={(e) => updateColors('border', e.target.value)}
              className="w-full h-8 rounded border border-gray-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}