/**
 * Payout History Service
 * Handles fetching and managing vendor payout history data
 */

export interface PayoutRecord {
  id: string;
  tailorId: string;
  orderId: string;
  totalAmount: number;
  vendorAmount: number;
  platformAmount: number;
  stripeTransferId?: string;
  stripeAccountId: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  createdAt: string;
  deliveryConfirmedAt?: string;
  
  // Enhanced audit information
  webhookPayload?: {
    event?: string;
    status?: string;
    originalOrderId?: string;
    receivedAt?: string;
  };
  
  orderDetails?: {
    paymentStatus?: string;
    currency?: string;
    originalPrice?: number;
  };
  
  vendorDetails?: {
    email?: string;
    name?: string;
    kycStatus?: {
      companyVerification?: string;
      identityVerification?: string;
      addressVerification?: string;
    };
  };
  
  stripeDetails?: {
    transferAmount?: number;
    currency?: string;
    description?: string;
    transferCreatedAt?: string;
  };
  
  failureDetails?: {
    errorType?: string;
    errorCode?: string;
    errorMessage?: string;
    failedAt?: string;
    attemptedAmount?: number;
    retryable?: boolean;
  };
  
  processingMetadata?: {
    platformVersion?: string;
    apiVersion?: string;
    processedBy?: string;
    calculationMethod?: string;
  };
}

export interface PayoutHistoryFilters {
  status?: 'all' | 'success' | 'failed' | 'pending';
  dateRange?: {
    start: string;
    end: string;
  };
  limit?: number;
  offset?: number;
}

export interface PayoutHistoryResponse {
  payouts: PayoutRecord[];
  totalCount: number;
  hasMore: boolean;
  summary: {
    totalEarnings: number;
    successfulPayouts: number;
    failedPayouts: number;
    pendingPayouts: number;
    lastPayoutDate?: string;
  };
}

/**
 * Fetch payout history for a vendor
 */
export async function fetchPayoutHistory(
  tailorUID: string,
  filters: PayoutHistoryFilters = {}
): Promise<PayoutHistoryResponse> {
  try {
    const queryParams = new URLSearchParams({
      tailorUID,
      ...filters,
      limit: (filters.limit || 10).toString(),
      offset: (filters.offset || 0).toString(),
    });

    if (filters.dateRange) {
      queryParams.append('startDate', filters.dateRange.start);
      queryParams.append('endDate', filters.dateRange.end);
    }

    const response = await fetch(`/api/stripe/connect/payout-history?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payout history: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Payout History Service] Error fetching payout history:', error);
    throw error;
  }
}

/**
 * Get payout details by ID
 */
export async function fetchPayoutDetails(payoutId: string): Promise<PayoutRecord> {
  try {
    const response = await fetch(`/api/stripe/connect/payout-details/${payoutId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payout details: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Payout History Service] Error fetching payout details:', error);
    throw error;
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'failed':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'pending':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get failure reason suggestions
 */
export function getFailureSuggestions(errorCode?: string, errorType?: string): string[] {
  const suggestions: string[] = [];

  if (errorCode === 'insufficient_funds') {
    suggestions.push('Ensure your Stripe account has sufficient balance');
    suggestions.push('Check if there are any holds on your account');
  } else if (errorCode === 'account_invalid') {
    suggestions.push('Complete your Stripe account verification');
    suggestions.push('Update your account information');
  } else if (errorType === 'card_error') {
    suggestions.push('Update your bank account information');
    suggestions.push('Contact your bank to resolve any issues');
  } else if (errorCode === 'transfer_failed') {
    suggestions.push('Verify your bank account details');
    suggestions.push('Contact Stripe support for assistance');
  } else {
    suggestions.push('Contact support for assistance');
    suggestions.push('Check your Stripe dashboard for more details');
  }

  return suggestions;
}