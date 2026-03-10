import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase Admin SDK in Next.js API route');
    
    // Test if adminAuth is initialized
    if (!adminAuth) {
      console.error('Firebase Admin Auth is not initialized');
      return NextResponse.json({ error: 'Firebase Admin Auth is not initialized' }, { status: 500 });
    }
    
    // Test if adminDb is initialized
    if (!adminDb) {
      console.error('Firebase Admin Firestore is not initialized');
      return NextResponse.json({ error: 'Firebase Admin Firestore is not initialized' }, { status: 500 });
    }
    
    console.log('Firebase Admin SDK is initialized');
    
    // Test basic operations
    try {
      // Test Firestore connection
      const snapshot = await adminDb.collection("staging_marketing_users").limit(1).get();
      console.log('Firestore connection successful, found documents:', snapshot.size);
      
      // Test Auth connection
      const listResult = await adminAuth.listUsers(1);
      console.log('Auth connection successful, found users:', listResult.users.length);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Firebase Admin SDK is working correctly',
        firestoreDocuments: snapshot.size,
        authUsers: listResult.users.length
      });
    } catch (operationError: any) {
      console.error('Firebase operation failed:', operationError);
      return NextResponse.json({ 
        error: 'Firebase operation failed', 
        details: operationError.message 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK test failed:', error);
    return NextResponse.json({ 
      error: 'Firebase Admin SDK test failed', 
      details: error.message 
    }, { status: 500 });
  }
}