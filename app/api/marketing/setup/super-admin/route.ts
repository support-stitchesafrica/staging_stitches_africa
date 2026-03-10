import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/marketing/setup/super-admin
 * Check if Super Admin setup is required
 */
export async function GET() {
  try {
    // Check if any super admin exists
    const superAdminsSnapshot = await adminDb
      .collection("staging_marketing_users")
      .where('role', '==', 'super_admin')
      .where('isActive', '==', true)
      .limit(1)
      .get();

    const requiresSetup = superAdminsSnapshot.empty;

    return NextResponse.json({
      success: true,
      data: {
        requiresSetup,
        message: requiresSetup 
          ? 'No Super Admin found. Setup required.' 
          : 'Super Admin already exists.'
      }
    });
  } catch (error) {
    console.error('Error checking Super Admin status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check Super Admin status' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketing/setup/super-admin
 * Create the first Super Admin account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phoneNumber, password, companyName } = body;

    // Validate required fields
    if (!fullName || !email || !phoneNumber || !password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields' 
        },
        { status: 400 }
      );
    }

    // Validate email domain
    const allowedDomains = ['stitchesafrica.com', 'stitchesafrica.pro'];
    const emailDomain = email.split('@')[1];
    if (!allowedDomains.includes(emailDomain)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Only @stitchesafrica.com or @stitchesafrica.pro emails are allowed' 
        },
        { status: 400 }
      );
    }

    // Check if Super Admin already exists
    const existingSuperAdmins = await adminDb
      .collection("staging_marketing_users")
      .where('role', '==', 'super_admin')
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (!existingSuperAdmins.empty) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Super Admin already exists. Please contact your administrator.' 
        },
        { status: 409 }
      );
    }

    // Create Firebase Auth user
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.createUser({
        email,
        password,
        displayName: fullName,
        emailVerified: true
      });
    } catch (authError: any) {
      console.error('Firebase Auth error:', authError);
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Email already exists. Please use a different email or contact support.' 
          },
          { status: 409 }
        );
      }
      throw authError;
    }

    // Create user profile in Firestore
    const userProfile = {
      email,
      name: fullName,
      phoneNumber,
      role: 'super_admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      companyName: companyName || 'STITCHES Africa'
    };

    await adminDb
      .collection("staging_marketing_users")
      .doc(firebaseUser.uid)
      .set(userProfile);

    // Create custom token for immediate login
    const customToken = await adminAuth.createCustomToken(firebaseUser.uid);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: fullName,
          role: 'super_admin'
        },
        customToken,
        message: 'Super Admin account created successfully'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating Super Admin:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create Super Admin account' 
      },
      { status: 500 }
    );
  }
}
