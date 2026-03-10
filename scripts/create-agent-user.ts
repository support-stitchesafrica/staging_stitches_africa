import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = require('../stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json');
  
  initializeApp({
    credential: cert(serviceAccount),
    projectId: 'stitches-africa',
  });
}

const db = getFirestore();
const auth = getAuth();

async function createAgentUser() {
  try {
    const email = 'agent@stitchesafrica.com';
    const password = 'Agent@2024'; // Change this to a secure password
    
    console.log('🔍 Checking if user exists...');
    
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log('✅ User already exists:', user.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('📝 Creating new user...');
        user = await auth.createUser({
          email,
          password,
          displayName: 'Agent User',
          emailVerified: true,
        });
        console.log('✅ User created:', user.uid);
      } else {
        throw error;
      }
    }
    
    // Create or update agent document
    console.log('📝 Creating/updating agent document...');
    await db.collection('agents').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      name: 'Agent User',
      role: 'agent',
      permissions: [
        'view_products',
        'create_products',
        'edit_products',
        'delete_products',
        'view_tailors',
        'manage_tailors',
        'view_analytics',
        'handle_chat'
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
    
    console.log('✅ Agent document created/updated');
    
    // Also create a user document for fallback
    console.log('📝 Creating/updating user document...');
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      name: 'Agent User',
      role: 'agent',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
    
    console.log('✅ User document created/updated');
    
    console.log('\n🎉 Agent user setup complete!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🆔 UID:', user.uid);
    console.log('\n⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating agent user:', error);
    throw error;
  }
}

createAgentUser()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
