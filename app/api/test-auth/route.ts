import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase Admin...');
    
    // Test 1: Check if admin instances are available
    const authAvailable = !!adminAuth;
    const dbAvailable = !!adminDb;
    
    console.log('Auth available:', authAvailable);
    console.log('DB available:', dbAvailable);
    
    // Test 2: Try to get user by email
    const userEmail = 'uchinedu@stitchesafrica.com';
    let userFound = false;
    let userUid = null;
    
    try {
      const firebaseUser = await adminAuth.getUserByEmail(userEmail);
      userFound = true;
      userUid = firebaseUser.uid;
      console.log('User found:', userUid);
    } catch (error) {
      console.error('User lookup failed:', error);
    }
    
    // Test 3: Try to access Firestore
    let firestoreWorking = false;
    try {
      const testDoc = await adminDb.collection('test').doc('test').get();
      firestoreWorking = true;
      console.log('Firestore access successful');
    } catch (error) {
      console.error('Firestore access failed:', error);
    }
    
    return NextResponse.json({
      success: true,
      tests: {
        authAvailable,
        dbAvailable,
        userFound,
        userUid,
        firestoreWorking,
        userEmail
      }
    });
    
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}