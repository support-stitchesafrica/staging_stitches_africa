import { render, screen } from '@testing-library/react';
import { PromotionalBadge } from '../PromotionalBadge';

describe('PromotionalBadge', () => {
  it('renders with default props', () => {
    render(<PromotionalBadge discountPercentage={25} />);
    
    const badge = screen.getByTestId('promotional-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('SAVE');
    expect(badge).toHaveTextContent('25% OFF');
  });

  it('renders with custom colors', () => {
    const customColors = {
      background: '#ff0000',
      text: '#ffffff',
      border: '#cc0000',
    };

    render(
      <PromotionalBadge 
        discountPercentage={30} 
        customColors={customColors}
      />
    );
    
    const badge = screen.getByTestId('promotional-badge');
    expect(badge).toHaveStyle({
      backgroundColor: '#ff0000',
      color: '#ffffff',
      borderColor: '#cc0000',
    });
  });

  it('renders with custom text configuration', () => {
    const customText = {
      primary: 'MEGA SALE',
      secondary: 'Limited Time',
      prefix: '🔥',
      suffix: '🔥',
    };

    render(
      <PromotionalBadge 
        discountPercentage={50} 
        customText={customText}
      />
    );
    
    const badge = screen.getByTestId('promotional-badge');
    expect(badge).toHaveTextContent('🔥MEGA SALE🔥');
    expect(badge).toHaveTextContent('Limited Time');
  });

  it('renders minimal variant with custom text', () => {
    render(
      <PromotionalBadge 
        discountPercentage={15} 
        variant="minimal"
        customText={{ primary: 'HOT' }}
      />
    );
    
    const badge = screen.getByTestId('promotional-badge');
    expect(badge).toHaveTextContent('HOT');
    expect(badge).not.toHaveTextContent('15%');
  });

  it('renders compact variant with custom colors and text', () => {
    const customColors = {
      background: '#10b981',
      text: '#ffffff',
    };

    const customText = {
      secondary: 'FLASH SALE',
    };

    render(
      <PromotionalBadge 
        discountPercentage={40} 
        variant="compact"
        customColors={customColors}
        customText={customText}
      />
    );
    
    const badge = screen.getByTestId('promotional-badge');
    expect(badge).toHaveTextContent('FLASH SALE');
    expect(badge).toHaveStyle({
      backgroundColor: '#10b981',
      color: '#ffffff',
    });
  });

  it('renders savings variant with custom text', () => {
    const customText = {
      primary: 'Special Price',
      secondary: 'You Save Big!',
      prefix: 'Was',
    };

    render(
      <PromotionalBadge 
        discountPercentage={25} 
        variant="savings"
        originalPrice={100}
        salePrice={75}
        customText={customText}
      />
    );
    
    const badge = screen.getByTestId('promotional-badge');
    expect(badge).toHaveTextContent('Was $100.00');
    expect(badge).toHaveTextContent('Special Price $75.00');
    expect(badge).toHaveTextContent('You Save Big!');
  });

  it('falls back to predefined colors when custom colors are not provided', () => {
    render(
      <PromotionalBadge 
        discountPercentage={20} 
        color="green"
      />
    );
    
    const badge = screen.getByTestId('promotional-badge');
    expect(badge).toHaveClass('bg-gradient-to-r');
    expect(badge).toHaveClass('from-green-500');
    expect(badge).toHaveClass('to-green-600');
  });

  it('handles invalid discount percentage gracefully', () => {
    const { container } = render(<PromotionalBadge discountPercentage={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('combines custom colors with border styling', () => {
    const customColors = {
      background: '#8b5cf6',
      text: '#ffffff',
      border: '#7c3aed',
    };

    render(
      <PromotionalBadge 
        discountPercentage={35} 
        customColors={customColors}
      />
    );
    
    const badge = screen.getByTestId('promotional-badge');
    expect(badge).toHaveStyle({
      backgroundColor: '#8b5cf6',
      color: '#ffffff',
      borderColor: '#7c3aed',
      borderWidth: '1px',
    });
    expect(badge).toHaveClass('border');
  });
});