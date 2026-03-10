/**
 * API Route: Validate Referral Code
 * POST /api/hierarchical-referral/codes/validate
 * Requirements: 1.4, 2.4 - Validate referral code and return validation result
 */

import { NextRequest, NextResponse } from 'next/server';
import { withHierarchicalAuth } from '@/lib/hierarchical-referral/middleware/auth-middleware';
import { applyRateLimit } from '@/lib/hierarchical-referral/middleware/rate-limit-middleware';
import { HierarchicalReferralService } from '@/lib/hierarchical-referral/services/referral-service';

interface ValidateCodeRequest {
  code: string;
}

export const POST = withHierarchicalAuth(
  async (request: NextRequest, context) => {
    try {
      // Apply rate limiting
      const rateLimitResponse = await applyRateLimit(
        request,
        context.user.uid,
        'VALIDATE_CODE'
      );
      
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Parse request body
      const body: ValidateCodeRequest = await request.json();

      if (!body.code) {
        return NextResponse.json(
          {
            success: false,
            error: 'INVALID_INPUT',
            message: 'Code is required'
          },
          { status: 400 }
        );
      }

      // Validate code
      const validation = await HierarchicalReferralService.validateCode(body.code);

      return NextResponse.json({
        success: true,
        data: {
          isValid: validation.isValid,
          code: validation.code ? {
            id: validation.code.id,
            code: validation.code.code,
            type: validation.code.type,
            status: validation.code.status,
            usageCount: validation.code.usageCount,
            maxUsage: validation.code.maxUsage,
            createdAt: validation.code.createdAt,
            expiresAt: validation.code.expiresAt,
            metadata: validation.code.metadata
          } : null,
          error: validation.error
        }
      });

    } catch (error: any) {
      console.error('Validate code error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_FAILED',
          message: 'Failed to validate code'
        },
        { status: 500 }
      );
    }
  }
);