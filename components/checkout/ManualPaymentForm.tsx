"use client";

import React, { useState } from 'react';
import { BankDetails, VvipOrderData } from '@/types/vvip';
import { PaymentProofUpload } from './PaymentProofUpload';
import { Building2, CreditCard, Calendar, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ManualPaymentFormProps {
  bankDetails: BankDetails;
  orderTotal: number;
  currency?: string;
  onSubmit: (paymentData: {
    amount_paid: number;
    payment_reference?: string;
    payment_date: Date;
    payment_proof_url: string;
  }) => Promise<void>;
  loading?: boolean;
}

interface FormData {
  amount_paid: string;
  payment_reference: string;
  payment_date: string;
  payment_proof_url: string;
}

interface FormErrors {
  amount_paid?: string;
  payment_date?: string;
  payment_proof_url?: string;
}

export function ManualPaymentForm({
  bankDetails,
  orderTotal,
  currency = 'NGN',
  onSubmit,
  loading = false,
}: ManualPaymentFormProps) {
  const [formData, setFormData] = useState<FormData>({
    amount_paid: orderTotal.toString(),
    payment_reference: '',
    payment_date: new Date().toISOString().split('T')[0], // Today's date
    payment_proof_url: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Handle payment proof upload success
   */
  const handlePaymentProofUploaded = (url: string) => {
    setFormData(prev => ({ ...prev, payment_proof_url: url }));
    
    // Clear error when file is uploaded
    if (errors.payment_proof_url) {
      setErrors(prev => ({ ...prev, payment_proof_url: undefined }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate amount paid
    const amountPaid = parseFloat(formData.amount_paid);
    if (!formData.amount_paid || isNaN(amountPaid) || amountPaid <= 0) {
      newErrors.amount_paid = 'Please enter a valid amount';
    }

    // Validate payment date
    if (!formData.payment_date) {
      newErrors.payment_date = 'Please select the payment date';
    } else {
      const paymentDate = new Date(formData.payment_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (paymentDate > today) {
        newErrors.payment_date = 'Payment date cannot be in the future';
      }
    }

    // Validate payment proof
    if (!formData.payment_proof_url) {
      newErrors.payment_proof_url = 'Please upload payment proof';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        amount_paid: parseFloat(formData.amount_paid),
        payment_reference: formData.payment_reference || undefined,
        payment_date: new Date(formData.payment_date),
        payment_proof_url: formData.payment_proof_url,
      });
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Format currency amount
   */
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Manual Payment</h2>
          </div>
          <p className="text-gray-600 text-sm">
            Transfer the payment to our bank account and upload proof of payment to complete your order.
          </p>
        </div>

        {/* Bank Details */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Bank Account Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">Bank Name:</span>
              <span className="text-blue-900">{bankDetails.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">Account Number:</span>
              <span className="text-blue-900 font-mono">{bankDetails.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">Account Name:</span>
              <span className="text-blue-900">{bankDetails.accountName}</span>
            </div>
            {bankDetails.sortCode && (
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Sort Code:</span>
                <span className="text-blue-900 font-mono">{bankDetails.sortCode}</span>
              </div>
            )}
            {bankDetails.swiftCode && (
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">SWIFT Code:</span>
                <span className="text-blue-900 font-mono">{bankDetails.swiftCode}</span>
              </div>
            )}
            {bankDetails.iban && (
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">IBAN:</span>
                <span className="text-blue-900 font-mono">{bankDetails.iban}</span>
              </div>
            )}
          </div>
        </div>

        {/* Order Total */}
        <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Order Total:</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatAmount(orderTotal)}
            </span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Paid */}
          <div>
            <label htmlFor="amount_paid" className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 inline mr-1" />
              Amount Paid *
            </label>
            <input
              type="number"
              id="amount_paid"
              name="amount_paid"
              value={formData.amount_paid}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.amount_paid ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter the amount you paid"
              disabled={loading || isSubmitting}
            />
            {errors.amount_paid && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.amount_paid}
              </p>
            )}
          </div>

          {/* Payment Reference */}
          <div>
            <label htmlFor="payment_reference" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Payment Reference (Optional)
            </label>
            <input
              type="text"
              id="payment_reference"
              name="payment_reference"
              value={formData.payment_reference}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter transaction reference or ID"
              disabled={loading || isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Transaction ID, reference number, or any identifier from your bank
            </p>
          </div>

          {/* Payment Date */}
          <div>
            <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Payment Date *
            </label>
            <input
              type="date"
              id="payment_date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleInputChange}
              max={new Date().toISOString().split('T')[0]} // Cannot select future dates
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.payment_date ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading || isSubmitting}
            />
            {errors.payment_date && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.payment_date}
              </p>
            )}
          </div>

          {/* Payment Proof Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Proof *
            </label>
            <PaymentProofUpload
              onUploadSuccess={handlePaymentProofUploaded}
              disabled={loading || isSubmitting}
            />
            {errors.payment_proof_url && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.payment_proof_url}
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">Payment Instructions</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Transfer the exact order amount to the bank account above</li>
                  <li>• Upload a clear screenshot or photo of your payment receipt</li>
                  <li>• Include the transaction reference if available</li>
                  <li>• Your order will be processed once payment is verified</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting Payment...
              </div>
            ) : (
              'Submit Payment Details'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}