// lib/firebase-admin.js
const { getApps, initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getStorage } = require("firebase-admin/storage");

// Load service account key
let serviceAccount = {};

try {
  let credentialLoaded = false;

  // 1. Check for local service account file in development (PRIORITY)
  try {
    const fs = require('fs');
    const path = require('path');
    const keyPath = path.join(process.cwd(), 'stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json');
    console.log('[DEBUG] Checking for local service account at:', keyPath);
    
    if (fs.existsSync(keyPath)) {
      console.log('[DEBUG] Found local service account key file. Using it OVER environment variables.');
      const fileContent = fs.readFileSync(keyPath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
      console.log('[DEBUG] Successfully parsed local service account key. Project ID:', serviceAccount.project_id);
      credentialLoaded = true;
    } else {
      console.log('[DEBUG] No local service account key file found.');
    }
  } catch (fsError) {
    console.warn('[DEBUG] Failed to check for local service account file:', fsError);
  }

  // 2. Fallback to Environment Variables if no file loaded
  if (!credentialLoaded) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
      console.log('[DEBUG] Using Firebase service account from BASE64 env var');
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8')
      serviceAccount = JSON.parse(decoded)
      console.log('[DEBUG] Successfully parsed Firebase service account from BASE64');
      credentialLoaded = true;
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('[DEBUG] Using Firebase service account from JSON env var');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      console.log('[DEBUG] Successfully parsed Firebase service account from JSON');
      credentialLoaded = true;
    } else {
      console.warn('[DEBUG] No Firebase service account key found in environment variables either - using default initialization')
    }
  }

  if (!credentialLoaded) {
    console.error('[DEBUG] No Firebase credentials found - this will cause authentication issues');
  }
} catch (error) {
  console.error('[DEBUG] Error parsing Firebase service account:', error);
  console.error('Service account data:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 ? 'BASE64 present' : 'BASE64 absent', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'JSON present' : 'JSON absent');
}

let adminApp;

try {
  if (Object.keys(serviceAccount).length > 0) {
    console.log('Initializing Firebase Admin App with service account credentials');
    adminApp = getApps().length === 0 ? initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || 'stitches-africa',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'stitches-africa.firebasestorage.app'
    }) : getApps()[0]
    console.log('Successfully initialized Firebase Admin App with service account');
  } else {
    // Initialize without credentials (will use default credentials in some environments)
    console.log('Initializing Firebase Admin App without credentials (using default)');
    adminApp = getApps().length === 0 ? initializeApp({
      projectId: 'stitches-africa',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'stitches-africa.firebasestorage.app'
    }) : getApps()[0]
    console.log('Successfully initialized Firebase Admin App without credentials');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin App:', error)
  console.error('Service account keys:', Object.keys(serviceAccount));
  // Fallback to basic initialization
  try {
    console.log('Attempting fallback initialization of Firebase Admin App');
    adminApp = getApps().length === 0 ? initializeApp({
      projectId: 'stitches-africa',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'stitches-africa.firebasestorage.app'
    }) : getApps()[0]
    console.log('Successfully initialized Firebase Admin App with fallback');
  } catch (fallbackError) {
    console.error('Error initializing Firebase Admin App with fallback:', fallbackError)
    throw fallbackError
  }
}

const adminDb = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);
const adminStorage = getStorage(adminApp);

// Configure Firestore settings (only on first initialization)
try {
  if (getApps().length === 1) {
    // Only set settings if this is the first app initialization
    adminDb.settings({
      ignoreUndefinedProperties: true,
    });
    console.log('✅ Firestore settings configured');
  }
} catch (error) {
  // Settings already configured, ignore error
  console.log('ℹ️ Firestore settings already configured');
}

// Log successful initialization
console.log('✅ Firebase Admin SDK initialized successfully');
console.log('📊 Admin DB instance:', adminDb ? 'Available' : 'Not available');
console.log('🔐 Admin Auth instance:', adminAuth ? 'Available' : 'Not available');
console.log('💾 Admin Storage instance:', adminStorage ? 'Available' : 'Not available');

module.exports = {
  adminDb,
  adminAuth,
  adminStorage
};