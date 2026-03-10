/**
 * Marketing Notification Preferences API Route
 * GET: Fetch user notification preferences
 * POST: Update user notification preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const prefsRef = adminDb.collection('marketing_notification_preferences').doc(userId);
    const prefsDoc = await prefsRef.get();

    if (!prefsDoc.exists) {
      // Return default preferences
      return NextResponse.json({
        preferences: {
          emailNotifications: {
            invitations: true,
            vendorAssignments: true,
            vendorReassignments: true,
            systemAlerts: true,
            roleChanges: true,
            teamAssignments: true,
            taskUpdates: true,
            taskAssignments: true,
          },
          inAppNotifications: {
            invitations: true,
            vendorAssignments: true,
            vendorReassignments: true,
            systemAlerts: true,
            roleChanges: true,
            teamAssignments: true,
            taskUpdates: true,
            taskAssignments: true,
          },
        },
      });
    }

    return NextResponse.json({ preferences: prefsDoc.data() });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, preferences } = await request.json();

    if (!userId || !preferences) {
      return NextResponse.json(
        { error: 'User ID and preferences are required' },
        { status: 400 }
      );
    }

    const prefsRef = adminDb.collection('marketing_notification_preferences').doc(userId);
    
    await prefsRef.set({
      userId,
      ...preferences,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
