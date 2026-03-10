/**
 * Test Notification Endpoint
 * Tests the waitlist notification system end-to-end
 * Requirements: 10.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { WaitlistNotificationManager } from '@/lib/vendor/waitlist-notification-manager';

/**
 * POST /api/vendor/waitlists/test-notification - Test notification delivery
 */
export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Test data
    const testSubscription = {
      id: 'test-123',
      collectionId: 'test-collection',
      fullName: 'Test User',
      email: email,
      phoneNumber: '+1234567890',
      userId: 'test-user-id',
      subscribedAt: new Date(),
      source: 'direct' as const,
      metadata: {}
    };

    const testCollection = {
      id: 'test-collection',
      vendorId: 'test-vendor',
      name: 'Test Collection',
      description: 'This is a test collection for notification testing',
      imageUrl: 'https://via.placeholder.com/400',
      pairedProducts: [],
      minSubscribers: 100,
      currentSubscribers: 1,
      status: 'published' as const,
      slug: 'test-collection',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const testVendor = {
      email: email,
      brandName: 'Test Vendor',
      displayName: 'Test Vendor'
    };

    // Send test notification
    if (type === 'subscriber') {
      await WaitlistNotificationManager.sendSubscriberConfirmation(
        testSubscription,
        testCollection
      );
    } else if (type === 'vendor') {
      await WaitlistNotificationManager.sendVendorNotification(
        testSubscription,
        testCollection,
        testVendor
      );
    } else {
      // Send both
      await WaitlistNotificationManager.sendSubscriberConfirmation(
        testSubscription,
        testCollection
      );
      await WaitlistNotificationManager.sendVendorNotification(
        testSubscription,
        testCollection,
        testVendor
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${email}`,
      type: type || 'both'
    });
  } catch (error: any) {
    console.error('Failed to send test notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send test notification'
      },
      { status: 500 }
    );
  }
}
