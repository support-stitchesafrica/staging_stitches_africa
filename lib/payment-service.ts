// Payment Service for Flutterwave (USD), Paystack (NGN), and Stripe (USD/EUR)
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { analytics } from '@/lib/analytics';

export interface PaymentData {
  amount: number;
  currency: 'USD' | 'NGN' | 'EUR';
  email: string;
  name: string;
  phone?: string;
  userId?: string; // User ID for referral tracking
  orderId: string;
  description: string;
}

export interface StripePaymentData extends PaymentData {
  paymentMethodTypes?: string[];
  setupFutureUsage?: 'on_session' | 'off_session';
  automaticPaymentMethods?: boolean;
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  reference?: string;
  message?: string;
  error?: string;
  provider?: 'stripe' | 'flutterwave' | 'paystack';
  errorCode?: string;
  errorType?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface PaymentProvider {
  type: 'stripe' | 'flutterwave' | 'paystack';
  name: string;
  supportedCurrencies: ('USD' | 'NGN' | 'EUR')[];
  enabled: boolean;
  priority: number;
}

export class PaymentService {
  private static readonly FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
  private static readonly PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY;
  private static readonly STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  private static stripePromise: Promise<Stripe | null> | null = null;

  // Payment provider configuration
  private static readonly PAYMENT_PROVIDERS: PaymentProvider[] = [
    {
      type: 'stripe',
      name: 'Stripe',
      supportedCurrencies: ['USD', 'EUR'],
      enabled: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      priority: 1
    },
    {
      type: 'flutterwave',
      name: 'Flutterwave',
      supportedCurrencies: ['USD', 'NGN'],
      enabled: !!process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      priority: 2
    },
    {
      type: 'paystack',
      name: 'Paystack',
      supportedCurrencies: ['NGN'],
      enabled: !!process.env.NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY,
      priority: 3
    }
  ];

  /**
   * Get available payment providers for a specific currency
   */
  static getAvailableProviders(currency: 'USD' | 'NGN' | 'EUR'): PaymentProvider[] {
    return this.PAYMENT_PROVIDERS
      .filter(provider => provider.enabled && provider.supportedCurrencies.includes(currency))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get the best payment provider for a currency based on priority
   */
  static getBestProvider(currency: 'USD' | 'NGN' | 'EUR', userPreference?: 'stripe' | 'flutterwave' | 'paystack'): PaymentProvider | null {
    const availableProviders = this.getAvailableProviders(currency);

    // If user has a preference and it's available, use it
    if (userPreference) {
      const preferredProvider = availableProviders.find(p => p.type === userPreference);
      if (preferredProvider) {
        return preferredProvider;
      }
    }

    // Otherwise, return the highest priority provider
    return availableProviders[0] || null;
  }

  /**
   * Get payment provider health status
   */
  static getProviderHealthStatus(): Record<string, { enabled: boolean; configured: boolean; supportedCurrencies: string[] }> {
    return {
      stripe: {
        enabled: !!this.STRIPE_PUBLISHABLE_KEY,
        configured: !!(this.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY),
        supportedCurrencies: ['USD', 'EUR'],
      },
      flutterwave: {
        enabled: !!this.FLUTTERWAVE_PUBLIC_KEY,
        configured: !!this.FLUTTERWAVE_PUBLIC_KEY,
        supportedCurrencies: ['USD'],
      },
      paystack: {
        enabled: !!this.PAYSTACK_PUBLIC_KEY,
        configured: !!this.PAYSTACK_PUBLIC_KEY,
        supportedCurrencies: ['NGN'],
      },
    };
  }

  /**
   * Get recommended payment provider for a specific amount and currency
   */
  static getRecommendedProvider(
    amount: number,
    currency: 'USD' | 'NGN' | 'EUR',
    userLocation?: string
  ): PaymentProvider | null {
    const availableProviders = this.getAvailableProviders(currency);
    
    if (availableProviders.length === 0) {
      return null;
    }

    // Location-based recommendations
    if (userLocation) {
      const locationLower = userLocation.toLowerCase();
      
      // Recommend Paystack for Nigerian users
      if ((locationLower.includes('nigeria') || locationLower.includes('ng')) && currency === 'NGN') {
        const paystack = availableProviders.find(p => p.type === 'paystack');
        if (paystack) return paystack;
      }
      
      // Recommend Stripe for European users with EUR
      if (currency === 'EUR' && (locationLower.includes('europe') || locationLower.includes('eu'))) {
        const stripe = availableProviders.find(p => p.type === 'stripe');
        if (stripe) return stripe;
      }
    }

    // Amount-based recommendations
    if (currency === 'USD') {
      // For larger amounts, prefer Stripe for better fraud protection
      if (amount > 100) {
        const stripe = availableProviders.find(p => p.type === 'stripe');
        if (stripe) return stripe;
      }
    }

    // Default to highest priority provider
    return availableProviders[0];
  }

  /**
   * Validate payment data before processing
   */
  static validatePaymentData(paymentData: PaymentData): string[] {
    const errors: string[] = [];

    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!paymentData.currency || !['USD', 'NGN', 'EUR'].includes(paymentData.currency)) {
      errors.push('Invalid currency. Supported currencies: USD, NGN, EUR');
    }

    if (!paymentData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paymentData.email)) {
      errors.push('Valid email address is required');
    }

