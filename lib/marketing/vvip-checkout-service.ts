/**
 * VVIP Checkout Service
 * 
 * Handles VVIP-specific checkout operations including:
 * - Checking VVIP user status
 * - Providing bank details for manual payment
 * - Uploading payment proof to Firebase Storage
 * - Creating VVIP orders with manual payment
 * 
 * Requirements: 4.1, 4.4, 4.12, 4.13, 4.14, 4.15, 4.16, 4.17, 4.18, 4.19, 4.20
 */

import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  BankDetails,
  VvipOrderData,
  VvipOrder,
  PaymentProofUploadResult,
  VvipError,
  VvipErrorCode,
} from '@/types/vvip';

/**
 * Check if a user has VVIP status
 * 
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user is VVIP, false otherwise
 * 
 * Requirements: 4.1
 */
export async function isVvipUser(userId: string): Promise<boolean> {
  try {
    if (!userId) {
      return false;
    }

    const userDoc = await adminDb.collection("staging_users").doc(userId).get();
    
    if (!userDoc.exists) {
      return false;
    }

    const userData = userDoc.data();
    return userData?.isVvip === true;
  } catch (error) {
    console.error('[VvipCheckout] Error checking VVIP status:', error);
    throw new VvipError(
      VvipErrorCode.DATABASE_ERROR,
      'Failed to check VVIP status',
      500
    );
  }
}

/**
 * Get bank account details for manual payment
 * 
 * Returns the bank account information that VVIP users should transfer funds to.
 * In a production environment, these details should be stored in environment variables
 * or a secure configuration service.
 * 
 * @returns BankDetails - Bank account information
 * 
 * Requirements: 4.4
 */
export function getBankDetails(): BankDetails {
  // In production, these should come from environment variables or secure config
  return {
    bankName: process.env.VVIP_BANK_NAME || 'Stitches Africa Bank',
    accountNumber: process.env.VVIP_ACCOUNT_NUMBER || '1234567890',
    accountName: process.env.VVIP_ACCOUNT_NAME || 'Stitches Africa Limited',
    sortCode: process.env.VVIP_SORT_CODE,
    swiftCode: process.env.VVIP_SWIFT_CODE,
    iban: process.env.VVIP_IBAN,
  };
}

/**
 * Validate payment proof file
 * 
 * @param file - File to validate
 * @returns ValidationResult
 * 
 * Requirements: 4.6, 4.7, 4.8
 */
function validatePaymentProofFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only PNG, JPG, and PDF files are allowed.',
    };
  }

  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: 'File size exceeds 5MB limit.',
    };
  }

  return { valid: true };
}

/**
 * Upload payment proof to Firebase Storage
 * 
 * Uploads the payment proof file to Firebase Storage in the vvip_payment_proofs directory.
 * Files are organized by userId and orderId for easy retrieval.
 * 
 * @param file - The payment proof file (PNG, JPG, or PDF)
 * @param userId - The user ID uploading the proof
 * @param orderId - Optional order ID (if order already exists)
 * @returns Promise<PaymentProofUploadResult> - Upload result with URL or error
 * 
 * Requirements: 4.6, 4.7, 4.8, 4.12
 */
