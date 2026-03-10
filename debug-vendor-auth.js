/**
 * Debug script to check vendor authentication status
 */

console.log('🔐 Debugging Vendor Authentication...');

// Check authentication status in browser
if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser environment');
  
  // Check localStorage for vendor authentication
  const tailorUID = localStorage.getItem('tailorUID');
  const userUID = localStorage.getItem('userUID');
  
  console.log('📋 Authentication Status:');
  console.log('   tailorUID:', tailorUID ? '✅ Present' : '❌ Missing');
  console.log('   userUID:', userUID ? '✅ Present' : '❌ Missing');
  
  if (tailorUID) {
    console.log('   tailorUID value:', tailorUID);
  }
  
  if (userUID) {
    console.log('   userUID value:', userUID);
  }
  
  // Check if Firebase Auth is available
  if (typeof firebase !== 'undefined' && firebase.auth) {
    const user = firebase.auth().currentUser;
    console.log('🔥 Firebase Auth Status:');
    console.log('   Current user:', user ? '✅ Authenticated' : '❌ Not authenticated');
    
    if (user) {
      console.log('   User UID:', user.uid);
      console.log('   User email:', user.email);
      console.log('   UID matches tailorUID:', user.uid === tailorUID ? '✅ Yes' : '❌ No');
    }
  } else {
    console.log('⚠️ Firebase Auth not available in this context');
  }
  
  // Check for any auth-related errors in console
  console.log('\n🔍 Common Issues to Check:');
  console.log('   1. User is logged in as the correct vendor');
  console.log('   2. tailorUID matches the authenticated user UID');
  console.log('   3. User has proper vendor permissions in Firestore');
  console.log('   4. Browser cache is cleared');
  
} else {
  console.log('🖥️ Running in Node.js environment');
  console.log('📝 Vendor authentication debugging tips:');
  console.log('   1. Open browser developer tools');
  console.log('   2. Check Application > Local Storage for tailorUID');
  console.log('   3. Check Console for Firebase auth errors');
  console.log('   4. Verify user is logged in to the correct vendor account');
  console.log('   5. Check Network tab for failed API requests');
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.debugVendorAuth = () => {
    console.log('🔐 Manual Vendor Auth Debug:');
    
    const tailorUID = localStorage.getItem('tailorUID');
    const userUID = localStorage.getItem('userUID');
    
    console.log('localStorage tailorUID:', tailorUID);
    console.log('localStorage userUID:', userUID);
    
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const user = firebase.auth().currentUser;
      console.log('Firebase current user:', user);
      
      if (user && tailorUID) {
        console.log('UIDs match:', user.uid === tailorUID);
      }
    }
    
    return {
      tailorUID,
      userUID,
      firebaseUser: typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null
    };
  };
  
  console.log('🐛 Debug function loaded! Run debugVendorAuth() in console');
}