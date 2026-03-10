/**
 * Script to set up password for existing Firebase Auth user
 */

const { adminAuth } = require('../lib/firebase-admin.js');

async function setupUserPassword() {
  const userEmail = 'uchinedu@stitchesafrica.com';
  const newPassword = 'StitchesVVIP2024!';
  
  console.log('🔧 Setting up password for user:', userEmail);
  
  try {
    // Check if user exists
    const user = await adminAuth.getUserByEmail(userEmail);
    console.log('✅ User found:', user.uid);
    
    // Update user with password
    await adminAuth.updateUser(user.uid, {
      password: newPassword,
      emailVerified: true
    });
    
    console.log('✅ Password set successfully!');
    console.log('📧 Email:', userEmail);
    console.log('🔑 Password:', newPassword);
    console.log('');
    console.log('🌐 You can now login at: http://localhost:3000/marketing/login');
    console.log('');
    console.log('⚠️  Remember to change this password after first login!');
    
  } catch (error) {
    console.error('❌ Error setting up password:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('');
      console.log('🔧 Creating new user...');
      
      try {
        const newUser = await adminAuth.createUser({
          email: userEmail,
          password: newPassword,
          emailVerified: true,
          displayName: 'Uchinedu Stitches'
        });
        
        console.log('✅ User created successfully!');
        console.log('📧 Email:', userEmail);
        console.log('🔑 Password:', newPassword);
        console.log('👤 UID:', newUser.uid);
        
      } catch (createError) {
        console.error('❌ Error creating user:', createError);
      }
    }
  }
}

setupUserPassword().catch(console.error);