import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PromotionalBanner } from '../PromotionalBanner';
import { PromotionService } from '@/lib/storefront/promotion-service';

// Mock the promotion service
vi.mock('@/lib/storefront/promotion-service');
const mockPromotionService = vi.mocked(PromotionService);

describe('PromotionalBanner', () => {
  const mockPromotionData = [
    {
      promotion: {
        id: 'promo-1',
        vendorId: 'vendor-1',
        type: 'storefront_wide' as const,
        title: 'Summer Sale',
        description: 'Get 25% off all items',
        bannerMessage: '🌞 Summer Sale: 25% OFF Everything!',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        displaySettings: {
          backgroundColor: '#f59e0b',
          textColor: '#ffffff',
          position: 'top' as const,
          priority: 1,
          showIcon: true,
          iconType: 'percent' as const,
        },
      },
      isValid: true,
      timeRemaining: { days: 7, hours: 0, minutes: 0 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockPromotionService.getPromotionDisplayData.mockResolvedValue(mockPromotionData);
    mockPromotionService.sortPromotionsByPriority.mockReturnValue(mockPromotionData);
    mockPromotionService.formatTimeRemaining.mockReturnValue('7d 0h remaining');
  });

  it('renders promotional banner with correct content', async () => {
    render(<PromotionalBanner vendorId="vendor-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('promotional-banner')).toBeInTheDocument();
    });

    expect(screen.getByText('🌞 Summer Sale: 25% OFF Everything!')).toBeInTheDocument();
    expect(screen.getByText('7d 0h remaining')).toBeInTheDocument();
  });

  it('calls onPromotionClick when banner is clicked', async () => {
    const onPromotionClick = vi.fn();
    render(
      <PromotionalBanner 
        vendorId="vendor-1" 
        onPromotionClick={onPromotionClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('promotional-banner')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('promotional-banner'));
    expect(onPromotionClick).toHaveBeenCalledWith(mockPromotionData[0].promotion);
  });

  it('calls onPromotionClose when close button is clicked', async () => {
    const onPromotionClose = vi.fn();
    render(
      <PromotionalBanner 
        vendorId="vendor-1" 
        onPromotionClose={onPromotionClose}
        showCloseButton={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('promotional-banner')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close promotion');
    fireEvent.click(closeButton);
    expect(onPromotionClose).toHaveBeenCalledWith('promo-1');
  });

  it('does not render when no promotions are available', async () => {
    mockPromotionService.getPromotionDisplayData.mockResolvedValue([]);
    
    render(<PromotionalBanner vendorId="vendor-1" />);

    await waitFor(() => {
      expect(screen.queryByTestId('promotional-banner')).not.toBeInTheDocument();
    });
  });

  it('filters promotions by position', async () => {
    const topPromotion = {
      ...mockPromotionData[0],
      promotion: {
        ...mockPromotionData[0].promotion,
        displaySettings: {
          ...mockPromotionData[0].promotion.displaySettings,
          position: 'top' as const,
        },
      },
    };

    const bottomPromotion = {
      ...mockPromotionData[0],
      promotion: {
        ...mockPromotionData[0].promotion,
        id: 'promo-2',
        displaySettings: {
          ...mockPromotionData[0].promotion.displaySettings,
          position: 'bottom' as const,
        },
      },
    };

    mockPromotionService.getPromotionDisplayData.mockResolvedValue([
      topPromotion,
      bottomPromotion,
    ]);

    render(<PromotionalBanner vendorId="vendor-1" position="top" />);

    await waitFor(() => {
      expect(mockPromotionService.getPromotionDisplayData).toHaveBeenCalledWith('vendor-1');
    });
  });

  it('handles multiple promotions with navigation', async () => {
    const multiplePromotions = [
      mockPromotionData[0],
      {
        ...mockPromotionData[0],
        promotion: {
          ...mockPromotionData[0].promotion,
          id: 'promo-2',
          bannerMessage: 'Free Shipping Weekend',
        },
      },
    ];

    mockPromotionService.getPromotionDisplayData.mockResolvedValue(multiplePromotions);
    mockPromotionService.sortPromotionsByPriority.mockReturnValue(multiplePromotions);

    render(<PromotionalBanner vendorId="vendor-1" />);

    await waitFor(() => {
      expect(screen.getByTestId('promotional-banner')).toBeInTheDocument();
    });

    // Should show navigation buttons for multiple promotions
    expect(screen.getByLabelText('Previous promotion')).toBeInTheDocument();
    expect(screen.getByLabelText('Next promotion')).toBeInTheDocument();

    // Should show indicators
    const indicators = screen.getAllByRole('button');
    const indicatorButtons = indicators.filter(button => 
      button.getAttribute('aria-label')?.startsWith('Go to promotion')
    );
    expect(indicatorButtons).toHaveLength(2);
  });
});