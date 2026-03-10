/**
 * Vendor Waitlist Validation Service
 * Comprehensive validation for collection waitlists and subscriptions
 */

import { 
  CollectionWaitlist, 
  WaitlistSubscription, 
  CreateCollectionForm, 
  SubscriptionForm,
  CollectionValidationResult,
  SubscriptionValidationResult,
  ValidationError,
  ValidationWarning,
  WaitlistErrorCode
} from '../../types/vendor-waitlist';
import { VALIDATION_CONSTRAINTS, STATUS_TRANSITIONS, SUBSCRIPTION_STATUS_TRANSITIONS } from './waitlist-database-schema';

// ============================================================================
// Collection Validation
// ============================================================================

/**
 * Validates collection creation form data
 */
export function validateCollectionForm(data: CreateCollectionForm): CollectionValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Collection name is required',
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  } else if (data.name.length < VALIDATION_CONSTRAINTS.COLLECTION.NAME_MIN_LENGTH) {
    errors.push({
      field: 'name',
      message: `Collection name must be at least ${VALIDATION_CONSTRAINTS.COLLECTION.NAME_MIN_LENGTH} characters`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  } else if (data.name.length > VALIDATION_CONSTRAINTS.COLLECTION.NAME_MAX_LENGTH) {
    errors.push({
      field: 'name',
      message: `Collection name must not exceed ${VALIDATION_CONSTRAINTS.COLLECTION.NAME_MAX_LENGTH} characters`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  }

  // Validate description
  if (!data.description || data.description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: 'Collection description is required',
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  } else if (data.description.length < VALIDATION_CONSTRAINTS.COLLECTION.DESCRIPTION_MIN_LENGTH) {
    errors.push({
      field: 'description',
      message: `Description must be at least ${VALIDATION_CONSTRAINTS.COLLECTION.DESCRIPTION_MIN_LENGTH} characters`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  } else if (data.description.length > VALIDATION_CONSTRAINTS.COLLECTION.DESCRIPTION_MAX_LENGTH) {
    errors.push({
      field: 'description',
      message: `Description must not exceed ${VALIDATION_CONSTRAINTS.COLLECTION.DESCRIPTION_MAX_LENGTH} characters`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  }

  // Validate image
  if (!data.imageFile && !data.imageUrl) {
    errors.push({
      field: 'image',
      message: 'Collection image is required',
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  }

  if (data.imageFile) {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(data.imageFile.type)) {
      errors.push({
        field: 'imageFile',
        message: 'Image must be JPEG, PNG, or WebP format',
        code: WaitlistErrorCode.VALIDATION_ERROR
      });
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (data.imageFile.size > maxSizeBytes) {
      errors.push({
        field: 'imageFile',
        message: 'Image size must not exceed 5MB',
        code: WaitlistErrorCode.VALIDATION_ERROR
      });
    }
  }

  // Validate minimum subscribers
  if (data.minSubscribers < VALIDATION_CONSTRAINTS.COLLECTION.MIN_SUBSCRIBERS_MIN) {
    errors.push({
      field: 'minSubscribers',
      message: `Minimum subscribers must be at least ${VALIDATION_CONSTRAINTS.COLLECTION.MIN_SUBSCRIBERS_MIN}`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  } else if (data.minSubscribers > VALIDATION_CONSTRAINTS.COLLECTION.MIN_SUBSCRIBERS_MAX) {
    errors.push({
      field: 'minSubscribers',
      message: `Minimum subscribers must not exceed ${VALIDATION_CONSTRAINTS.COLLECTION.MIN_SUBSCRIBERS_MAX}`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  }

  // Validate maximum subscribers (if provided)
  if (data.maxSubscribers !== undefined) {
    if (data.maxSubscribers < data.minSubscribers) {
      errors.push({
        field: 'maxSubscribers',
        message: 'Maximum subscribers must be greater than minimum subscribers',
        code: WaitlistErrorCode.VALIDATION_ERROR
      });
    }
  }

  // Validate paired products
  if (!data.pairedProducts || data.pairedProducts.length === 0) {
    errors.push({
      field: 'pairedProducts',
      message: 'At least one product pair is required',
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  } else if (data.pairedProducts.length > VALIDATION_CONSTRAINTS.COLLECTION.MAX_PAIRED_PRODUCTS) {
    errors.push({
      field: 'pairedProducts',
      message: `Maximum ${VALIDATION_CONSTRAINTS.COLLECTION.MAX_PAIRED_PRODUCTS} product pairs allowed`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  } else {
    // Validate each product pair
    data.pairedProducts.forEach((pair, index) => {
      if (!pair.primaryProductId) {
        errors.push({
          field: `pairedProducts[${index}].primaryProductId`,
          message: 'Primary product is required',
          code: WaitlistErrorCode.VALIDATION_ERROR
        });
      }

      if (!pair.secondaryProductId) {
        errors.push({
          field: `pairedProducts[${index}].secondaryProductId`,
          message: 'Secondary product is required',
          code: WaitlistErrorCode.VALIDATION_ERROR
        });
      }

      if (pair.primaryProductId === pair.secondaryProductId) {
        errors.push({
          field: `pairedProducts[${index}]`,
          message: 'Primary and secondary products must be different',
          code: WaitlistErrorCode.VALIDATION_ERROR
        });
      }

      if (pair.bundleDiscount !== undefined) {
        if (pair.bundleDiscount < VALIDATION_CONSTRAINTS.PRODUCT_PAIR.BUNDLE_DISCOUNT_MIN || 
            pair.bundleDiscount > VALIDATION_CONSTRAINTS.PRODUCT_PAIR.BUNDLE_DISCOUNT_MAX) {
          errors.push({
            field: `pairedProducts[${index}].bundleDiscount`,
            message: `Bundle discount must be between ${VALIDATION_CONSTRAINTS.PRODUCT_PAIR.BUNDLE_DISCOUNT_MIN}% and ${VALIDATION_CONSTRAINTS.PRODUCT_PAIR.BUNDLE_DISCOUNT_MAX}%`,
            code: WaitlistErrorCode.VALIDATION_ERROR
          });
        }
      }

      if (pair.description && pair.description.length > VALIDATION_CONSTRAINTS.PRODUCT_PAIR.DESCRIPTION_MAX_LENGTH) {
        errors.push({
          field: `pairedProducts[${index}].description`,
          message: `Description must not exceed ${VALIDATION_CONSTRAINTS.PRODUCT_PAIR.DESCRIPTION_MAX_LENGTH} characters`,
          code: WaitlistErrorCode.VALIDATION_ERROR
        });
      }
    });

    // Check for duplicate product pairs
    const pairKeys = new Set();
    data.pairedProducts.forEach((pair, index) => {
      const key = `${pair.primaryProductId}-${pair.secondaryProductId}`;
      const reverseKey = `${pair.secondaryProductId}-${pair.primaryProductId}`;
      
      if (pairKeys.has(key) || pairKeys.has(reverseKey)) {
        errors.push({
          field: `pairedProducts[${index}]`,
          message: 'Duplicate product pair detected',
          code: WaitlistErrorCode.VALIDATION_ERROR
        });
      }
      
      pairKeys.add(key);
    });
  }

  // Validate tags (if provided)
  if (data.tags) {
    if (data.tags.length > VALIDATION_CONSTRAINTS.COLLECTION.MAX_TAGS) {
      errors.push({
        field: 'tags',
        message: `Maximum ${VALIDATION_CONSTRAINTS.COLLECTION.MAX_TAGS} tags allowed`,
        code: WaitlistErrorCode.VALIDATION_ERROR
      });
    }

    data.tags.forEach((tag, index) => {
      if (tag.length > VALIDATION_CONSTRAINTS.COLLECTION.TAG_MAX_LENGTH) {
        errors.push({
          field: `tags[${index}]`,
          message: `Tag must not exceed ${VALIDATION_CONSTRAINTS.COLLECTION.TAG_MAX_LENGTH} characters`,
          code: WaitlistErrorCode.VALIDATION_ERROR
        });
      }
    });

    // Check for duplicate tags
    const uniqueTags = new Set(data.tags.map(tag => tag.toLowerCase()));
    if (uniqueTags.size !== data.tags.length) {
      warnings.push({
        field: 'tags',
        message: 'Duplicate tags will be removed',
        code: 'DUPLICATE_TAGS'
      });
    }
  }

  // Validate category (if provided)
  if (data.category && data.category.length > VALIDATION_CONSTRAINTS.COLLECTION.CATEGORY_MAX_LENGTH) {
    errors.push({
      field: 'category',
      message: `Category must not exceed ${VALIDATION_CONSTRAINTS.COLLECTION.CATEGORY_MAX_LENGTH} characters`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  }

  // Validate estimated launch date (if provided)
  if (data.estimatedLaunchDate) {
    const now = new Date();
    if (data.estimatedLaunchDate <= now) {
      warnings.push({
        field: 'estimatedLaunchDate',
        message: 'Estimated launch date should be in the future',
        code: 'PAST_LAUNCH_DATE'
      });
    }

    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2);
    if (data.estimatedLaunchDate > maxFutureDate) {
      warnings.push({
        field: 'estimatedLaunchDate',
        message: 'Estimated launch date is very far in the future',
        code: 'FAR_FUTURE_DATE'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validates collection status transition
 */
export function validateStatusTransition(
  currentStatus: CollectionWaitlist['status'], 
  newStatus: CollectionWaitlist['status']
): ValidationError | null {
  if (currentStatus === newStatus) {
    return null; // No change
  }

  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      field: 'status',
      message: `Cannot change status from '${currentStatus}' to '${newStatus}'`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    };
  }

  return null;
}

// ============================================================================
// Subscription Validation
// ============================================================================

/**
 * Validates subscription form data
 */
export function validateSubscriptionForm(data: SubscriptionForm): SubscriptionValidationResult {
  const errors: ValidationError[] = [];

  // Validate full name
  if (!data.fullName || data.fullName.trim().length === 0) {
    errors.push({
      field: 'fullName',
      message: 'Full name is required',
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  } else if (data.fullName.length < VALIDATION_CONSTRAINTS.SUBSCRIPTION.FULL_NAME_MIN_LENGTH) {
    errors.push({
      field: 'fullName',
      message: `Full name must be at least ${VALIDATION_CONSTRAINTS.SUBSCRIPTION.FULL_NAME_MIN_LENGTH} characters`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  } else if (data.fullName.length > VALIDATION_CONSTRAINTS.SUBSCRIPTION.FULL_NAME_MAX_LENGTH) {
    errors.push({
      field: 'fullName',
      message: `Full name must not exceed ${VALIDATION_CONSTRAINTS.SUBSCRIPTION.FULL_NAME_MAX_LENGTH} characters`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  }

  // Validate email
  if (!data.email || data.email.trim().length === 0) {
    errors.push({
      field: 'email',
      message: 'Email address is required',
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  } else if (!isValidEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address',
      code: WaitlistErrorCode.INVALID_EMAIL
    });
  } else if (data.email.length > VALIDATION_CONSTRAINTS.SUBSCRIPTION.EMAIL_MAX_LENGTH) {
    errors.push({
      field: 'email',
      message: `Email address must not exceed ${VALIDATION_CONSTRAINTS.SUBSCRIPTION.EMAIL_MAX_LENGTH} characters`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  }

  // Validate phone number
  if (!data.phoneNumber || data.phoneNumber.trim().length === 0) {
    errors.push({
      field: 'phoneNumber',
      message: 'Phone number is required',
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  } else if (!isValidPhoneNumber(data.phoneNumber)) {
    errors.push({
      field: 'phoneNumber',
      message: 'Please enter a valid phone number',
      code: WaitlistErrorCode.INVALID_PHONE
    });
  } else if (data.phoneNumber.length > VALIDATION_CONSTRAINTS.SUBSCRIPTION.PHONE_MAX_LENGTH) {
    errors.push({
      field: 'phoneNumber',
      message: `Phone number must not exceed ${VALIDATION_CONSTRAINTS.SUBSCRIPTION.PHONE_MAX_LENGTH} characters`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    isDuplicate: false // This will be checked separately against the database
  };
}

/**
 * Validates subscription status transition
 */
export function validateSubscriptionStatusTransition(
  currentStatus: WaitlistSubscription['status'], 
  newStatus: WaitlistSubscription['status']
): ValidationError | null {
  if (currentStatus === newStatus) {
    return null; // No change
  }

  const allowedTransitions = SUBSCRIPTION_STATUS_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      field: 'status',
      message: `Cannot change subscription status from '${currentStatus}' to '${newStatus}'`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    };
  }

  return null;
}

// ============================================================================
// Utility Validation Functions
// ============================================================================

/**
 * Validates email format using RFC 5322 compliant regex
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Validates phone number format (international format preferred)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters except + for international format
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Check for international format (+country code + number)
  const internationalRegex = /^\+[1-9]\d{1,14}$/;
  if (internationalRegex.test(cleanPhone)) {
    return true;
  }
  
  // Check for local formats (10-15 digits)
  const localRegex = /^\d{10,15}$/;
  return localRegex.test(cleanPhone);
}

/**
 * Validates and normalizes phone number to E.164 format
 */
export function normalizePhoneNumber(phone: string, defaultCountryCode: string = '+234'): string {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // If already in international format, return as is
  if (cleanPhone.startsWith('+')) {
    return cleanPhone;
  }
  
  // If starts with 0 (common in many countries), remove it and add country code
  if (cleanPhone.startsWith('0')) {
    return defaultCountryCode + cleanPhone.substring(1);
  }
  
  // If no country code, add default
  if (!cleanPhone.startsWith('+')) {
    return defaultCountryCode + cleanPhone;
  }
  
  return cleanPhone;
}

/**
 * Generates URL-friendly slug from collection name
 */
export function generateSlug(name: string, vendorId: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Add vendor prefix to ensure uniqueness across vendors
  const vendorPrefix = vendorId.substring(0, 8);
  return `${vendorPrefix}-${baseSlug}`;
}

/**
 * Validates slug format and uniqueness requirements
 */
export function validateSlug(slug: string): ValidationError | null {
  if (slug.length < VALIDATION_CONSTRAINTS.COLLECTION.SLUG_MIN_LENGTH) {
    return {
      field: 'slug',
      message: `Slug must be at least ${VALIDATION_CONSTRAINTS.COLLECTION.SLUG_MIN_LENGTH} characters`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    };
  }
  
  if (slug.length > VALIDATION_CONSTRAINTS.COLLECTION.SLUG_MAX_LENGTH) {
    return {
      field: 'slug',
      message: `Slug must not exceed ${VALIDATION_CONSTRAINTS.COLLECTION.SLUG_MAX_LENGTH} characters`,
      code: WaitlistErrorCode.VALIDATION_ERROR
    };
  }
  
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) {
    return {
      field: 'slug',
      message: 'Slug can only contain lowercase letters, numbers, and hyphens',
      code: WaitlistErrorCode.VALIDATION_ERROR
    };
  }
  
  return null;
}

/**
 * Sanitizes user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validates business rules for collection publishing
 */
export function validatePublishingRules(collection: Partial<CollectionWaitlist>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!collection.name || collection.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Collection name is required for publishing',
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  }
  
  if (!collection.description || collection.description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: 'Collection description is required for publishing',
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  }
  
  if (!collection.imageUrl) {
    errors.push({
      field: 'imageUrl',
      message: 'Collection image is required for publishing',
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  }
  
  if (!collection.pairedProducts || collection.pairedProducts.length === 0) {
    errors.push({
      field: 'pairedProducts',
      message: 'At least one product pair is required for publishing',
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  }
  
  if (!collection.minSubscribers || collection.minSubscribers < 1) {
    errors.push({
      field: 'minSubscribers',
      message: 'Minimum subscribers must be set for publishing',
      code: WaitlistErrorCode.VALIDATION_ERROR
    });
  }
  
  return errors;
}