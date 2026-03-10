import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json();

    if (!email || !type) {
      return NextResponse.json(
        { error: 'Email and type are required' },
        { status: 400 }
      );
    }

    // Get all users from the specified collection
    const collection = type === 'atlas' ? 'atlasUsers' : 'collectionsUsers';
    const usersSnapshot = await adminDb.collection(collection).get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      fullName: doc.data().fullName,
      role: doc.data().role,
      isAtlasUser: doc.data().isAtlasUser,
      isCollectionsUser: doc.data().isCollectionsUser,
    }));

    // Check if the specific email exists
    const userExists = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    return NextResponse.json({
      success: true,
      userExists: !!userExists,
      user: userExists || null,
      totalUsers: users.length,
      allUsers: users, // For debugging - remove in production
    });
  } catch (error: any) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check user' },
      { status: 500 }
    );
  }
}
