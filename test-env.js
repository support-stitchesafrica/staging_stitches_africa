// Test environment variables
require('dotenv').config({ path: '.env.local' });

console.log('Testing environment variables...');
console.log('FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 present:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64);
console.log('FIREBASE_SERVICE_ACCOUNT_KEY present:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
  try {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(decoded);
    console.log('✅ BASE64 service account decoded successfully');
    console.log('Project ID:', serviceAccount.project_id);
    console.log('Client email:', serviceAccount.client_email);
  } catch (error) {
    console.error('❌ Failed to decode BASE64 service account:', error.message);
  }
}