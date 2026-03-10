#!/usr/bin/env tsx

/**
 * Setup script for Blog Admin system
 * Creates the first admin user for the blog system
 */

import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validate required environment variables
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Missing required Firebase environment variables')
  console.log('Please ensure the following environment variables are set:')
  console.log('- NEXT_PUBLIC_FIREBASE_API_KEY')
  console.log('- NEXT_PUBLIC_FIREBASE_PROJECT_ID')
  console.log('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN')
  console.log('- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET')
  console.log('- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID')
  console.log('- NEXT_PUBLIC_FIREBASE_APP_ID')
  process.exit(1)
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function createBlogAdmin() {
  try {
    console.log('🚀 Setting up Blog Admin system...')

    // Admin user details
    const adminData = {
      email: 'blog-admin@stitchesafrica.com',
      password: 'BlogAdmin123!',
      firstName: 'Blog',
      lastName: 'Admin',
      username: 'blogadmin',
      role: 'admin' as const
    }

    console.log(`📧 Creating admin user: ${adminData.email}`)

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminData.email,
      adminData.password
    )
    const user = userCredential.user

    console.log(`✅ Firebase Auth user created: ${user.uid}`)

    // Create blog user document
    await setDoc(doc(db, 'blog_users', user.uid), {
      uid: user.uid,
      email: adminData.email,
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      username: adminData.username,
      role: adminData.role,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    console.log('✅ Blog user document created')

    console.log('\n🎉 Blog Admin setup complete!')
    console.log('\n📋 Admin Login Details:')
    console.log(`   Email: ${adminData.email}`)
    console.log(`   Password: ${adminData.password}`)
    console.log(`   Role: ${adminData.role}`)
    console.log('\n🔗 Login URL: http://localhost:3000/blog-admin/login')
    console.log('\n⚠️  Remember to:')
    console.log('   1. Change the default password after first login')
    console.log('   2. Update Firestore security rules if needed')
    console.log('   3. Create additional users through the admin interface')

  } catch (error: any) {
    console.error('❌ Error setting up Blog Admin:', error.message)
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n💡 The admin email is already in use.')
      console.log('   You can try logging in with the existing account.')
    } else if (error.code === 'auth/weak-password') {
      console.log('\n💡 The password is too weak.')
      console.log('   Please use a stronger password.')
    } else if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied.')
      console.log('   Please check your Firestore security rules.')
    }
    
    process.exit(1)
  }
}

// Run the setup
createBlogAdmin()
  .then(() => {
    console.log('\n✨ Setup completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })