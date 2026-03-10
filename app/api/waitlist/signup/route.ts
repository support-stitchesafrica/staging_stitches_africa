/**
 * Waitlist Signup API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { WaitlistService } from '@/lib/waitlist/waitlist-service';
import { WaitlistNotificationService, SimpleEmailService, SimpleWhatsAppService } from '@/lib/waitlist/notification-service';
import { WaitlistSignupForm } from '@/types/waitlist';

/**
 * POST /api/waitlist/signup - Sign up for waitlist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signupData: WaitlistSignupForm = body;

    // Get source from headers or default
    const source = request.headers.get('x-signup-source') || 'landing_page';

    // Sign up for waitlist
    const result = await WaitlistService.signupForWaitlist(signupData, source);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // Send notifications if signup was successful
    if (result.data) {
      try {
        // Initialize notification services
        WaitlistNotificationService.initialize(
          new SimpleEmailService(),
          new SimpleWhatsAppService()
        );

        // Get waitlist products
        const products = await WaitlistService.getWaitlistProducts(result.data.waitlist.productIds);

        // Create signup object
        const signup = {
          id: result.data.signupId,
          waitlistId: result.data.waitlist.id,
          fullName: signupData.fullName,
          email: signupData.email,
          whatsapp: signupData.whatsapp,
          source,
          createdAt: { toDate: () => new Date() } as any // Mock Timestamp
        };

        // Send confirmation notifications
        await WaitlistNotificationService.sendSignupConfirmation(
          result.data.waitlist,
          signup,
          products
        );
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError);
        // Don't fail the signup if notifications fail
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to process waitlist signup:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process signup'
      },
      { status: 500 }
    );
  }
}