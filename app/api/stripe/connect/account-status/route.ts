import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebaseAdmin';

// Enhanced logging utility for better debugging
const logError = (context: string, error: any, metadata?: Record<string, any>) => {
  console.error(`[Stripe Account Status] ${context}:`, {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    metadata,
    timestamp: new Date().toISOString(),
  });
};

const logInfo = (context: string, data: Record<string, any>) => {
  console.log(`[Stripe Account Status] ${context}:`, {
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

// Cache for account status to reduce API calls
interface CachedAccountStatus {
  data: any;
  timestamp: number;
  expiresAt: number;
}

const accountStatusCache = new Map<string, CachedAccountStatus>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to get cached status or fetch from Stripe
const getCachedAccountStatus = async (accountId: string, forceRefresh: boolean = false): Promise<any> => {
  const cacheKey = `account_${accountId}`;
  const now = Date.now();
  
  // Check cache first (unless force refresh is requested)
  if (!forceRefresh && accountStatusCache.has(cacheKey)) {
    const cached = accountStatusCache.get(cacheKey)!;
    if (now < cached.expiresAt) {
      logInfo('Cache hit', { accountId: accountId.substring(0, 12) + '...', age: now - cached.timestamp });
      return cached.data;
    } else {
      // Remove expired cache entry
      accountStatusCache.delete(cacheKey);
    }
  }
  
  // Fetch fresh data from Stripe
  const account = await stripe.accounts.retrieve(accountId);
  
  // Retrieve balance with enhanced error handling
  let balance;
  try {
    balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });
    logInfo('Balance retrieved successfully', { 
      accountId: accountId.substring(0, 12) + '...',
      availableCount: balance.available?.length || 0,
      pendingCount: balance.pending?.length || 0
    });
  } catch (balanceError: any) {
    logError('Balance Retrieval Error', balanceError, { 
      accountId: accountId.substring(0, 12) + '...',
      errorType: balanceError?.type,
      errorCode: balanceError?.code
    });
    
    // Set default empty balance structure
    balance = {
      available: [],
      pending: [],
      connect_reserved: [],
      livemode: (account as any).livemode || false,
      object: 'balance'
    };
  }
  
  // Format comprehensive response
  const statusData = {
    accountId: account.id,
    email: account.email || '',
    detailsSubmitted: account.details_submitted || false,
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    country: account.country || '',
    defaultCurrency: account.default_currency || 'usd',
    created: account.created,
    type: account.type,
    balance: {
      available: balance.available || [],
      pending: balance.pending || [],
      connectReserved: balance.connect_reserved || [],
      livemode: (balance as any).livemode || false
    },
    requirements: {
      currentlyDue: account.requirements?.currently_due || [],
      eventuallyDue: account.requirements?.eventually_due || [],
      pastDue: account.requirements?.past_due || [],
      pendingVerification: account.requirements?.pending_verification || [],
      disabledReason: account.requirements?.disabled_reason || null,
      errors: account.requirements?.errors || []
    },
    capabilities: {
      cardPayments: account.capabilities?.card_payments || 'inactive',
      transfers: account.capabilities?.transfers || 'inactive'
    },
    payouts: {
      schedule: account.settings?.payouts?.schedule || {},
      statementDescriptor: account.settings?.payouts?.statement_descriptor || '',
      debitNegativeBalances: account.settings?.payouts?.debit_negative_balances || false
    },
    businessProfile: {
      name: account.business_profile?.name || '',
      productDescription: account.business_profile?.product_description || '',
      supportEmail: account.business_profile?.support_email || '',
      supportPhone: account.business_profile?.support_phone || '',
      supportUrl: account.business_profile?.support_url || '',
      url: account.business_profile?.url || ''
    },
    metadata: account.metadata || {}
  };
  
  // Cache the result
  accountStatusCache.set(cacheKey, {
    data: statusData,
    timestamp: now,
    expiresAt: now + CACHE_DURATION
  });
  
  logInfo('Account status cached', { 
    accountId: accountId.substring(0, 12) + '...',
    cacheExpiry: new Date(now + CACHE_DURATION).toISOString()
  });
  
  return statusData;
};

// Validate Stripe configuration on module load
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('[Stripe Account Status] CRITICAL: STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

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

    const { accountId, tailorUID, forceRefresh } = requestBody;

    logInfo('Request received', {
      requestId,
      accountId: accountId ? accountId.substring(0, 12) + '...' : undefined,
      tailorUID: tailorUID ? tailorUID.substring(0, 8) + '...' : undefined,
      forceRefresh: !!forceRefresh,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    });

    // Enhanced validation for required fields
    const validationErrors: string[] = [];
    
    if (!accountId) {
      validationErrors.push('accountId is required');
    } else if (!validateAccountId(accountId)) {
      validationErrors.push('accountId format is invalid');
    }

    if (!tailorUID) {
      validationErrors.push('tailorUID is required');
    } else if (!validateTailorUID(tailorUID)) {
      validationErrors.push('tailorUID format is invalid');
    }

    if (validationErrors.length > 0) {
      logError('Validation Error', 'Invalid request parameters', { 
        requestId, 
        errors: validationErrors,
        accountId: accountId ? accountId.substring(0, 12) + '...' : undefined,
        tailorUID: tailorUID ? tailorUID.substring(0, 8) + '...' : undefined
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid request parameters', 
          details: validationErrors 
        },
        { status: 400 }
      );
    }

    // Fetch user document with enhanced error handling
    let userDoc;
    try {
      userDoc = await adminDb.collection("staging_tailors").doc(tailorUID).get();
      
      if (!userDoc.exists) {
        logError('User Not Found', 'Tailor document does not exist', { 
          requestId, 
          tailorUID: tailorUID.substring(0, 8) + '...',
          accountId: accountId.substring(0, 12) + '...'
        });
        
        return NextResponse.json(
          { error: 'User account not found. Please ensure you are logged in with the correct account.' },
          { status: 404 }
        );
      }
    } catch (userError: any) {
      logError('User Fetch Error', userError, { 
        requestId, 
        tailorUID: tailorUID.substring(0, 8) + '...',
        accountId: accountId.substring(0, 12) + '...',
        errorType: userError?.code,
        errorMessage: userError?.message
      });
      
      return NextResponse.json(
        { error: 'Unable to verify user account. Please try again later.' },
        { status: 500 }
      );
    }

    const userData = userDoc.data();
    
    // Enhanced authorization check - check both field name variations
    const stripeAccountId = userData?.stripeConnectAccountId || userData?.stripe_account_id;
    if (!stripeAccountId) {
      logError('Stripe Account Not Linked', 'User has no linked Stripe account', { 
        requestId, 
        tailorUID: tailorUID.substring(0, 8) + '...',
        accountId: accountId.substring(0, 12) + '...',
        userDataKeys: Object.keys(userData || {}),
        hasStripeConnectAccountId: !!userData?.stripeConnectAccountId,
        hasStripe_account_id: !!userData?.stripe_account_id
      });
      
      return NextResponse.json(
        { error: 'No Stripe account linked to this user. Please connect your Stripe account first.' },
        { status: 400 }
      );
    }

    if (stripeAccountId !== accountId) {
      logError('Unauthorized Access', 'Account ID mismatch', { 
        requestId, 
        tailorUID: tailorUID.substring(0, 8) + '...',
        requestedAccountId: accountId.substring(0, 12) + '...',
        userAccountId: stripeAccountId.substring(0, 12) + '...'
      });
      
      return NextResponse.json(
        { error: 'Unauthorized access to Stripe account. Please use your own account.' },
        { status: 403 }
      );
    }

    // Fetch account status with enhanced error handling
    let accountStatus;
    try {
      accountStatus = await getCachedAccountStatus(accountId, forceRefresh);
    } catch (stripeError: any) {
      logError('Stripe API Error', stripeError, { 
        requestId, 
        accountId: accountId.substring(0, 12) + '...',
        tailorUID: tailorUID.substring(0, 8) + '...',
        stripeErrorCode: stripeError?.code,
        stripeErrorType: stripeError?.type,
        stripeErrorMessage: stripeError?.message
      });
      
      // Enhanced error mapping for better user experience
      let userFriendlyError = 'Unable to retrieve Stripe account status. Please try again later.';
      let statusCode = 500;
      
      switch (stripeError?.code) {
        case 'account_invalid':
          userFriendlyError = 'The Stripe account is invalid or has been deleted.';
          statusCode = 400;
          break;
        case 'authentication_required':
          userFriendlyError = 'Authentication required. Please reconnect your Stripe account.';
          statusCode = 401;
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

    // Enhanced success logging
    logInfo('Account status retrieved successfully', {
      requestId,
      accountId: accountId.substring(0, 12) + '...',
      tailorUID: tailorUID.substring(0, 8) + '...',
      chargesEnabled: accountStatus.chargesEnabled,
      payoutsEnabled: accountStatus.payoutsEnabled,
      detailsSubmitted: accountStatus.detailsSubmitted
    });

    return NextResponse.json({
      success: true,
      account: accountStatus
    });

  } catch (error: any) {
    logError('Unhandled Error', error, { requestId });
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while retrieving account status. Please try again later.', 
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
      );
  }
}