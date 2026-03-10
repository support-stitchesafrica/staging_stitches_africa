// Debug Firebase Admin SDK initialization
require('dotenv').config();

console.log('Debug Firebase Admin SDK initialization...');

let serviceAccount: any = {};

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
    console.log('Using Firebase service account from BASE64 env var');
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decoded);
    console.log('Successfully parsed Firebase service account from BASE64');
    console.log('Project ID:', serviceAccount.project_id);
    console.log('Client Email:', serviceAccount.client_email);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log('Using Firebase service account from JSON env var');
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log('Successfully parsed Firebase service account from JSON');
  } else {
    console.warn('No Firebase service account key found in environment variables - using default initialization');
  }
} catch (error) {
  console.error('Error parsing Firebase service account:', error);
  console.error('Service account data:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 ? 'BASE64 present' : 'BASE64 absent', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'JSON present' : 'JSON absent');
}

console.log('Service account keys:', Object.keys(serviceAccount));

// Try to initialize Firebase Admin
let adminApp: any;

try {
  const { getApps, initializeApp, cert } = require("firebase-admin/app");
  
  if (Object.keys(serviceAccount).length > 0) {
    console.log('Initializing Firebase Admin App with service account credentials');
    console.log('Cert type:', typeof cert);
    console.log('Service account type:', typeof serviceAccount);
    
    adminApp = getApps().length === 0 ? initializeApp({
      credential: cert(serviceAccount),
    }) : getApps()[0];
    console.log('Successfully initialized Firebase Admin App with service account');
  } else {
    // Initialize without credentials (will use default credentials in some environments)
    console.log('Initializing Firebase Admin App without credentials (using default)');
    adminApp = getApps().length === 0 ? initializeApp() : getApps()[0];
    console.log('Successfully initialized Firebase Admin App without credentials');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin App:', error);
  console.error('Service account keys:', Object.keys(serviceAccount));
  // Fallback to basic initialization
  try {
    const { getApps, initializeApp } = require("firebase-admin/app");
    console.log('Attempting fallback initialization of Firebase Admin App');
    adminApp = getApps().length === 0 ? initializeApp() : getApps()[0];
    console.log('Successfully initialized Firebase Admin App with fallback');
  } catch (fallbackError) {
    console.error('Error initializing Firebase Admin App with fallback:', fallbackError);
    throw fallbackError;
  }
}

console.log('Firebase Admin App initialized successfully');