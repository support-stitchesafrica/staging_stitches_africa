import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TemplateSelector } from '../TemplateSelector';
import { ThemeCustomizer } from '../ThemeCustomizer';
import { LivePreview } from '../LivePreview';
import { StorefrontTemplate, ThemeConfiguration } from '@/types/storefront';

// Mock theme configuration
const mockTheme: ThemeConfiguration = {
  colors: {
    primary: '#3B82F6',
    secondary: '#64748B',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#1F2937'
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
    headerStyle: 'clean',
    productCardStyle: 'modern',
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
};

describe('Template System Integration', () => {
  it('renders LivePreview with placeholder when no template is selected', () => {
    render(
      <LivePreview
        template={null}
        theme={mockTheme}
      />
    );

    expect(screen.getByText('Select a Template')).toBeInTheDocument();
    expect(screen.getByText('Choose a template from the left to see the live preview')).toBeInTheDocument();
  });

  it('renders LivePreview with template content when template is selected', () => {
    const mockTemplate: StorefrontTemplate = {
      id: 'modern',
      name: 'Modern',
      description: 'Contemporary design',
      category: 'modern',
      previewImage: '/test.jpg',
      features: ['Bold colors'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      defaultTheme: mockTheme
    };

    render(
      <LivePreview
        template={mockTemplate}
        theme={mockTheme}
      />
    );

    // Check that storefront content is rendered
    expect(screen.getByText('Your Store')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Your Store')).toBeInTheDocument();
    expect(screen.getByText('Featured Products')).toBeInTheDocument();
    expect(screen.getByText('Shop Now')).toBeInTheDocument();
  });

  it('ThemeCustomizer allows color customization', () => {
    const mockOnThemeChange = vi.fn();
    
    render(
      <ThemeCustomizer
        theme={mockTheme}
        onThemeChange={mockOnThemeChange}
      />
    );

    // Check that color inputs are present
    const primaryColorInput = screen.getByDisplayValue('#3B82F6');
    expect(primaryColorInput).toBeInTheDocument();

    // Simulate color change
    fireEvent.change(primaryColorInput, { target: { value: '#FF0000' } });
    
    expect(mockOnThemeChange).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: expect.objectContaining({
          primary: '#FF0000'
        })
      })
    );
  });

  it('ThemeCustomizer allows font customization', () => {
    const mockOnThemeChange = vi.fn();
    
    render(
      <ThemeCustomizer
        theme={mockTheme}
        onThemeChange={mockOnThemeChange}
      />
    );

    // Switch to typography tab
    fireEvent.click(screen.getByText('Typography'));

    // Check that font selects are present - use more specific selector
    const headingFontSelect = screen.getByLabelText('Heading Font');
    expect(headingFontSelect).toBeInTheDocument();

    // Simulate font change
    fireEvent.change(headingFontSelect, { target: { value: 'Poppins' } });
    
    expect(mockOnThemeChange).toHaveBeenCalledWith(
      expect.objectContaining({
        typography: expect.objectContaining({
          headingFont: 'Poppins'
        })
      })
    );
  });

  it('displays preview content with applied theme styles', () => {
    const customTheme: ThemeConfiguration = {
      ...mockTheme,
      colors: {
        ...mockTheme.colors,
        primary: '#FF0000',
        background: '#F0F0F0'
      }
    };

    const mockTemplate: StorefrontTemplate = {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean design',
      category: 'minimal',
      previewImage: '/test.jpg',
      features: ['Clean'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      defaultTheme: customTheme
    };

    render(
      <LivePreview
        template={mockTemplate}
        theme={customTheme}
      />
    );

    // Check that the main container has the custom background color
    const mainContainer = screen.getByText('Your Store').closest('[style*="background"]');
    expect(mainContainer).toHaveStyle({ backgroundColor: 'rgb(240, 240, 240)' });
  });
});