import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebaseAdmin';

// Enhanced logging utility for better debugging
const logError = (context: string, error: any, metadata?: Record<string, any>) => {
  console.error(`[Stripe Create Account] ${context}:`, {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    metadata,
    timestamp: new Date().toISOString(),
  });
};

const logInfo = (context: string, data: Record<string, any>) => {
  console.log(`[Stripe Create Account] ${context}:`, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Validate Stripe configuration on module load
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('[Stripe Create Account] CRITICAL: STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

// Enhanced validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254; // RFC 5322 limit
};

const validateTailorUID = (tailorUID: string): boolean => {
  return typeof tailorUID === 'string' && tailorUID.trim().length > 0 && tailorUID.length <= 100;
};

const validateCountryCode = (country: string): boolean => {
  // List of supported Stripe Connect countries
  const supportedCountries = [
    'US', 'CA', 'GB', 'AU', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 
    'SK', 'SI', 'ES', 'SE', 'CH', 'BR', 'MX', 'JP', 'SG', 'HK', 'MY', 'TH', 'IN', 'AE', 'NZ'
  ];
  return supportedCountries.includes(country.toUpperCase());
};

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Check Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      logError('Configuration Error', 'STRIPE_SECRET_KEY not configured', { requestId });
      return NextResponse.json(
        { error: 'Service configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    let requestBody;
    try {
      const text = await request.text();
      
      // Check if body is empty
      if (!text || text.trim() === '') {
        logError('Request Parsing Error', 'Empty request body', { requestId });
        return NextResponse.json(
          { error: 'Request body is empty. Please provide required information.' },
          { status: 400 }
        );
      }
      
      requestBody = JSON.parse(text);
    } catch (parseError) {
      logError('Request Parsing Error', parseError, { requestId });
      return NextResponse.json(
        { error: 'Invalid request body format. Please ensure you are sending valid JSON.' },
        { status: 400 }
      );
    }

    const { tailorUID, email, businessName, country } = requestBody;

    logInfo('Request received', {
      requestId,
      tailorUID: tailorUID ? `${tailorUID.substring(0, 8)}...` : undefined, // Partial logging for privacy
      email: email ? `${email.split('@')[0]}@***` : undefined, // Masked email for privacy
      businessName: businessName ? businessName.substring(0, 20) : undefined,
      country,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    });

    // Enhanced validation for required fields
    const validationErrors: string[] = [];
    
    if (!tailorUID) {
      validationErrors.push('tailorUID is required');
    } else if (!validateTailorUID(tailorUID)) {
      validationErrors.push('tailorUID must be a valid non-empty string (max 100 characters)');
    }

    if (!email) {
      validationErrors.push('email is required');
    } else if (!validateEmail(email)) {
      validationErrors.push('email must be a valid email address');
    }

    if (country && !validateCountryCode(country)) {
      validationErrors.push('country must be a valid ISO country code supported by Stripe Connect');
    }

    if (businessName && (typeof businessName !== 'string' || businessName.length > 100)) {
      validationErrors.push('businessName must be a string with maximum 100 characters');
    }

    if (validationErrors.length > 0) {
      logError('Validation Error', 'Invalid input parameters', { 
        requestId, 
        validationErrors,
        tailorUID: tailorUID ? 'provided' : 'missing',
        email: email ? 'provided' : 'missing'
      });
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationErrors,
          message: `Please correct the following issues: ${validationErrors.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Check if vendor exists in Firestore with enhanced error handling
    // Use Admin SDK to bypass security rules for server-side operations
    let tailorSnap;
    
    try {
      tailorSnap = await adminDb.collection("staging_tailors").doc(tailorUID).get();
    } catch (firestoreError: any) {
      logError('Firestore Retrieval Error', firestoreError, { 
        requestId, 
        tailorUID: tailorUID.substring(0, 8) + '...',
        operation: 'getDoc'
      });
      
      // Provide more specific error messages based on Firestore error codes
      if (firestoreError?.code === 'permission-denied') {
        return NextResponse.json(
          { error: 'Database access denied. Please contact support.' },
          { status: 403 }
        );
      } else if (firestoreError?.code === 'unavailable') {
        return NextResponse.json(
          { error: 'Database temporarily unavailable. Please try again in a moment.' },
          { status: 503 }
        );
      } else {
        return NextResponse.json(
          { error: 'Database error: Unable to retrieve vendor information. Please try again.' },
          { status: 500 }
        );
      }
    }

    if (!tailorSnap.exists) {
      logError('Vendor Not Found', 'Vendor document does not exist in Firestore', { 
        requestId, 
        tailorUID: tailorUID.substring(0, 8) + '...'
      });
      return NextResponse.json(
        { 
          error: 'Vendor not found in database',
          message: 'The specified vendor account does not exist. Please ensure you are using the correct vendor ID.'
        },
        { status: 404 }
      );
    }

    const tailorData = tailorSnap.data();
    
    // Validate vendor data integrity
    if (!tailorData) {
      logError('Vendor Data Error', 'Vendor document exists but contains no data', { 
        requestId, 
        tailorUID: tailorUID.substring(0, 8) + '...'
      });
      return NextResponse.json(
        { error: 'Vendor data is corrupted. Please contact support.' },
        { status: 500 }
      );
    }

    logInfo('Vendor found', {
      requestId,
      tailorUID: tailorUID.substring(0, 8) + '...',
      hasStripeAccount: !!tailorData.stripeConnectAccountId,
      stripeAccountId: tailorData.stripeConnectAccountId ? 
        tailorData.stripeConnectAccountId.substring(0, 12) + '...' : null,
      vendorEmail: tailorData.email ? tailorData.email.split('@')[0] + '@***' : 'not_set'
    });

    // If account already exists, retrieve and return existing account
    if (tailorData.stripeConnectAccountId) {
      try {
        logInfo('Retrieving existing Stripe account', {
          requestId,
          accountId: tailorData.stripeConnectAccountId.substring(0, 12) + '...'
        });
        
        const account = await stripe.accounts.retrieve(tailorData.stripeConnectAccountId);
        
        logInfo('Existing account retrieved successfully', {
          requestId,
          accountId: account.id.substring(0, 12) + '...',
          detailsSubmitted: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled
        });
        
        return NextResponse.json({
          accountId: account.id,
          detailsSubmitted: account.details_submitted,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
        });
      } catch (stripeError: any) {
        logError('Stripe Account Retrieval Error', stripeError, { 
          requestId, 
          storedAccountId: tailorData.stripeConnectAccountId.substring(0, 12) + '...'
        });
        
        // If account doesn't exist in Stripe (deleted or invalid), clear it and create new one
        if (stripeError instanceof Stripe.errors.StripeInvalidRequestError && 
            stripeError.message.includes('No such account')) {
          logInfo('Stripe account not found, clearing stored ID and creating new account', {
            requestId,
            invalidAccountId: tailorData.stripeConnectAccountId.substring(0, 12) + '...'
          });
          
          try {
            await adminDb.collection("staging_tailors").doc(tailorUID).update({
              stripeConnectAccountId: null,
              stripeAccountCreatedAt: null,
            });
            logInfo('Invalid account ID cleared from Firestore', { requestId });
          } catch (clearError: any) {
            logError('Error clearing invalid account ID', clearError, { 
              requestId,
              operation: 'updateDoc_clear'
            });
            // Continue anyway - we'll create a new account
          }
          
          // Continue to create new account (don't return here)
        } else if (stripeError instanceof Stripe.errors.StripeError) {
          // Handle specific Stripe error types
          const errorMessage = stripeError.type === 'StripePermissionError' 
            ? 'Insufficient permissions to access Stripe account'
            : stripeError.message;
            
          return NextResponse.json(
            { 
              error: `Stripe error: ${errorMessage}`,
              type: stripeError.type,
              message: 'There was an issue accessing your existing Stripe account. Please try again or contact support.'
            },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            { 
              error: 'Failed to retrieve existing Stripe account',
              message: 'Unable to access your existing Stripe account. Please try again later.'
            },
            { status: 500 }
          );
        }
      }
    }

    // Create new Stripe Connect Express account
    let account;
    const accountCreationData = {
      type: 'express' as const,
      country: country || 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual' as const,
      business_profile: {
        name: businessName || `${tailorData.brand_name || tailorData.first_name || 'Vendor'}`,
        product_description: 'Fashion and tailoring services on Stitches Africa marketplace',
        url: 'https://www.stitchesafrica.com',
      },
      metadata: {
        tailorUID: tailorUID,
        platform: 'stitches_africa',
        created_via: 'api',
        vendor_email: email,
        request_id: requestId,
      },
    };

    try {
      logInfo('Creating new Stripe Connect account', {
        requestId,
        country: accountCreationData.country,
        businessType: accountCreationData.business_type,
        email: email.split('@')[0] + '@***'
      });
      
      account = await stripe.accounts.create(accountCreationData);
      
      logInfo('Stripe account created successfully', {
        requestId,
        accountId: account.id.substring(0, 12) + '...',
        country: account.country,
        type: account.type,
        detailsSubmitted: account.details_submitted
      });
    } catch (stripeError: any) {
      logError('Stripe Account Creation Error', stripeError, { 
        requestId,
        country: accountCreationData.country,
        email: email.split('@')[0] + '@***'
      });
      
      if (stripeError instanceof Stripe.errors.StripeError) {
        // Handle specific Stripe error types with better user messages
        let userMessage = 'Failed to create Stripe Connect account';
        
        switch (stripeError.type) {
          case 'StripeInvalidRequestError':
            if (stripeError.message.includes('email')) {
              userMessage = 'The provided email address is invalid or already in use with another Stripe account';
            } else if (stripeError.message.includes('country')) {
              userMessage = 'The specified country is not supported for Stripe Connect accounts';
            } else {
              userMessage = 'Invalid account information provided';
            }
            break;
          case 'StripePermissionError':
            userMessage = 'Insufficient permissions to create Stripe accounts. Please contact support';
            break;
          case 'StripeRateLimitError':
            userMessage = 'Too many account creation requests. Please try again in a few minutes';
            break;
          default:
            userMessage = stripeError.message;
        }
        
        return NextResponse.json(
          { 
            error: `Stripe error: ${userMessage}`,
            type: stripeError.type,
            code: stripeError.code,
            message: 'Unable to create your Stripe Connect account. Please check your information and try again.'
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create Stripe Connect account',
          message: 'An unexpected error occurred while setting up your payment account. Please try again later.'
        },
        { status: 500 }
      );
    }

    // Save Stripe account ID to Firestore with enhanced error handling
    // Set splitPercentage to 80 (vendor gets 80%, platform keeps 20%) - same as Flutterwave
    const updateData = {
      stripeConnectAccountId: account.id,
      stripeAccountCreatedAt: new Date().toISOString(),
      stripeAccountCountry: account.country,
      stripeAccountType: account.type,
      lastStripeUpdate: new Date().toISOString(),
      splitPercentage: 80, // Vendor receives 80% of revenue, platform keeps 20%
    };

    try {
      logInfo('Saving Stripe account ID to Firestore', {
        requestId,
        accountId: account.id.substring(0, 12) + '...',
        tailorUID: tailorUID.substring(0, 8) + '...'
      });
      
      // Use Admin SDK to bypass security rules for server-side operations
      await adminDb.collection("staging_tailors").doc(tailorUID).update(updateData);
      
      logInfo('Stripe account ID saved successfully', {
        requestId,
        accountId: account.id.substring(0, 12) + '...'
      });
    } catch (firestoreError: any) {
      logError('CRITICAL: Firestore Save Error', firestoreError, { 
        requestId,
        accountId: account.id,
        tailorUID: tailorUID,
        operation: 'updateDoc_save',
        errorCode: firestoreError?.code
      });
      
      // Account was created but not saved to Firestore - this is a critical error
      // We need to provide the account ID for manual recovery
      console.error('CRITICAL: Stripe account created but not saved to Firestore', {
        accountId: account.id,
        tailorUID: tailorUID,
        requestId: requestId,
        timestamp: new Date().toISOString(),
        firestoreError: firestoreError?.message
      });
      
      // Provide specific error messages based on Firestore error codes
      let errorMessage = 'Database error: Account created but failed to save. Please contact support immediately.';
      
      if (firestoreError?.code === 'permission-denied') {
        errorMessage = 'Database permission error: Account created but could not be linked to your profile. Please contact support.';
      } else if (firestoreError?.code === 'unavailable') {
        errorMessage = 'Database temporarily unavailable: Account created but could not be saved. Please contact support.';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          accountId: account.id, // Provide account ID for manual recovery
          requestId: requestId,
          message: 'Your Stripe account was created successfully, but there was an issue linking it to your profile. Please contact support with the provided request ID.'
        },
        { status: 500 }
      );
    }

    // Return successful response
    const response = {
      accountId: account.id,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      country: account.country,
      type: account.type,
      requestId: requestId,
    };

    logInfo('Account creation completed successfully', {
      requestId,
      accountId: account.id.substring(0, 12) + '...',
      detailsSubmitted: response.detailsSubmitted,
      chargesEnabled: response.chargesEnabled,
      payoutsEnabled: response.payoutsEnabled
    });

    return NextResponse.json(response);
  } catch (error: any) {
    logError('Unexpected error in create-account route', error, { 
      requestId,
      errorType: error?.constructor?.name,
      errorMessage: error?.message
    });
    
    // Handle specific error types with appropriate responses
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          error: 'Invalid request body format',
          message: 'The request data is not properly formatted. Please ensure you are sending valid JSON.',
          requestId: requestId
        },
        { status: 400 }
      );
    }
    
    if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { 
          error: 'Network connectivity error',
          message: 'Unable to connect to external services. Please try again later.',
          requestId: requestId
        },
        { status: 503 }
      );
    }
    
    if (error?.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { 
          error: 'Request timeout',
          message: 'The request took too long to process. Please try again.',
          requestId: requestId
        },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        message: 'Something went wrong while processing your request. If the problem persists, please contact support.',
        requestId: requestId
      },
      { status: 500 }
    );
  }
}
