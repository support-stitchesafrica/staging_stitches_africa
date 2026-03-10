'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import StripeProvider from './StripeProvider';
import StripeCheckoutForm from './StripeCheckoutForm';
import { PaymentService, PaymentData } from '@/lib/payment-service';

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PaymentData;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

export default function StripePaymentModal({
  isOpen,
  onClose,
  paymentData,
  onSuccess,
  onError,
}: StripePaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !clientSecret) {
      initializePayment();
    }
  }, [isOpen]);

  const initializePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await PaymentService.initializeStripePayment(paymentData);
      
      if (result.success && result.reference) {
        setClientSecret(result.reference);
      } else {
        setError(result.error || 'Failed to initialize payment');
        onError(result.error || 'Failed to initialize payment');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (paymentIntentId: string) => {
    onSuccess(paymentIntentId);
    onClose();
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    onError(errorMessage);
  };

  const handleClose = () => {
    setClientSecret(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Secure Payment</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Initializing payment...</span>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={initializePayment}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {clientSecret && !loading && !error && (
            <StripeProvider clientSecret={clientSecret}>
              <StripeCheckoutForm
                amount={paymentData.amount}
                currency={paymentData.currency}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </StripeProvider>
          )}
        </div>
      </div>
    </div>
  );
}