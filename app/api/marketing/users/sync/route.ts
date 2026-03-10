import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * POST /api/marketing/users/sync
 * Sync current Firebase Auth user to marketing system
 * This is a helper endpoint to fix mismatched users
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Extract and verify the Firebase token
    const token = authHeader.split('Bearer ')[1];
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'No email found in token' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingDoc = await adminDb.collection("staging_marketing_users").doc(userId).get();
    
    if (existingDoc.exists) {
      return NextResponse.json({
        success: true,
        message: 'User already exists in marketing system',
        user: {
          uid: userId,
          ...existingDoc.data()
        }
      });
    }

    // Get user details from request body
    const body = await request.json();
    const { name, phoneNumber, role } = body;

    // Create user profile
    const userProfile = {
      email: userEmail,
      name: name || decodedToken.name || 'User',
      phoneNumber: phoneNumber || '',
      role: role || 'super_admin', // Default to super_admin for first user
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminDb.collection("staging_marketing_users").doc(userId).set(userProfile);

    return NextResponse.json({
      success: true,
      message: 'User synced successfully',
      user: {
        uid: userId,
        ...userProfile
      }
    });

  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}
