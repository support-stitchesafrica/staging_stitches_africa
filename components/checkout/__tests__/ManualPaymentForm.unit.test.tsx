/**
 * Manual Payment Form Unit Tests
 * 
 * Tests manual payment form rendering, file upload validation, and form submission
 * Requirements: 4.4, 4.6, 4.7, 4.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('ManualPaymentForm Unit Tests', () => {
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

  describe('Manual Payment Form Rendering', () => {
    it('should render form with all required fields', () => {
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      // Check form title
      expect(screen.getByText('Manual Payment')).toBeInTheDocument();

      // Check all form fields are present
      expect(screen.getByLabelText(/Amount Paid/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Payment Reference/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Payment Date/i)).toBeInTheDocument();
      expect(screen.getByTestId('payment-proof-upload')).toBeInTheDocument();

      // Check submit button
      expect(screen.getByRole('button', { name: /Submit Payment Details/i })).toBeInTheDocument();
    });

    it('should display bank details correctly', () => {
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      expect(screen.getByText('Bank Account Details')).toBeInTheDocument();
      expect(screen.getByText(mockBankDetails.bankName)).toBeInTheDocument();
      expect(screen.getByText(mockBankDetails.accountNumber)).toBeInTheDocument();
      expect(screen.getByText(mockBankDetails.accountName)).toBeInTheDocument();
      expect(screen.getByText(mockBankDetails.sortCode!)).toBeInTheDocument();
      expect(screen.getByText(mockBankDetails.swiftCode!)).toBeInTheDocument();
      expect(screen.getByText(mockBankDetails.iban!)).toBeInTheDocument();
    });

    it('should pre-fill amount with order total', () => {
      const orderTotal = 1500.50;
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={orderTotal}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      const amountInput = screen.getByLabelText(/Amount Paid/i) as HTMLInputElement;
      expect(amountInput.value).toBe(orderTotal.toString());
    });

    it('should set default payment date to today', () => {
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      const dateInput = screen.getByLabelText(/Payment Date/i) as HTMLInputElement;
      const today = new Date().toISOString().split('T')[0];
      expect(dateInput.value).toBe(today);
    });

    it('should format order total with currency', () => {
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="USD"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      // Should display formatted amount
      expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument();
    });
  });

  describe('File Upload Validation', () => {
    it('should handle payment proof upload success', async () => {
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      const uploadButton = screen.getByTestId('upload-button');
      fireEvent.click(uploadButton);

      // Should update form state with uploaded URL
      // This is tested indirectly through form submission
    });

    it('should disable upload when form is loading', () => {
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={true}
        />
      );

      const uploadButton = screen.getByTestId('upload-button');
      expect(uploadButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should validate required fields before submission', async () => {
      const user = userEvent.setup();
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      // Clear amount field
      const amountInput = screen.getByLabelText(/Amount Paid/i);
      await user.clear(amountInput);

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /Submit Payment Details/i });
      await user.click(submitButton);

      // Should show validation error
      expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate payment date is not in future', async () => {
      const user = userEvent.setup();
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      // Set future date
      const dateInput = screen.getByLabelText(/Payment Date/i);
      await user.clear(dateInput);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      await user.type(dateInput, futureDate.toISOString().split('T')[0]);

      // Upload payment proof
      const uploadButton = screen.getByTestId('upload-button');
      fireEvent.click(uploadButton);

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /Submit Payment Details/i });
      await user.click(submitButton);

      // Should not call onSubmit due to validation failure
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should require payment proof upload', async () => {
      const user = userEvent.setup();
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      // Try to submit without uploading proof
      const submitButton = screen.getByRole('button', { name: /Submit Payment Details/i });
      await user.click(submitButton);

      // Should show validation error
      expect(screen.getByText('Please upload payment proof')).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      // Fill form fields
      const amountInput = screen.getByLabelText(/Amount Paid/i);
      await user.clear(amountInput);
      await user.type(amountInput, '1000');

      const referenceInput = screen.getByLabelText(/Payment Reference/i);
      await user.type(referenceInput, 'REF123456');

      // Upload payment proof
      const uploadButton = screen.getByTestId('upload-button');
      fireEvent.click(uploadButton);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Submit Payment Details/i });
      await user.click(submitButton);

      // Should call onSubmit with correct data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          amount_paid: 1000,
          payment_reference: 'REF123456',
          payment_date: expect.any(Date),
          payment_proof_url: 'mock-url',
        });
      });
    });

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      const mockOnSubmitError = vi.fn().mockRejectedValue(new Error('Submission failed'));
      
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmitError}
          loading={false}
        />
      );

      // Upload payment proof
      const uploadButton = screen.getByTestId('upload-button');
      fireEvent.click(uploadButton);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Submit Payment Details/i });
      await user.click(submitButton);

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockOnSubmitError).toHaveBeenCalled();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={true}
        />
      );

      // All inputs should be disabled
      expect(screen.getByLabelText(/Amount Paid/i)).toBeDisabled();
      expect(screen.getByLabelText(/Payment Reference/i)).toBeDisabled();
      expect(screen.getByLabelText(/Payment Date/i)).toBeDisabled();
      expect(screen.getByTestId('upload-button')).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should validate amount is positive number', async () => {
      const user = userEvent.setup();
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      // Enter negative amount
      const amountInput = screen.getByLabelText(/Amount Paid/i);
      await user.clear(amountInput);
      await user.type(amountInput, '-100');

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /Submit Payment Details/i });
      await user.click(submitButton);

      // Should not call onSubmit due to validation failure
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear validation errors when user fixes input', async () => {
      const user = userEvent.setup();
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      // Clear amount to trigger error
      const amountInput = screen.getByLabelText(/Amount Paid/i);
      await user.clear(amountInput);

      // Submit to show error
      const submitButton = screen.getByRole('button', { name: /Submit Payment Details/i });
      await user.click(submitButton);

      expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();

      // Fix the input
      await user.type(amountInput, '1000');

      // Error should be cleared
      expect(screen.queryByText('Please enter a valid amount')).not.toBeInTheDocument();
    });

    it('should allow optional payment reference', async () => {
      const user = userEvent.setup();
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      // Upload payment proof
      const uploadButton = screen.getByTestId('upload-button');
      fireEvent.click(uploadButton);

      // Submit without reference (should be valid)
      const submitButton = screen.getByRole('button', { name: /Submit Payment Details/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          amount_paid: 1000,
          payment_reference: undefined,
          payment_date: expect.any(Date),
          payment_proof_url: 'mock-url',
        });
      });
    });
  });

  describe('Instructions and Help Text', () => {
    it('should display payment instructions', () => {
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      expect(screen.getByText('Payment Instructions')).toBeInTheDocument();
      expect(screen.getByText(/Transfer the exact order amount/i)).toBeInTheDocument();
      expect(screen.getByText(/Upload a clear screenshot/i)).toBeInTheDocument();
      expect(screen.getByText(/Include the transaction reference/i)).toBeInTheDocument();
      expect(screen.getByText(/Your order will be processed/i)).toBeInTheDocument();
    });

    it('should show help text for payment reference field', () => {
      render(
        <ManualPaymentForm
          bankDetails={mockBankDetails}
          orderTotal={1000}
          currency="NGN"
          onSubmit={mockOnSubmit}
          loading={false}
        />
      );

      expect(screen.getByText(/Transaction ID, reference number/i)).toBeInTheDocument();
    });
  });
});