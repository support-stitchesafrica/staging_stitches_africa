/**
 * Manual Payment Form Property-Based Tests
 * 
 * Tests Property 13: Manual Payment Form Contains Required Fields
 * Validates: Requirements 4.4, 4.5, 4.9, 4.10, 4.11
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { ManualPaymentForm } from '../ManualPaymentForm';
import { BankDetails } from '@/types/vvip';

// Mock the PaymentProofUpload component
vi.mock('../PaymentProofUpload', () => ({
  PaymentProofUpload: ({ onUploadSuccess, disabled }: any) => (
    <div data-testid="payment-proof-upload">
      <button
        onClick={() => onUploadSuccess('mock-url')}
        disabled={disabled}
        data-testid="upload-button"
      >
        Upload Payment Proof
      </button>
    </div>
  ),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Feature: vvip-shopper-program, Property 13: Manual Payment Form Contains Required Fields', () => {
  const mockBankDetails: BankDetails = {
    bankName: 'Test Bank',
    accountNumber: '1234567890',
    accountName: 'Test Account',
    sortCode: '12-34-56',
    swiftCode: 'TESTSWIFT',
    iban: 'GB29 NWBK 6016 1331 9268 19',
  };

  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should contain all required fields for any valid bank details and order total', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          bankName: fc.string({ minLength: 1, maxLength: 100 }),
          accountNumber: fc.string({ minLength: 8, maxLength: 20 }),
          accountName: fc.string({ minLength: 1, maxLength: 100 }),
          sortCode: fc.option(fc.string({ minLength: 6, maxLength: 11 })),
          swiftCode: fc.option(fc.string({ minLength: 8, maxLength: 11 })),
          iban: fc.option(fc.string({ minLength: 15, maxLength: 34 })),
        }),
        fc.float({ min: 100, max: 1000000 }),
        fc.constantFrom('NGN', 'USD', 'EUR'),
        async (bankDetails, orderTotal, currency) => {
          // Render the ManualPaymentForm with generated data
          render(
            <ManualPaymentForm
              bankDetails={bankDetails}
              orderTotal={orderTotal}
              currency={currency}
              onSubmit={mockOnSubmit}
              loading={false}
            />
          );

          // Verify bank details are displayed (Requirement 4.4)
          expect(screen.getByText('Bank Account Details')).toBeInTheDocument();
          expect(screen.getByText(bankDetails.bankName)).toBeInTheDocument();
          expect(screen.getByText(bankDetails.accountNumber)).toBeInTheDocument();
          expect(screen.getByText(bankDetails.accountName)).toBeInTheDocument();

          // Verify optional bank details are shown when present
          if (bankDetails.sortCode) {
            expect(screen.getByText(bankDetails.sortCode)).toBeInTheDocument();
          }
          if (bankDetails.swiftCode) {
            expect(screen.getByText(bankDetails.swiftCode)).toBeInTheDocument();
          }
          if (bankDetails.iban) {
            expect(screen.getByText(bankDetails.iban)).toBeInTheDocument();
          }

          // Verify file upload field for payment proof (Requirement 4.5)
          expect(screen.getByTestId('payment-proof-upload')).toBeInTheDocument();
          expect(screen.getByText('Payment Proof *')).toBeInTheDocument();

          // Verify amount paid input field (Requirement 4.9)
          const amountInput = screen.getByLabelText(/Amount Paid/i);
          expect(amountInput).toBeInTheDocument();
          expect(amountInput).toHaveAttribute('type', 'number');
          expect(amountInput).toHaveAttribute('step', '0.01');
          expect(amountInput).toHaveAttribute('min', '0');
          expect(amountInput).toHaveValue(orderTotal);

          // Verify payment reference input field (Requirement 4.10)
          const referenceInput = screen.getByLabelText(/Payment Reference/i);
          expect(referenceInput).toBeInTheDocument();
          expect(referenceInput).toHaveAttribute('type', 'text');
          expect(screen.getByText('(Optional)')).toBeInTheDocument();

          // Verify payment date input field (Requirement 4.11)
          const dateInput = screen.getByLabelText(/Payment Date/i);
          expect(dateInput).toBeInTheDocument();
          expect(dateInput).toHaveAttribute('type', 'date');
          expect(dateInput).toHaveAttribute('max', new Date().toISOString().split('T')[0]);

          // Verify order total is displayed
          const formattedTotal = new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: currency,
          }).format(orderTotal);
          expect(screen.getByText(formattedTotal)).toBeInTheDocument();

          // Verify submit button is present
          expect(screen.getByRole('button', { name: /Submit Payment Details/i })).toBeInTheDocument();

          // Verify payment instructions are shown
          expect(screen.getByText('Payment Instructions')).toBeInTheDocument();
          expect(screen.getByText(/Transfer the exact order amount/i)).toBeInTheDocument();
          expect(screen.getByText(/Upload a clear screenshot/i)).toBeInTheDocument();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display all required form labels and field types', () => {
    render(
      <ManualPaymentForm
        bankDetails={mockBankDetails}
        orderTotal={1000}
        currency="NGN"
        onSubmit={mockOnSubmit}
        loading={false}
      />
    );

    // Check that all required field labels are present
    expect(screen.getByText('Amount Paid *')).toBeInTheDocument();
    expect(screen.getByText('Payment Reference (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Payment Date *')).toBeInTheDocument();
    expect(screen.getByText('Payment Proof *')).toBeInTheDocument();

    // Check field types and attributes
    const amountInput = screen.getByLabelText(/Amount Paid/i);
    expect(amountInput).toHaveAttribute('type', 'number');
    expect(amountInput).toHaveAttribute('required');

    const referenceInput = screen.getByLabelText(/Payment Reference/i);
    expect(referenceInput).toHaveAttribute('type', 'text');
    expect(referenceInput).not.toHaveAttribute('required');

    const dateInput = screen.getByLabelText(/Payment Date/i);
    expect(dateInput).toHaveAttribute('type', 'date');
    expect(dateInput).toHaveAttribute('required');
  });

  it('should show bank details section with proper structure', () => {
    render(
      <ManualPaymentForm
        bankDetails={mockBankDetails}
        orderTotal={1000}
        currency="NGN"
        onSubmit={mockOnSubmit}
        loading={false}
      />
    );

    // Verify bank details section structure
    expect(screen.getByText('Bank Account Details')).toBeInTheDocument();
    expect(screen.getByText('Bank Name:')).toBeInTheDocument();
    expect(screen.getByText('Account Number:')).toBeInTheDocument();
    expect(screen.getByText('Account Name:')).toBeInTheDocument();
    
    // Verify optional fields are shown when present
    expect(screen.getByText('Sort Code:')).toBeInTheDocument();
    expect(screen.getByText('SWIFT Code:')).toBeInTheDocument();
    expect(screen.getByText('IBAN:')).toBeInTheDocument();
  });

  it('should handle loading state properly', () => {
    render(
      <ManualPaymentForm
        bankDetails={mockBankDetails}
        orderTotal={1000}
        currency="NGN"
        onSubmit={mockOnSubmit}
        loading={true}
      />
    );

    // All form inputs should be disabled when loading
    expect(screen.getByLabelText(/Amount Paid/i)).toBeDisabled();
    expect(screen.getByLabelText(/Payment Reference/i)).toBeDisabled();
    expect(screen.getByLabelText(/Payment Date/i)).toBeDisabled();
    expect(screen.getByTestId('upload-button')).toBeDisabled();
  });

  it('should validate required fields are marked appropriately', () => {
    render(
      <ManualPaymentForm
        bankDetails={mockBankDetails}
        orderTotal={1000}
        currency="NGN"
        onSubmit={mockOnSubmit}
        loading={false}
      />
    );

    // Required fields should have asterisk in their labels
    expect(screen.getByText('Amount Paid *')).toBeInTheDocument();
    expect(screen.getByText('Payment Date *')).toBeInTheDocument();
    expect(screen.getByText('Payment Proof *')).toBeInTheDocument();

    // Optional field should be marked as optional
    expect(screen.getByText('Payment Reference (Optional)')).toBeInTheDocument();
  });
});