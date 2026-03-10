import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing VVIP authentication...');
    
    // Test the same authentication flow as VVIP endpoints
    const authResult = await authenticateRequest(request);
    
    if (authResult instanceof NextResponse) {
      console.log('Authentication failed:', authResult.status);
      return authResult;
    }
    
    const { user } = authResult;
    console.log('Authentication successful for user:', user.uid, user.email);
    
    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      message: 'VVIP authentication working correctly'
    });
    
  } catch (error) {
    console.error('VVIP auth test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}