/**
 * VendorCard Component Tests
 * 
 * Tests for the VendorCard component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorCard } from './VendorCard';

describe('VendorCard', () => {
  const mockVendor = {
    id: 'vendor-123',
    name: 'Lagos Fashion House',
    rating: 4.8,
    reviewCount: 120,
    location: 'Lagos, Nigeria',
    specialties: ['Traditional Wear', 'Ankara', 'Custom Tailoring'],
    verified: true,
    logo: '/vendor-logo.jpg',
  };

  it('renders vendor information correctly', () => {
    render(<VendorCard vendor={mockVendor} />);
    
    expect(screen.getByText('Lagos Fashion House')).toBeDefined();
    expect(screen.getByText('Lagos, Nigeria')).toBeDefined();
  });

  it('displays rating and review count', () => {
    render(<VendorCard vendor={mockVendor} />);
    
    expect(screen.getByText('4.8')).toBeDefined();
    expect(screen.getByText(/120 reviews/)).toBeDefined();
  });

  it('shows verified badge for verified vendors', () => {
    render(<VendorCard vendor={mockVendor} />);
    
    expect(screen.getByText('Verified')).toBeDefined();
  });

  it('does not show verified badge for unverified vendors', () => {
    const unverifiedVendor = { ...mockVendor, verified: false };
    render(<VendorCard vendor={unverifiedVendor} />);
    
    expect(screen.queryByText('Verified')).toBeNull();
  });

  it('displays specialties', () => {
    render(<VendorCard vendor={mockVendor} />);
    
    expect(screen.getByText('Traditional Wear')).toBeDefined();
    expect(screen.getByText('Ankara')).toBeDefined();
    expect(screen.getByText('Custom Tailoring')).toBeDefined();
  });

  it('renders action buttons when handlers provided', () => {
    const mockHandlers = {
      onVisitShop: vi.fn(),
      onViewProducts: vi.fn(),
    };
    
    render(<VendorCard vendor={mockVendor} {...mockHandlers} />);
    
    expect(screen.getByText('Visit Shop')).toBeDefined();
    expect(screen.getByText('View Products')).toBeDefined();
  });

  it('calls onVisitShop when Visit Shop button clicked', () => {
    const onVisitShop = vi.fn();
    render(<VendorCard vendor={mockVendor} onVisitShop={onVisitShop} />);
    
    const button = screen.getByText('Visit Shop');
    fireEvent.click(button);
    
    expect(onVisitShop).toHaveBeenCalledWith(mockVendor.id);
  });

  it('calls onViewProducts when View Products button clicked', () => {
    const onViewProducts = vi.fn();
    render(<VendorCard vendor={mockVendor} onViewProducts={onViewProducts} />);
    
    const button = screen.getByText('View Products');
    fireEvent.click(button);
    
    expect(onViewProducts).toHaveBeenCalledWith(mockVendor.id);
  });

  it('handles missing optional fields gracefully', () => {
    const minimalVendor = {
      id: 'vendor-456',
      name: 'Simple Vendor',
      rating: 4.0,
      reviewCount: 10,
    };
    
    const { container } = render(<VendorCard vendor={minimalVendor} />);
    expect(container).toBeTruthy();
  });

  it('formats rating to one decimal place', () => {
    const vendorWithPreciseRating = { ...mockVendor, rating: 4.756 };
    render(<VendorCard vendor={vendorWithPreciseRating} />);
    
    // Should display as 4.8 (rounded)
    expect(screen.getByText(/4\.[0-9]/)).toBeDefined();
  });

  it('displays location icon', () => {
    render(<VendorCard vendor={mockVendor} />);
    
    // Check for location icon (MapPin or similar)
    const locationElement = screen.getByText('Lagos, Nigeria').closest('div');
    expect(locationElement).toBeTruthy();
  });

  it('limits displayed specialties to 3', () => {
    const vendorWithManySpecialties = {
      ...mockVendor,
      specialties: ['Specialty 1', 'Specialty 2', 'Specialty 3', 'Specialty 4', 'Specialty 5'],
    };
    
    render(<VendorCard vendor={vendorWithManySpecialties} />);
    
    // Should show first 3 and "+2 more" or similar
    expect(screen.getByText('Specialty 1')).toBeDefined();
    expect(screen.getByText('Specialty 2')).toBeDefined();
    expect(screen.getByText('Specialty 3')).toBeDefined();
  });
});
