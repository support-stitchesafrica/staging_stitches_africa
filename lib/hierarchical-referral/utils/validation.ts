import { 
  Influencer, 
  ReferralCode, 
  CommissionRates,
  HierarchicalReferralError,
  HierarchicalReferralErrorCode 
} from '../../../types/hierarchical-referral';

/**
 * Validation utilities for hierarchical referral system
 */

/**
 * Validate influencer data
 */
export function validateInfluencer(influencer: Partial<Influencer>): HierarchicalReferralError | null {
  if (!influencer.email || !isValidEmail(influencer.email)) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Valid email is required'
    };
  }

  if (!influencer.name || influencer.name.trim().length < 2) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Name must be at least 2 characters long'
    };
  }

  if (!influencer.type || !['mother', 'mini'].includes(influencer.type)) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Influencer type must be either "mother" or "mini"'
    };
  }

  if (influencer.type === 'mini' && !influencer.parentInfluencerId) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Mini influencer must have a parent influencer ID'
    };
  }

  if (influencer.type === 'mother' && influencer.parentInfluencerId) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Mother influencer cannot have a parent influencer'
    };
  }

  return null;
}

/**
 * Validate referral code data
 */
export function validateReferralCode(code: Partial<ReferralCode>): HierarchicalReferralError | null {
  if (!code.code || code.code.trim().length === 0) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Referral code is required'
    };
  }

  if (!code.type || !['master', 'sub'].includes(code.type)) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Code type must be either "master" or "sub"'
    };
  }

  if (!code.createdBy) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Creator ID is required'
    };
  }

  // Sub codes can be created without being assigned immediately
  // if (code.type === 'sub' && !code.assignedTo) {
  //   return {
  //     code: HierarchicalReferralErrorCode.INVALID_INPUT,
  //     message: 'Sub codes must be assigned to a Mini Influencer'
  //   };
  // }

  if (code.maxUsage && code.maxUsage < 1) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Max usage must be at least 1'
    };
  }

  return null;
}

/**
 * Validate commission rates
 */
export function validateCommissionRates(rates: CommissionRates): HierarchicalReferralError | null {
  if (rates.miniInfluencerRate < 0 || rates.miniInfluencerRate > 100) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Mini influencer rate must be between 0 and 100'
    };
  }

  if (rates.motherInfluencerRate < 0 || rates.motherInfluencerRate > 100) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Mother influencer rate must be between 0 and 100'
    };
  }

  const totalRate = rates.miniInfluencerRate + rates.motherInfluencerRate;
  if (totalRate > 100) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Total commission rates cannot exceed 100%'
    };
  }

  return null;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate payout amount
 */
export function validatePayoutAmount(amount: number, minimumThreshold: number = 0): HierarchicalReferralError | null {
  if (amount <= 0) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Payout amount must be greater than 0'
    };
  }

  if (minimumThreshold > 0 && amount < minimumThreshold) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: `Payout amount must be at least ${minimumThreshold}`
    };
  }

  // Maximum reasonable payout amount (safety check)
  if (amount > 1000000) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Payout amount exceeds maximum allowed limit'
    };
  }

  return null;
}

/**
 * Validate payout information
 */
export function validatePayoutInfo(payoutInfo: any): HierarchicalReferralError | null {
  if (!payoutInfo) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Payout information is required'
    };
  }

  if (!payoutInfo.currency || typeof payoutInfo.currency !== 'string') {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Valid currency is required'
    };
  }

  if (payoutInfo.minimumThreshold && (typeof payoutInfo.minimumThreshold !== 'number' || payoutInfo.minimumThreshold < 0)) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Minimum threshold must be a non-negative number'
    };
  }

  // Validate Stripe account ID if provided
  if (payoutInfo.stripeAccountId && typeof payoutInfo.stripeAccountId !== 'string') {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Stripe account ID must be a string'
    };
  }

  // Validate bank account if provided
  if (payoutInfo.bankAccount) {
    const { accountNumber, routingNumber, accountHolderName } = payoutInfo.bankAccount;
    
    if (!accountNumber || typeof accountNumber !== 'string') {
      return {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Valid bank account number is required'
      };
    }

    if (!routingNumber || typeof routingNumber !== 'string') {
      return {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Valid routing number is required'
      };
    }

    if (!accountHolderName || typeof accountHolderName !== 'string') {
      return {
        code: HierarchicalReferralErrorCode.INVALID_INPUT,
        message: 'Account holder name is required'
      };
    }
  }

  // Validate PayPal email if provided
  if (payoutInfo.paypalEmail && !isValidEmail(payoutInfo.paypalEmail)) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Valid PayPal email is required'
    };
  }

  return null;
}

/**
 * Validate Stripe Connect account ID format
 */
export function validateStripeAccountId(accountId: string): HierarchicalReferralError | null {
  if (!accountId || typeof accountId !== 'string') {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Stripe account ID is required'
    };
  }

  // Basic Stripe account ID format validation (starts with 'acct_')
  if (!accountId.startsWith('acct_')) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Invalid Stripe account ID format'
    };
  }

  if (accountId.length < 20) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Stripe account ID is too short'
    };
  }

  return null;
}

/**
 * Validate activity metadata
 */
export function validateActivityMetadata(metadata: any): HierarchicalReferralError | null {
  if (metadata.amount && (typeof metadata.amount !== 'number' || metadata.amount < 0)) {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Activity amount must be a non-negative number'
    };
  }

  if (metadata.currency && typeof metadata.currency !== 'string') {
    return {
      code: HierarchicalReferralErrorCode.INVALID_INPUT,
      message: 'Currency must be a string'
    };
  }

  return null;
}