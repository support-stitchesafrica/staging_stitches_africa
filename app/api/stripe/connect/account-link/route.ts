import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebaseAdmin';

// Enhanced logging utility for better debugging
const logError = (context: string, error: any, metadata?: Record<string, any>) => {
  console.error(`[Stripe Account Link] ${context}:`, {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    metadata,
    timestamp: new Date().toISOString(),
  });
};

const logInfo = (context: string, data: Record<string, any>) => {
  console.log(`[Stripe Account Link] ${context}:`, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Enhanced validation functions
const validateAccountId = (accountId: string): boolean => {
  return typeof accountId === 'string' && 
         accountId.startsWith('acct_') && 
         accountId.length >= 21 && 
         accountId.length <= 30;
};

const validateTailorUID = (tailorUID: string): boolean => {
  return typeof tailorUID === 'string' && tailorUID.trim().length > 0 && tailorUID.length <= 100;
};

const validateURL = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    // Ensure it's HTTPS in production or HTTP in development
    const isValidProtocol = parsedUrl.protocol === 'https:' || 
                           (process.env.NODE_ENV === 'development' && parsedUrl.protocol === 'http:');
    return isValidProtocol && parsedUrl.hostname.length > 0;
  } catch {
    return false;
  }
};

// Validate Stripe configuration on module load
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('[Stripe Account Link] CRITICAL: STRIPE_SECRET_KEY environment variable is not set');
}

if (!process.env.NEXT_PUBLIC_BASE_URL) {
  console.error('[Stripe Account Link] WARNING: NEXT_PUBLIC_BASE_URL environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

// Generate proper return URLs with enhanced validation
const generateReturnURLs = (baseUrl: string, tailorUID?: string) => {
  // Redirect to vendor settings account details page after successful onboarding
  const dashboardPath = '/vendor/settings';
  const tabParam = 'tab=account-details';
  const successParam = 'stripe_onboarding=success';
  const refreshParam = 'stripe_onboarding=refresh';

  // Add vendor context if available
  const vendorParam = tailorUID ? `vendor=${encodeURIComponent(tailorUID)}` : '';

  // Build query strings properly with & separator
  const buildUrl = (mainParam: string) => {
    const params = [tabParam, mainParam];
    if (vendorParam) params.push(vendorParam);
    return `${baseUrl}${dashboardPath}?${params.join('&')}`;
  };

  return {
    return_url: buildUrl(successParam),
    refresh_url: buildUrl(refreshParam)
  };
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

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
      requestBody = await request.json();
    } catch (parseError) {
      logError('Request Parsing Error', parseError, { requestId });
      return NextResponse.json(
        { error: 'Invalid request body format. Please ensure you are sending valid JSON.' },
        { status: 400 }
      );
    }

    const { accountId, tailorUID } = requestBody;

    logInfo('Request received', {
      requestId,
      accountId: accountId ? accountId.substring(0, 12) + '...' : undefined,
      tailorUID: tailorUID ? tailorUID.substring(0, 8) + '...' : undefined,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasBaseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,
    });

    // Enhanced validation for required fields
    const validationErrors: string[] = [];
    
    if (!accountId) {
      validationErrors.push('accountId is required');
    } else if (!validateAccountId(accountId)) {
      validationErrors.push('accountId must be a valid Stripe account ID (format: acct_...)');
    }

    if (!tailorUID) {
      validationErrors.push('tailorUID is required');
    } else if (!validateTailorUID(tailorUID)) {
      validationErrors.push('tailorUID must be a valid non-empty string (max 100 characters)');
    }

    if (validationErrors.length > 0) {
      logError('Validation Error', 'Invalid input parameters', { 
        requestId, 
        validationErrors,
        accountId: accountId ? 'provided' : 'missing',
        tailorUID: tailorUID ? 'provided' : 'missing'
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

    // Verify vendor exists and owns the account with enhanced error handling
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

    // Enhanced authorization check with detailed logging - check both field name variations
    const storedAccountId = tailorData.stripeConnectAccountId || tailorData.stripe_account_id;
    if (!storedAccountId) {
      logError('Account Not Linked', 'Vendor has no linked Stripe account', { 
        requestId, 
        tailorUID: tailorUID.substring(0, 8) + '...',
        userDataKeys: Object.keys(tailorData || {}),
        hasStripeConnectAccountId: !!tailorData?.stripeConnectAccountId,
        hasStripe_account_id: !!tailorData?.stripe_account_id
      });
      return NextResponse.json(
        { 
          error: 'No Stripe account linked to vendor',
          message: 'This vendor account does not have a Stripe account linked. Please connect a Stripe account first.'
        },
        { status: 400 }
      );
    }

    if (storedAccountId !== accountId) {
      logError('Unauthorized Access', 'Account ID mismatch detected', { 
        requestId, 
        tailorUID: tailorUID.substring(0, 8) + '...',
        requestedAccountId: accountId.substring(0, 12) + '...',
        storedAccountId: storedAccountId.substring(0, 12) + '...'
      });
      return NextResponse.json(
        { 
          error: 'Unauthorized access to Stripe account',
          message: 'You do not have permission to access this Stripe account. Please use your own account.'
        },
        { status: 403 }
      );
    }

    // Generate return URLs with enhanced validation
    const returnUrlConfig = generateReturnURLs(BASE_URL, tailorUID);
    
    logInfo('Generating account link', {
      requestId,
      accountId: accountId.substring(0, 12) + '...',
      tailorUID: tailorUID.substring(0, 8) + '...',
      returnUrl: returnUrlConfig.return_url.substring(0, 50) + '...',
      refreshUrl: returnUrlConfig.refresh_url.substring(0, 50) + '...'
    });

    // Create account link with enhanced error handling
    let accountLink;
    try {
      accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: returnUrlConfig.refresh_url,
        return_url: returnUrlConfig.return_url,
        type: 'account_onboarding',
      });
    } catch (stripeError: any) {
      logError('Stripe Account Link Creation Error', stripeError, { 
        requestId, 
        accountId: accountId.substring(0, 12) + '...',
        tailorUID: tailorUID.substring(0, 8) + '...',
        stripeErrorCode: stripeError?.code,
        stripeErrorType: stripeError?.type
      });
      
      // Enhanced error mapping for better UX
      let userFriendlyError = 'Unable to create Stripe onboarding link. Please try again later.';
      let statusCode = 500;
      
      switch (stripeError?.code) {
        case 'account_invalid':
          userFriendlyError = 'The Stripe account is invalid or has been deleted. Please reconnect your Stripe account.';
          statusCode = 400;
          break;
        case 'idempotency_key_in_use':
          userFriendlyError = 'Request is already being processed. Please wait a moment and try again.';
          statusCode = 409;
          break;
        case 'rate_limit':
          userFriendlyError = 'Too many requests. Please wait a moment and try again.';
          statusCode = 429;
          break;
        case 'resource_missing':
          userFriendlyError = 'Stripe account not found. Please reconnect your Stripe account.';
          statusCode = 404;
          break;
      }
      
      return NextResponse.json(
        { error: userFriendlyError },
        { status: statusCode }
      );
    }

    // Enhanced success logging with link details
    logInfo('Account link created successfully', {
      requestId,
      accountId: accountId.substring(0, 12) + '...',
      tailorUID: tailorUID.substring(0, 8) + '...',
      linkCreated: !!accountLink.url,
      linkExpiresAt: accountLink.created + 3600 // Links expire in 1 hour
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url
    });

  } catch (error: any) {
    logError('Unhandled Error', error, { requestId });
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while creating the account link. Please try again later.', 
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}