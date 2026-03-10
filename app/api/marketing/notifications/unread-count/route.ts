/**
 * Marketing Notifications Unread Count API Route
 * GET: Get unread notification count for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

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

    const notificationsRef = adminDb.collection('marketing_notifications');
    const snapshot = await notificationsRef
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    return NextResponse.json({ count: snapshot.size });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
