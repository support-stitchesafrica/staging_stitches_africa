/**
 * Marketing Notifications Mark All as Read API Route
 * POST: Mark all notifications as read for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const notificationsRef = adminDb.collection('marketing_notifications');
    const snapshot = await notificationsRef
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    const batch = adminDb.batch();
    const now = FieldValue.serverTimestamp();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: now,
      });
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      updated: snapshot.size 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
