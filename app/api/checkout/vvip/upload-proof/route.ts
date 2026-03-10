/**
 * VVIP Payment Proof Upload API Route
 * 
 * POST /api/checkout/vvip/upload-proof
 * 
 * Handles uploading payment proof files for VVIP manual payments.
 * Validates file type (PNG, JPG, PDF) and uploads to Firebase Storage.
 * 
 * Requirements: 4.6, 4.7, 4.8, 8.10, 8.11
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadPaymentProof, isVvipUser } from '@/lib/marketing/vvip-checkout-service';
import { VvipError, VvipErrorCode } from '@/types/vvip';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from request (assuming it's in the body or from auth)
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const orderId = formData.get('orderId') as string | undefined;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        {
          error: VvipErrorCode.VALIDATION_ERROR,
          message: 'Payment proof file is required',
          field: 'file',
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          error: VvipErrorCode.VALIDATION_ERROR,
          message: 'User ID is required',
          field: 'userId',
        },
        { status: 400 }
      );
    }

    // Verify user is VVIP (Requirement 8.10, 8.11)
    const isVvip = await isVvipUser(userId);
    if (!isVvip) {
      return NextResponse.json(
        {
          error: VvipErrorCode.NOT_VVIP,
          message: 'User is not authorized to upload payment proofs',
        },
        { status: 403 }
      );
    }

    // Validate file type (Requirements: 4.6, 4.7, 4.8)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: VvipErrorCode.INVALID_FILE_TYPE,
          message: 'Invalid file type. Only PNG, JPG, and PDF files are allowed.',
          field: 'file',
        },
        { status: 400 }
      );
    }

    // Upload payment proof
    const result = await uploadPaymentProof(file, userId, orderId);

    return NextResponse.json({
      success: true,
      url: result.url,
      message: 'Payment proof uploaded successfully',
    });

  } catch (error) {
    console.error('[API] Error uploading payment proof:', error);

    if (error instanceof VvipError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
          field: error.field,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: VvipErrorCode.UPLOAD_FAILED,
        message: 'Failed to upload payment proof',
      },
      { status: 500 }
    );
  }
}
