import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;
    
    console.log('Debug: Testing ID token...');
    console.log('Token present:', !!idToken);
    console.log('Token length:', idToken ? idToken.length : 0);
    
    if (!idToken) {
      return NextResponse.json({
        success: false,
        error: 'No ID token provided',
        step: 'token_missing'
      });
    }
    
    // Test token verification
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      console.log('Token verified successfully for user:', decodedToken.uid);
      
      return NextResponse.json({
        success: true,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified
        },
        step: 'token_verified'
      });
      
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return NextResponse.json({
        success: false,
        error: tokenError instanceof Error ? tokenError.message : 'Token verification failed',
        step: 'token_verification_failed'
      });
    }
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'endpoint_error'
    }, { status: 500 });
  }
}