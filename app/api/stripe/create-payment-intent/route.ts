import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { 
      amount, 
      currency, 
      orderId, 
      customerEmail, 
      customerName, 
      userId, // User ID for referral tracking
      description,
      paymentMethodTypes,
      setupFutureUsage,
      automaticPaymentMethods,
      billingAddress
    } = await request.json();

    // Validate required fields
    if (!amount || !currency || !orderId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, currency, orderId, customerEmail' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate currency
    const supportedCurrencies = ['usd', 'eur', 'gbp'];
    if (!supportedCurrencies.includes(currency.toLowerCase())) {
      return NextResponse.json(
        { error: `Unsupported currency: ${currency}. Supported currencies: ${supportedCurrencies.join(', ')}` },
        { status: 400 }
      );
    }

    // Create payment intent with enhanced options
    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount), // Amount should already be in cents
      currency: currency.toLowerCase(),
      metadata: {
        orderId,
        customerEmail,
        customerName: customerName || '',
        userId: userId || '', // Include userId for referral tracking
        timestamp: new Date().toISOString(),
      },
      description: description || `Order ${orderId}`,
      receipt_email: customerEmail,
    };

    // Configure payment methods - use either specific types OR automatic methods, not both
    if (paymentMethodTypes && Array.isArray(paymentMethodTypes) && paymentMethodTypes.length > 0) {
      // If specific payment method types are provided, use them
      paymentIntentData.payment_method_types = paymentMethodTypes;
    } else if (automaticPaymentMethods !== false) {
      // Otherwise, use automatic payment methods (default behavior)
      paymentIntentData.automatic_payment_methods = {
        enabled: true,
      };
    }

    // Add setup future usage if specified
    if (setupFutureUsage) {
      paymentIntentData.setup_future_usage = setupFutureUsage;
    }

    // Add shipping address if billing address is provided
    if (billingAddress) {
      paymentIntentData.shipping = {
        name: customerName || customerEmail,
        address: {
          line1: billingAddress.line1,
          line2: billingAddress.line2 || undefined,
          city: billingAddress.city,
          state: billingAddress.state,
          postal_code: billingAddress.postal_code,
          country: billingAddress.country,
        },
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}