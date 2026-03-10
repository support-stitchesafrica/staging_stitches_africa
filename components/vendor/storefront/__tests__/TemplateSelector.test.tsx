import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateSelector } from '../TemplateSelector';
import { StorefrontTemplate } from '@/types/storefront';

// Mock template for testing
const mockTemplate: StorefrontTemplate = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean and simple design focused on products',
  category: 'minimal',
  previewImage: '/templates/minimal-preview.jpg',
  features: ['Clean layout', 'Product focus'],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  defaultTheme: {
    colors: {
      primary: '#000000',
      secondary: '#6B7280',
      accent: '#F3F4F6',
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
      headerStyle: 'minimal',
      productCardStyle: 'clean',
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
};

describe('TemplateSelector', () => {
  const mockOnTemplateSelect = vi.fn();

  beforeEach(() => {
    mockOnTemplateSelect.mockClear();
  });

  it('renders 3 basic template options', () => {
    render(
      <TemplateSelector
        selectedTemplate={null}
        onTemplateSelect={mockOnTemplateSelect}
      />
    );

    // Check that all 3 templates are rendered
    expect(screen.getByText('Minimal')).toBeInTheDocument();
    expect(screen.getByText('Modern')).toBeInTheDocument();
    expect(screen.getByText('Classic')).toBeInTheDocument();
  });

  it('displays template descriptions and features', () => {
    render(
      <TemplateSelector
        selectedTemplate={null}
        onTemplateSelect={mockOnTemplateSelect}
      />
    );

    // Check descriptions
    expect(screen.getByText('Clean and simple design focused on products')).toBeInTheDocument();
    expect(screen.getByText('Contemporary design with bold colors and gradients')).toBeInTheDocument();
    expect(screen.getByText('Timeless design with elegant typography and warm colors')).toBeInTheDocument();

    // Check some features
    expect(screen.getByText('Clean layout')).toBeInTheDocument();
    expect(screen.getByText('Bold colors')).toBeInTheDocument();
    expect(screen.getByText('Elegant typography')).toBeInTheDocument();
  });

  it('calls onTemplateSelect when a template is clicked', () => {
    render(
      <TemplateSelector
        selectedTemplate={null}
        onTemplateSelect={mockOnTemplateSelect}
      />
    );

    // Click on the Minimal template
    fireEvent.click(screen.getByText('Minimal').closest('div')!);

    expect(mockOnTemplateSelect).toHaveBeenCalledTimes(1);
    expect(mockOnTemplateSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'minimal',
        name: 'Minimal'
      })
    );
  });

  it('shows selection indicator for selected template', () => {
    render(
      <TemplateSelector
        selectedTemplate={mockTemplate}
        onTemplateSelect={mockOnTemplateSelect}
      />
    );

    // Check that the selected template has the selection indicator
    const selectedTemplateContainer = screen.getByText('Minimal').closest('[class*="border"]');
    expect(selectedTemplateContainer).toHaveClass('border-blue-500');
    expect(selectedTemplateContainer).toHaveClass('bg-blue-50');
  });

  it('displays template categories correctly', () => {
    render(
      <TemplateSelector
        selectedTemplate={null}
        onTemplateSelect={mockOnTemplateSelect}
      />
    );

    // Check category badges
    expect(screen.getByText('minimal')).toBeInTheDocument();
    expect(screen.getByText('modern')).toBeInTheDocument();
    expect(screen.getByText('classic')).toBeInTheDocument();
  });
});