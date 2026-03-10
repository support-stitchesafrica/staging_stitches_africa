import { NextRequest, NextResponse } from 'next/server';
import { ReferralService } from '@/lib/referral/referral-service';
import { ReferralErrorCode } from '@/lib/referral/types';
import { headers } from 'next/headers';
import crypto from 'crypto';

/**
 * POST /api/referral/track
 * Track referral link clicks and downloads
 * Requirements: Mobile App Feature
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, eventType, sessionId, deviceType } = body;

    if (!code || !eventType || !sessionId || !deviceType) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'Missing required fields',
          },
        },
        { status: 400 }
      );
    }

    // Get anonymized IP for basic unique counting
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const ipHash = crypto.createHash('md5').update(ip).digest('hex');
    const userAgent = (await headers()).get('user-agent') || 'unknown';

    const success = await ReferralService.trackReferralEvent(
      code,
      eventType,
      {
        sessionId,
        deviceType,
        userAgent,
        ipHash,
        ipAddress: ip, // Pass raw IP for probabilistic attribution
      }
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'Failed to track event',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking referral event details:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error',
          details: String(error),
          stack: error.stack,
        },
      },
      { status: 500 }
    );
  }
}
