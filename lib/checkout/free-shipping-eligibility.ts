import { CartItem, ProductCollection } from '@/types';
import { Address } from '@/lib/address-service';

export interface FreeShippingEligibility {
  isEligible: boolean;
  reason?: 'referral_rm' | 'referral_general' | 'collection' | string;
}

// RM (Relationship Manager) referral codes — free delivery eligible
export const RM_REFERRAL_CODES = new Set([
  '8BLO2OFH', // Blessing
  'YMQKZLGG', // Joan
  'GVH9D7IA', // Lisa
  'QAQ13V5X', // Joy
  '1ZDQ3RW8', // Priscilla
  '5BH1YIP7', // Regina
  '0AQO6EGC', // Mstrishor
]);

export const GENERAL_FREE_SHIPPING_THRESHOLD = 50000;
export const FREE_SHIPPING_RM_THRESHOLD = 100000;

/**
 * Helper to detect Nigerian addresses
 */
export const isNigerianAddress = (address: Address): boolean => {
  const countryCode = address.country_code?.toUpperCase().trim();
  if (countryCode === 'NG' || countryCode === 'NGA') return true;

  const altCountryCode = address.countryCode?.toUpperCase().trim();
  if (altCountryCode === 'NG' || altCountryCode === 'NGA') return true;

  const countryName = address.country?.toLowerCase().trim();
  if (countryName === 'nigeria') return true;

  return false;
};

/**
 * Determines if cart qualifies for free shipping.
 */
export const checkFreeShippingEligibility = (
  cartItems: CartItem[],
  collections: Map<string, ProductCollection>,
  shippingAddress: Address | null,
  cartTotalNGN: number,
  referralCode?: string,
): FreeShippingEligibility => {
  if (!shippingAddress)
    return { isEligible: false, reason: 'No shipping address' };

  const isRMCode = referralCode
    ? RM_REFERRAL_CODES.has(referralCode.trim().toUpperCase())
    : false;

  if (isRMCode) {
    const state = (shippingAddress.state || '').toLowerCase();
    const city = (shippingAddress.city || '').toLowerCase();
    const isLagos =
      state.includes('lagos') ||
      city.includes('lagos') ||
      state === 'la' ||
      state === 'lag';

    if (cartTotalNGN <= FREE_SHIPPING_RM_THRESHOLD)
      return {
        isEligible: false,
        reason: 'RM free delivery requires order above ₦100,000',
      };

    if (!isLagos)
      return {
        isEligible: false,
        reason: 'RM free delivery applies to Lagos addresses only',
      };

    return { isEligible: true, reason: 'referral_rm' };
  }

  // General referral code check — any valid non-RM code
  if (referralCode && !isRMCode) {
    if (!isNigerianAddress(shippingAddress))
      return {
        isEligible: false,
        reason: 'Referral free shipping applies to Nigerian addresses only',
      };

    if (cartTotalNGN < GENERAL_FREE_SHIPPING_THRESHOLD)
      return {
        isEligible: false,
        reason: 'Referral free shipping requires a minimum order of ₦50,000',
      };

    return { isEligible: true, reason: 'referral_general' };
  }

  const MINIMUM_ORDER_AMOUNT_NGN = 90000;
  if (cartTotalNGN < MINIMUM_ORDER_AMOUNT_NGN)
    return { isEligible: false, reason: 'Cart total below minimum NGN 90,000' };

  const hasProductLevelFreeShipping = cartItems.some(
    (item) => item.isFreeShipping === true,
  );
  if (hasProductLevelFreeShipping) {
    return { isEligible: true, reason: 'collection' };
  }

  const collectionItems = cartItems.filter((item) => !!item.collectionId);
  if (collectionItems.length === 0)
    return {
      isEligible: false,
      reason: 'No items have isFreeShipping or a collectionId',
    };

  const uniqueCollectionIds = new Set(
    collectionItems.map((item) => item.collectionId!),
  );
  let hasFreeShippingCollection = false;

  for (const collectionId of uniqueCollectionIds) {
    const col = collections.get(collectionId);
    if (col && col.isFreeShipping === true) hasFreeShippingCollection = true;
  }

  if (!hasFreeShippingCollection)
    return {
      isEligible: false,
      reason: 'No collection has isFreeShipping=true',
    };

  return { isEligible: true, reason: 'collection' };
};
