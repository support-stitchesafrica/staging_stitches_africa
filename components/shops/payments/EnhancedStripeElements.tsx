'use client';

import React, { useState, useEffect } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement,
  LinkAuthenticationElement,
} from '@stripe/react-stripe-js';
import { AlertCircle, CreditCard, Shield, Lock } from 'lucide-react';

interface EnhancedStripeElementsProps {
  amount: number;
  currency: string;
  customerEmail?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  loading?: boolean;
}

export default function EnhancedStripeElements({
  amount,
  currency,
  customerEmail,
  onSuccess,
  onError,
  loading: externalLoading = false,
}: EnhancedStripeElementsProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(customerEmail || '');
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [addressElementReady, setAddressElementReady] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    if (!paymentElementReady || !addressElementReady) {
      setError('Payment form is still loading. Please wait a moment.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Submit all elements to validate
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Payment submission failed');
        setIsLoading(false);
        return;
      }

      // Confirm payment with enhanced security
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          receipt_email: email,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        let errorMessage = confirmError.message || 'Payment confirmation failed';
        
        // Provide more user-friendly error messages
        switch (confirmError.code) {
          case 'card_declined':
            errorMessage = 'Your card was declined. Please try a different payment method.';
            break;
          case 'insufficient_funds':
            errorMessage = 'Insufficient funds. Please try a different payment method.';
            break;
          case 'expired_card':
            errorMessage = 'Your card has expired. Please use a different card.';
            break;
          case 'incorrect_cvc':
            errorMessage = 'Your card\'s security code is incorrect. Please check and try again.';
            break;
          case 'processing_error':
            errorMessage = 'An error occurred while processing your payment. Please try again.';
            break;
        }
        
        setError(errorMessage);
        onError(errorMessage);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        setError('Additional authentication is required. Please follow the prompts.');
      } else {
        setError('Payment was not completed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isProcessing = isLoading || externalLoading;
  const canSubmit = stripe && elements && paymentElementReady && addressElementReady && !isProcessing;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Security Badge */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <Shield size={16} className="text-green-600" />
        <span>Secured by Stripe</span>
        <Lock size={16} className="text-green-600" />
        <span>256-bit SSL encryption</span>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CreditCard className="mr-2 text-gray-600" size={20} />
            <span className="font-medium">Total Amount</span>
          </div>
          <span className="text-xl font-bold">
            {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
            {amount.toFixed(2)} {currency.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Link Authentication Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <LinkAuthenticationElement
          options={{
            defaultValues: {
              email: customerEmail || '',
            },
          }}
          onChange={(event) => {
            if (event.value?.email) {
              setEmail(event.value.email);
            }
          }}
        />
      </div>

      {/* Payment Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: {
              billingDetails: {
                name: 'auto',
                email: 'never', // We handle email separately
                phone: 'auto',
                address: {
                  country: 'auto',
                  line1: 'auto',
                  line2: 'auto',
                  city: 'auto',
                  state: 'auto',
                  postalCode: 'auto',
                },
              },
            },
            terms: {
              card: 'auto',
            },
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          }}
          onReady={() => setPaymentElementReady(true)}
          onFocus={() => setError(null)}
        />
      </div>

      {/* Address Element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Billing Address
        </label>
        <AddressElement
          options={{
            mode: 'billing',
            allowedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'AU'],
            fields: {
              phone: 'always',
            },
            validation: {
              phone: {
                required: 'always',
              },
            },
          }}
          onReady={() => setAddressElementReady(true)}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle size={16} className="text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Payment Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-black text-white px-6 py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
            <span>Processing Payment...</span>
          </>
        ) : (
          <span>
            Pay {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
            {amount.toFixed(2)}
          </span>
        )}
      </button>

      {/* Security Information */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>Your payment information is encrypted and secure</p>
        <p>We never store your card details on our servers</p>
        <p>Powered by Stripe - PCI DSS Level 1 compliant</p>
      </div>
    </form>
  );
}