    if (!paymentData.name || paymentData.name.trim().length < 2) {
      errors.push('Customer name is required (minimum 2 characters)');
    }

    if (!paymentData.orderId || paymentData.orderId.trim().length === 0) {
      errors.push('Order ID is required');
    }

    if (!paymentData.description || paymentData.description.trim().length === 0) {
      errors.push('Payment description is required');
    }

    return errors;
  }

  /**
   * Log payment attempt for analytics and debugging
   */
  private static logPaymentAttempt(
    provider: string,
    paymentData: PaymentData,
    result: PaymentResult,
    startTime?: number
  ): void {
    const duration = startTime ? performance.now() - startTime : 0;
    
    const logData = {
      timestamp: new Date().toISOString(),
      provider,
      currency: paymentData.currency,
      amount: paymentData.amount,
      orderId: paymentData.orderId,
      success: result.success,
      error: result.error,
      errorCode: result.errorCode,
      transactionId: result.transactionId,
      duration,
    };

    console.log('Payment attempt:', logData);

    // Track payment analytics
    analytics.trackPayment({
      provider: provider as 'stripe' | 'flutterwave' | 'paystack',
      currency: paymentData.currency,
      amount: paymentData.amount,
      success: result.success,
      errorType: result.errorType,
      errorCode: result.errorCode,
      duration,
      timestamp: result.timestamp || new Date().toISOString(),
      orderId: paymentData.orderId,
    });
  }