export async function uploadPaymentProof(
  file: File,
  userId: string,
  orderId?: string
): Promise<PaymentProofUploadResult> {
  try {
    // Validate file
    const validation = validatePaymentProofFile(file);
    if (!validation.valid) {
      throw new VvipError(
        VvipErrorCode.INVALID_FILE_TYPE,
        validation.error || 'Invalid file',
        400
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${timestamp}_${file.name}`;
    
    // Construct storage path
    const orderPath = orderId || `temp_${timestamp}`;
    const storagePath = `vvip_payment_proofs/${userId}/${orderPath}/${filename}`;

    // Get storage bucket
    const bucket = adminStorage.bucket();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Upload file
    const fileRef = bucket.file(storagePath);
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          userId,
          orderId: orderId || 'pending',
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Make file accessible (with proper security rules in place)
    await fileRef.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('[VvipCheckout] Error uploading payment proof:', error);
    
    if (error instanceof VvipError) {
      throw error;
    }

    throw new VvipError(
      VvipErrorCode.UPLOAD_FAILED,
      'Failed to upload payment proof',
      500
    );
  }
}

/**
 * Create a VVIP order with manual payment
 * 
 * Creates an order document in Firestore with all required VVIP fields.
 * The order is created with payment_status='pending_verification' and
 * order_status='pending' until an admin approves the payment.
 * 
 * @param orderData - Order data including items, payment details, and shipping address
 * @returns Promise<string> - The created order ID
 * 
 * Requirements: 4.12, 4.13, 4.14, 4.15, 4.16, 4.17, 4.18, 4.19, 4.20
 */
export async function createVvipOrder(orderData: VvipOrderData): Promise<string> {
  try {
    // Validate required fields
    if (!orderData.userId) {
      throw new VvipError(
        VvipErrorCode.VALIDATION_ERROR,
        'User ID is required',
        400,
        'userId'
      );
    }

    if (!orderData.items || orderData.items.length === 0) {
      throw new VvipError(
        VvipErrorCode.VALIDATION_ERROR,
        'Order must contain at least one item',
        400,
        'items'
      );
    }

    if (!orderData.payment_proof_url) {
      throw new VvipError(
        VvipErrorCode.VALIDATION_ERROR,
        'Payment proof URL is required',
        400,
        'payment_proof_url'
      );
    }

    if (!orderData.amount_paid || orderData.amount_paid <= 0) {
      throw new VvipError(
        VvipErrorCode.VALIDATION_ERROR,
        'Valid payment amount is required',
        400,
        'amount_paid'
      );
    }

    if (!orderData.shipping_address) {
      throw new VvipError(
        VvipErrorCode.VALIDATION_ERROR,
        'Shipping address is required',
        400,
        'shipping_address'
      );
    }

    // Verify user is VVIP
    const isVvip = await isVvipUser(orderData.userId);
    if (!isVvip) {
      throw new VvipError(
        VvipErrorCode.NOT_VVIP,
        'User is not a VVIP shopper',
        403
      );
    }

    // Get user details for order
    const userDoc = await adminDb.collection("staging_users").doc(orderData.userId).get();
    const userData = userDoc.data();

    // Create order document
    const orderRef = adminDb.collection("staging_orders").doc();
    const orderId = orderRef.id;

    const now = Timestamp.now();

    const order: Partial<VvipOrder> = {
      orderId,
      userId: orderData.userId,
      user_email: userData?.email,
      user_name: `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim(),
      
      // VVIP-specific fields (Requirements: 4.13, 4.14, 4.15, 4.16, 4.17)
      payment_method: 'manual_transfer',
      isVvip: true,
      payment_status: 'pending_verification',
      order_status: 'pending',
      payment_proof_url: orderData.payment_proof_url,
      
      // Payment details (Requirements: 4.18, 4.19, 4.20)
      amount_paid: orderData.amount_paid,
      payment_reference: orderData.payment_reference,
      payment_date: Timestamp.fromDate(orderData.payment_date),
      
      // Standard order fields
      items: orderData.items,
      total: orderData.total || orderData.amount_paid,
      currency: orderData.currency || 'NGN',
      shipping_address: orderData.shipping_address,
      
      // Timestamps
      created_at: now,
      updated_at: now,
    };

    // Save order to Firestore
    await orderRef.set(order);

    console.log('[VvipCheckout] Created VVIP order:', orderId);

    return orderId;
  } catch (error) {
    console.error('[VvipCheckout] Error creating VVIP order:', error);
    
    if (error instanceof VvipError) {
      throw error;
    }

    throw new VvipError(
      VvipErrorCode.DATABASE_ERROR,
      'Failed to create VVIP order',
      500
    );
  }
}

/**
 * Get VVIP order by ID
 * 
 * @param orderId - The order ID to retrieve
 * @returns Promise<VvipOrder | null> - The order or null if not found
 */
export async function getVvipOrder(orderId: string): Promise<VvipOrder | null> {
  try {
    const orderDoc = await adminDb.collection("staging_orders").doc(orderId).get();
    
    if (!orderDoc.exists) {
      return null;
    }

    const orderData = orderDoc.data();
    
    // Verify it's a VVIP order
    if (!orderData?.isVvip) {
      return null;
    }

    return orderData as VvipOrder;
  } catch (error) {
    console.error('[VvipCheckout] Error getting VVIP order:', error);
    throw new VvipError(
      VvipErrorCode.DATABASE_ERROR,
      'Failed to retrieve VVIP order',
      500
    );
  }
}

/**
 * Validate checkout routing based on VVIP status
 * 
 * This function determines which checkout flow a user should see.
 * VVIP users see the manual payment form, non-VVIP users see standard gateways.
 * 
 * @param userId - The user ID to check
 * @returns Promise<'manual' | 'standard'> - The checkout type
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
export async function getCheckoutType(userId: string): Promise<'manual' | 'standard'> {
  const isVvip = await isVvipUser(userId);
  return isVvip ? 'manual' : 'standard';
}

/**
 * Create a manual payment order for VVIP users
 * 
 * This is a wrapper around createVvipOrder that provides a more specific interface
 * for manual payment orders from the checkout process.
 * 
 * @param orderData - The order data for manual payment
 * @returns Promise<{orderId: string}> - The created order result
 */
export async function createManualPaymentOrder(orderData: VvipOrderData): Promise<{orderId: string}> {
  const orderId = await createVvipOrder(orderData);
  return { orderId };
}

// Export service object for convenience
export const vvipCheckoutService = {
  isVvipUser,
  getBankDetails,
  uploadPaymentProof,
  createVvipOrder,
  createManualPaymentOrder,
  getVvipOrder,
  getCheckoutType,
};
