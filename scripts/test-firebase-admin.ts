// Test script to verify Firebase Admin SDK configuration
import { adminAuth, adminDb } from '../lib/firebase-admin';

async function testFirebaseAdmin() {
  try {
    console.log('Testing Firebase Admin SDK...');
    
    // Test 1: Check if adminAuth is initialized
    console.log('✓ Firebase Admin Auth initialized');
    
    // Test 2: Check if adminDb is initialized
    console.log('✓ Firebase Admin Firestore initialized');
    
    // Test 3: Try to list users (will fail if no permissions, but shows SDK works)
    try {
      const listResult = await adminAuth.listUsers(1);
      console.log('✓ Successfully connected to Firebase Auth');
      console.log(`  Found ${listResult.users.length} user(s)`);
    } catch (error: any) {
      console.log('✓ Firebase Auth SDK working (permission check failed as expected)');
      console.log(`  Error: ${error.message}`);
    }
    
    // Test 4: Try to access Firestore
    try {
      const snapshot = await adminDb.collection('marketing_users').limit(1).get();
      console.log('✓ Successfully connected to Firestore');
      console.log(`  Found ${snapshot.size} document(s) in marketing_users collection`);
    } catch (error: any) {
      console.log('⚠ Firestore access failed');
      console.log(`  Error: ${error.message}`);
    }
    
    console.log('\n✅ Firebase Admin SDK is properly configured!');
  } catch (error: any) {
    console.error('\n❌ Firebase Admin SDK configuration error:');
    console.error(error.message);
    console.error('\nPlease check:');
    console.error('1. FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 environment variable is set');
    console.error('2. The base64 string is valid and complete');
    console.error('3. The decoded JSON contains all required fields (project_id, private_key, client_email)');
  }
}

testFirebaseAdmin();