  /**
   * Initialize payment with automatic provider selection or explicit provider
   */
  static async initializePayment(
    paymentData: PaymentData,
    provider?: 'stripe' | 'flutterwave' | 'paystack'
  ): Promise<PaymentResult> {
    const timestamp = new Date().toISOString();
    const startTime = performance.now();

    try {
      // Validate payment data first
      const validationErrors = this.validatePaymentData(paymentData);
      if (validationErrors.length > 0) {
        const result: PaymentResult = {
          success: false,
          error: `Validation failed: ${validationErrors.join(', ')}`,
          errorType: 'validation_error',
          timestamp,
        };
        this.logPaymentAttempt('validation', paymentData, result, startTime);
        return result;
      }

      // Determine the best provider
      const selectedProvider = provider
        ? this.PAYMENT_PROVIDERS.find(p => p.type === provider && p.enabled)
        : this.getBestProvider(paymentData.currency);

      if (!selectedProvider) {
        const result: PaymentResult = {
          success: false,
          error: `No payment provider available for ${paymentData.currency}`,
          errorType: 'provider_unavailable',
          timestamp,
        };
        this.logPaymentAttempt('provider_selection', paymentData, result, startTime);
        return result;
      }

      // Check if the selected provider supports the currency
      if (!selectedProvider.supportedCurrencies.includes(paymentData.currency)) {
        const result: PaymentResult = {
          success: false,
          error: `${selectedProvider.name} does not support ${paymentData.currency}`,
          errorType: 'currency_not_supported',
          timestamp,
          provider: selectedProvider.type,
        };
        this.logPaymentAttempt(selectedProvider.type, paymentData, result, startTime);
        return result;
      }

      console.log(`Initializing payment with ${selectedProvider.name} for ${paymentData.currency} ${paymentData.amount}`);

      // Initialize payment with the selected provider
      let result: PaymentResult;
      switch (selectedProvider.type) {
        case 'stripe':
          result = await this.initializeStripePayment(paymentData);
          break;
        case 'flutterwave':
          result = await this.initializeFlutterwavePayment(paymentData);
          break;
        case 'paystack':
          result = await this.initializePaystackPayment(paymentData);
          break;
        default:
          result = {
            success: false,
            error: 'Invalid payment provider',
            errorType: 'invalid_provider',
            timestamp,
          };
      }

      // Add provider information and timestamp to the result
      const enhancedResult: PaymentResult = {
        ...result,
        provider: selectedProvider.type,
        timestamp,
        metadata: {
          providerName: selectedProvider.name,
          currency: paymentData.currency,
          amount: paymentData.amount,
          orderId: paymentData.orderId,
        },
      };

      // Log the payment attempt
      this.logPaymentAttempt(selectedProvider.type, paymentData, enhancedResult, startTime);

      return enhancedResult;
    } catch (error) {
      console.error('Payment initialization error:', error);
      const result: PaymentResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize payment',
        errorType: 'initialization_error',
        timestamp,
      };
      this.logPaymentAttempt('system', paymentData, result, startTime);
      return result;
    }
  }

  private static getStripe(): Promise<Stripe | null> {
    if (!this.stripePromise) {
      this.stripePromise = loadStripe(this.STRIPE_PUBLISHABLE_KEY || '');
    }
    return this.stripePromise;
  }

  static async initializeStripePayment(paymentData: PaymentData | StripePaymentData): Promise<PaymentResult> {
    const timestamp = new Date().toISOString();

    try {
      // Validate Stripe-specific requirements
      if (!this.STRIPE_PUBLISHABLE_KEY) {
        return {
          success: false,
          error: 'Stripe is not configured',
          errorType: 'configuration_error',
          provider: 'stripe',
          timestamp,
        };
      }

      const stripe = await this.getStripe();
      if (!stripe) {
        return {
          success: false,
          error: 'Stripe failed to load',
          errorType: 'stripe_load_error',
          provider: 'stripe',
          timestamp,
        };
      }

      // Enhanced payment data for Stripe
      const stripeData = paymentData as StripePaymentData;

      // Validate amount for Stripe (minimum 50 cents for most currencies)
      const minAmount = paymentData.currency === 'USD' ? 0.50 : paymentData.currency === 'EUR' ? 0.50 : 1.00;
      if (paymentData.amount < minAmount) {
        return {
          success: false,
          error: `Minimum amount for ${paymentData.currency} is ${minAmount}`,
          errorType: 'amount_too_small',
          provider: 'stripe',
          timestamp,
        };
      }

      console.log('Creating Stripe payment intent:', {
        amount: paymentData.amount,
        currency: paymentData.currency,
        orderId: paymentData.orderId,
      });

      // Create payment intent on the server
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(paymentData.amount * 100), // Convert to cents
          currency: paymentData.currency.toLowerCase(),
          orderId: paymentData.orderId,
          customerEmail: paymentData.email,
          customerName: paymentData.name,
          description: paymentData.description,
          // Only send paymentMethodTypes if explicitly specified, otherwise use automatic payment methods
          ...(stripeData.paymentMethodTypes && stripeData.paymentMethodTypes.length > 0 
            ? { paymentMethodTypes: stripeData.paymentMethodTypes }
            : { automaticPaymentMethods: stripeData.automaticPaymentMethods !== false }
          ),
          setupFutureUsage: stripeData.setupFutureUsage,
          billingAddress: stripeData.billingAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to create payment intent';

        return {
          success: false,
          error: errorMessage,
          errorType: 'api_error',
          errorCode: response.status.toString(),
          provider: 'stripe',
          timestamp,
        };
      }

      const { clientSecret, paymentIntentId, status } = await response.json();

      console.log('Stripe payment intent created:', {
        paymentIntentId,
        status,
        orderId: paymentData.orderId,
      });

      return {
        success: true,
        transactionId: paymentIntentId,
        reference: clientSecret,
        message: 'Payment intent created successfully',
        provider: 'stripe',
        timestamp,
        metadata: {
          paymentIntentStatus: status,
          clientSecretPrefix: clientSecret?.substring(0, 20) + '...',
        },
      };
    } catch (error) {
      console.error('Stripe payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process Stripe payment',
        errorType: 'network_error',
        provider: 'stripe',
        timestamp,
      };
    }
  }

  static async confirmStripePayment(clientSecret: string, paymentMethod?: any): Promise<PaymentResult> {
    const timestamp = new Date().toISOString();

    try {
      if (!clientSecret) {
        return {
          success: false,
          error: 'Client secret is required for payment confirmation',
          errorType: 'missing_client_secret',
          provider: 'stripe',
          timestamp,
        };
      }

      const stripe = await this.getStripe();
      if (!stripe) {
        return {
          success: false,
          error: 'Stripe failed to load',
          errorType: 'stripe_load_error',
          provider: 'stripe',
          timestamp,
        };
      }

      console.log('Confirming Stripe payment:', {
        clientSecretPrefix: clientSecret.substring(0, 20) + '...',
        hasPaymentMethod: !!paymentMethod,
      });

      const { error, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: paymentMethod ? { payment_method: paymentMethod } : {},
        redirect: 'if_required',
      });

      if (error) {
        console.error('Stripe payment confirmation error:', error);
        return {
          success: false,
          error: error.message || 'Payment confirmation failed',
          errorType: error.type || 'confirmation_error',
          errorCode: error.code,
          provider: 'stripe',
          timestamp,
        };
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Stripe payment confirmed successfully:', {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        });

        return {
          success: true,
          transactionId: paymentIntent.id,
          reference: paymentIntent.client_secret || '',
          message: 'Payment completed successfully',
          provider: 'stripe',
          timestamp,
          metadata: {
            paymentIntentStatus: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            paymentMethodType: 'card', // Default to card since charges may not be available immediately
          },
        };
      }

      return {
        success: false,
        error: `Payment was not completed. Status: ${paymentIntent?.status || 'unknown'}`,
        errorType: 'payment_incomplete',
        provider: 'stripe',
        timestamp,
        metadata: {
          paymentIntentStatus: paymentIntent?.status,
        },
      };
    } catch (error) {
      console.error('Stripe payment confirmation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm payment',
        errorType: 'network_error',
        provider: 'stripe',
        timestamp,
      };
    }
  }

  private static async initializeFlutterwavePayment(paymentData: PaymentData): Promise<PaymentResult> {
    const timestamp = new Date().toISOString();

    try {
      // Validate Flutterwave configuration
      if (!this.FLUTTERWAVE_PUBLIC_KEY) {
        return {
          success: false,
          error: 'Flutterwave is not configured',
          errorType: 'configuration_error',
          provider: 'flutterwave',
          timestamp,
        };
      }

      // Validate currency support
      if (paymentData.currency !== 'USD' && paymentData.currency !== 'NGN') {
        return {
          success: false,
          error: 'Flutterwave only supports USD and NGN payments',
          errorType: 'currency_not_supported',
          provider: 'flutterwave',
          timestamp,
        };
      }

      // Load Flutterwave script if not already loaded
      if (!window.FlutterwaveCheckout) {
        console.log('Loading Flutterwave script...');
        await this.loadFlutterwaveScript();
      }

      const txRef = `tx_${paymentData.orderId}_${Date.now()}`;

      console.log('Initializing Flutterwave payment:', {
        amount: paymentData.amount,
        currency: paymentData.currency,
        orderId: paymentData.orderId,
        txRef,
      });

      return new Promise((resolve) => {
        window.FlutterwaveCheckout({
          public_key: this.FLUTTERWAVE_PUBLIC_KEY,
          tx_ref: txRef,
          amount: paymentData.amount,
          currency: paymentData.currency,
          payment_options: 'card,mobilemoney,ussd',
          customer: {
            email: paymentData.email,
            phone_number: paymentData.phone || '',
            name: paymentData.name,
          },
          customizations: {
            title: 'Stitches Africa',
            description: paymentData.description,
            logo: '/Stitches-Africa-Logo-06.png',
          },
          callback: (response: any) => {
            console.log('Flutterwave payment response:', response);
            if (response.status === 'successful') {
              resolve({
                success: true,
                transactionId: response.transaction_id,
                reference: response.tx_ref,
                message: 'Payment successful',
                provider: 'flutterwave',
                timestamp,
                metadata: {
                  flutterwaveResponse: {
                    status: response.status,
                    transactionId: response.transaction_id,
                    txRef: response.tx_ref,
                    amount: response.amount,
                    currency: response.currency,
                  },
                },
              });
            } else {
              resolve({
                success: false,
                error: `Payment was not completed. Status: ${response.status}`,
                errorType: 'payment_incomplete',
                provider: 'flutterwave',
                timestamp,
                metadata: {
                  flutterwaveResponse: response,
                },
              });
            }
          },
          onclose: () => {
            console.log('Flutterwave payment modal closed by user');
            resolve({
              success: false,
              error: 'Payment was cancelled by user',
              errorType: 'user_cancelled',
              provider: 'flutterwave',
              timestamp,
            });
          },
        });
      });
    } catch (error) {
      console.error('Flutterwave payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process Flutterwave payment',
        errorType: 'initialization_error',
        provider: 'flutterwave',
        timestamp,
      };
    }
  }

  private static async initializePaystackPayment(paymentData: PaymentData): Promise<PaymentResult> {
    const timestamp = new Date().toISOString();
    
    try {
      // Validate Paystack configuration
      if (!this.PAYSTACK_PUBLIC_KEY) {
        return {
          success: false,
          error: 'Paystack is not configured',
          errorType: 'configuration_error',
          provider: 'paystack',
          timestamp,
        };
      }

      // Validate currency support
      if (paymentData.currency !== 'NGN') {
        return {
          success: false,
          error: 'Paystack only supports NGN payments',
          errorType: 'currency_not_supported',
          provider: 'paystack',
          timestamp,
        };
      }

      // Load Paystack script if not already loaded
      if (!window.PaystackPop) {
        console.log('Loading Paystack script...');
        await this.loadPaystackScript();
      }

      const paymentRef = `ps_${paymentData.orderId}_${Date.now()}`;
      const amountInKobo = Math.round(paymentData.amount * 100); // Paystack expects amount in kobo

      console.log('Initializing Paystack payment:', {
        amount: paymentData.amount,
        amountInKobo,
        currency: paymentData.currency,
        orderId: paymentData.orderId,
        paymentRef,
      });

      return new Promise((resolve) => {
        const handler = window.PaystackPop.setup({
          key: this.PAYSTACK_PUBLIC_KEY,
          email: paymentData.email,
          amount: amountInKobo,
          currency: paymentData.currency,
          ref: paymentRef,
          metadata: {
            custom_fields: [
              {
                display_name: "Order ID",
                variable_name: "order_id",
                value: paymentData.orderId
              },
              {
                display_name: "Customer Name",
                variable_name: "customer_name",
                value: paymentData.name
              }
            ]
          },
          callback: (response: any) => {
            console.log('Paystack payment response:', response);
            resolve({
              success: true,
              transactionId: response.transaction,
              reference: response.reference,
              message: 'Payment successful',
              provider: 'paystack',
              timestamp,
              metadata: {
                paystackResponse: {
                  transaction: response.transaction,
                  reference: response.reference,
                  status: response.status,
                  amount: response.amount,
                  currency: response.currency,
                },
              },
            });
          },
          onClose: () => {
            console.log('Paystack payment modal closed by user');
            resolve({
              success: false,
              error: 'Payment was cancelled by user',
              errorType: 'user_cancelled',
              provider: 'paystack',
              timestamp,
            });
          },
        });

        handler.openIframe();
      });
    } catch (error) {
      console.error('Paystack payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process Paystack payment',
        errorType: 'initialization_error',
        provider: 'paystack',
        timestamp,
      };
    }
  }

  private static loadFlutterwaveScript(): Promise < void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('flutterwave-script')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'flutterwave-script';
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Flutterwave script'));
    document.head.appendChild(script);
  });
}

  private static loadPaystackScript(): Promise < void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('paystack-script')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'paystack-script';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.head.appendChild(script);
  });
}

  static getCurrencySymbol(currency: 'USD' | 'NGN' | 'EUR'): string {
  switch (currency) {
    case 'USD': return '$';
    case 'NGN': return '₦';
    case 'EUR': return '€';
    default: return '$';
  }
}

  static formatAmount(amount: number, currency: 'USD' | 'NGN' | 'EUR'): string {
  const symbol = this.getCurrencySymbol(currency);
  
  // For NGN, round to whole numbers since kobo are rarely used
  if (currency === 'NGN') {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }
  
  // For USD and EUR, show 2 decimal places
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

  static convertCurrency(amount: number, fromCurrency: 'USD' | 'NGN' | 'EUR', toCurrency: 'USD' | 'NGN' | 'EUR'): number {
  // Exchange rates (approximate - updated for 2025)
  const USD_TO_NGN_RATE = 1550; // Updated rate
  const USD_TO_EUR_RATE = 0.92; // Updated rate

  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to USD first, then to target currency
  let usdAmount = amount;

  if (fromCurrency === 'NGN') {
    usdAmount = amount / USD_TO_NGN_RATE;
  } else if (fromCurrency === 'EUR') {
    usdAmount = amount / USD_TO_EUR_RATE;
  }

  // Convert from USD to target currency
  if (toCurrency === 'NGN') {
    return usdAmount * USD_TO_NGN_RATE;
  } else if (toCurrency === 'EUR') {
    return usdAmount * USD_TO_EUR_RATE;
  }

  return usdAmount;
}
}

// Extend window interface for payment scripts
declare global {
  interface Window {
    FlutterwaveCheckout: any;
    PaystackPop: any;
  }
}