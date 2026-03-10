import React from 'react';
import { render, screen } from '@testing-library/react';
import { SavingsCalculator, InlineSavings, SavingsCard, DetailedSavings } from '../SavingsCalculator';

describe('SavingsCalculator', () => {
  const mockProps = {
    originalPrice: 100,
    salePrice: 75,
  };

  it('renders inline savings correctly', () => {
    render(<SavingsCalculator {...mockProps} variant="inline" />);
    
    const element = screen.getByTestId('savings-calculator');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Save $25.00');
    expect(element).toHaveTextContent('(25% off)');
  });

  it('renders card variant correctly', () => {
    render(<SavingsCalculator {...mockProps} variant="card" />);
    
    const element = screen.getByTestId('savings-calculator');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Save $25.00');
    expect(element).toHaveTextContent('25% discount');
  });

  it('renders detailed variant correctly', () => {
    render(<SavingsCalculator {...mockProps} variant="detailed" />);
    
    const element = screen.getByTestId('savings-calculator');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Original Price:');
    expect(element).toHaveTextContent('Sale Price:');
    expect(element).toHaveTextContent('You Save:');
    expect(element).toHaveTextContent('$100.00');
    expect(element).toHaveTextContent('$75.00');
    expect(element).toHaveTextContent('$25.00');
  });

  it('does not render when no savings', () => {
    render(<SavingsCalculator originalPrice={100} salePrice={100} />);
    
    expect(screen.queryByTestId('savings-calculator')).not.toBeInTheDocument();
  });

  it('does not render when sale price is higher than original', () => {
    render(<SavingsCalculator originalPrice={100} salePrice={120} />);
    
    expect(screen.queryByTestId('savings-calculator')).not.toBeInTheDocument();
  });

  it('handles zero or negative prices correctly', () => {
    render(<SavingsCalculator originalPrice={0} salePrice={0} />);
    expect(screen.queryByTestId('savings-calculator')).not.toBeInTheDocument();

    render(<SavingsCalculator originalPrice={-10} salePrice={5} />);
    expect(screen.queryByTestId('savings-calculator')).not.toBeInTheDocument();
  });

  it('shows only percentage when showAmount is false', () => {
    render(
      <SavingsCalculator 
        {...mockProps} 
        variant="inline" 
        showAmount={false} 
        showPercentage={true}
      />
    );
    
    const element = screen.getByTestId('savings-calculator');
    expect(element).not.toHaveTextContent('Save $25.00');
    expect(element).toHaveTextContent('(25% off)');
  });

  it('shows only amount when showPercentage is false', () => {
    render(
      <SavingsCalculator 
        {...mockProps} 
        variant="inline" 
        showAmount={true} 
        showPercentage={false}
      />
    );
    
    const element = screen.getByTestId('savings-calculator');
    expect(element).toHaveTextContent('Save $25.00');
    expect(element).not.toHaveTextContent('(25% off)');
  });

  it('hides icon when showIcon is false', () => {
    render(<SavingsCalculator {...mockProps} variant="inline" showIcon={false} />);
    
    const element = screen.getByTestId('savings-calculator');
    expect(element.querySelector('svg')).not.toBeInTheDocument();
  });
});

describe('Specialized Components', () => {
  const mockProps = {
    originalPrice: 50,
    salePrice: 40,
  };

  it('renders InlineSavings correctly', () => {
    render(<InlineSavings {...mockProps} />);
    
    const element = screen.getByTestId('savings-calculator');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Save $10.00');
  });

  it('renders SavingsCard correctly', () => {
    render(<SavingsCard {...mockProps} />);
    
    const element = screen.getByTestId('savings-calculator');
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass('bg-green-50');
  });

  it('renders DetailedSavings correctly', () => {
    render(<DetailedSavings {...mockProps} />);
    
    const element = screen.getByTestId('savings-calculator');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Your Savings');
  });
});