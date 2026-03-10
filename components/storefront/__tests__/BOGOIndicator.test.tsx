import React from 'react';
import { render, screen } from '@testing-library/react';
import { BOGOIndicator } from '../BOGOIndicator';

// Mock data for testing
const mockMainProduct = {
  id: 'main-1',
  name: 'Premium T-Shirt',
  price: 29.99,
};

const mockFreeProducts = [
  {
    id: 'free-1',
    name: 'Cotton Socks',
    price: 9.99,
  },
  {
    id: 'free-2',
    name: 'Baseball Cap',
    price: 15.99,
  },
];

describe('BOGOIndicator', () => {
  it('renders BOGO indicator with basic information', () => {
    render(
      <BOGOIndicator
        mainProduct={mockMainProduct}
        freeProducts={[mockFreeProducts[0]]}
        totalSavings={9.99}
      />
    );

    expect(screen.getByTestId('bogo-indicator')).toBeInTheDocument();
    expect(screen.getByText('Buy One Get One FREE')).toBeInTheDocument();
    expect(screen.getByText('Save $9.99')).toBeInTheDocument();
    expect(screen.getByText('Premium T-Shirt - $29.99')).toBeInTheDocument();
    expect(screen.getByText('Cotton Socks -')).toBeInTheDocument();
  });

  it('renders compact variant correctly', () => {
    render(
      <BOGOIndicator
        mainProduct={mockMainProduct}
        freeProducts={[mockFreeProducts[0]]}
        totalSavings={9.99}
        variant="compact"
      />
    );

    expect(screen.getByTestId('bogo-indicator')).toBeInTheDocument();
    expect(screen.getByText('BOGO')).toBeInTheDocument();
  });

  it('renders banner variant with explanation', () => {
    render(
      <BOGOIndicator
        mainProduct={mockMainProduct}
        freeProducts={[mockFreeProducts[0]]}
        totalSavings={9.99}
        variant="banner"
      />
    );

    expect(screen.getByText('How it works:')).toBeInTheDocument();
    expect(screen.getByText('Premium T-Shirt')).toBeInTheDocument();
    expect(screen.getByText('Cotton Socks')).toBeInTheDocument();
    expect(screen.getByText('BOGO OFFER')).toBeInTheDocument();
  });

  it('handles multiple free products correctly', () => {
    render(
      <BOGOIndicator
        mainProduct={mockMainProduct}
        freeProducts={mockFreeProducts}
        totalSavings={25.98}
      />
    );

    expect(screen.getByText('Choose from 2 options:')).toBeInTheDocument();
    expect(screen.getByText(/Cotton Socks/)).toBeInTheDocument();
    expect(screen.getByText(/Baseball Cap/)).toBeInTheDocument();
  });

  it('shows urgency when days until expiry is provided', () => {
    render(
      <BOGOIndicator
        mainProduct={mockMainProduct}
        freeProducts={[mockFreeProducts[0]]}
        totalSavings={9.99}
        daysUntilExpiry={3}
      />
    );

    expect(screen.getByText('3 days left')).toBeInTheDocument();
  });

  it('shows last day urgency', () => {
    render(
      <BOGOIndicator
        mainProduct={mockMainProduct}
        freeProducts={[mockFreeProducts[0]]}
        totalSavings={9.99}
        daysUntilExpiry={1}
      />
    );

    expect(screen.getByText('Last day!')).toBeInTheDocument();
  });

  it('does not render when no free products provided', () => {
    render(
      <BOGOIndicator
        mainProduct={mockMainProduct}
        freeProducts={[]}
        totalSavings={0}
      />
    );

    expect(screen.queryByTestId('bogo-indicator')).not.toBeInTheDocument();
  });

  it('renders custom promotion name and description', () => {
    render(
      <BOGOIndicator
        mainProduct={mockMainProduct}
        freeProducts={[mockFreeProducts[0]]}
        totalSavings={9.99}
        promotionName="Holiday Special"
        description="Limited time holiday offer with free shipping!"
      />
    );

    expect(screen.getByText('Holiday Special')).toBeInTheDocument();
    expect(screen.getByText('Limited time holiday offer with free shipping!')).toBeInTheDocument();
  });
});