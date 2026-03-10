// Check environment variables
require('dotenv').config();

console.log('Environment variables check:');
console.log('FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64);
console.log('FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 length:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64?.length || 0);
console.log('FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
  try {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    console.log('Decoded service account keys:', Object.keys(parsed));
  } catch (error: any) {
    console.error('Error decoding service account key:', error.message);
  }
}