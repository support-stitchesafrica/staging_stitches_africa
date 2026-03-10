#!/usr/bin/env tsx

/**
 * Script to add an existing Firebase user to the blog admin system
 * This is useful when you have an existing user who needs blog admin access
 */

import { initializeApp } from 'firebase/app'
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

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function addBlogAdminUser() {
  try {
    console.log('🚀 Adding user to Blog Admin system...')

    // Get user details from command line arguments
    const email = process.argv[2]
    const uid = process.argv[3]
    const firstName = process.argv[4] || 'Admin'
    const lastName = process.argv[5] || 'User'
    const username = process.argv[6] || email?.split('@')[0] || 'admin'
    const role = process.argv[7] || 'admin'

    if (!email || !uid) {
      console.error('❌ Missing required arguments')
      console.log('Usage: npx tsx scripts/add-blog-admin-user.ts <email> <uid> [firstName] [lastName] [username] [role]')
      console.log('Example: npx tsx scripts/add-blog-admin-user.ts priscilla@example.com abc123 Priscilla Ogbu priscilla admin')
      process.exit(1)
    }

    console.log(`📧 Adding user: ${email} (${uid})`)

    // Create blog user document
    await setDoc(doc(db, 'blog_users', uid), {
      uid: uid,
      email: email,
      firstName: firstName,
      lastName: lastName,
      username: username,
      role: role,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    console.log('✅ Blog user document created')

    console.log('\n🎉 User added to Blog Admin system!')
    console.log('\n📋 User Details:')
    console.log(`   Email: ${email}`)
    console.log(`   UID: ${uid}`)
    console.log(`   Name: ${firstName} ${lastName}`)
    console.log(`   Username: ${username}`)
    console.log(`   Role: ${role}`)
    console.log('\n🔗 They can now access: http://localhost:3000/blog-admin')

  } catch (error: any) {
    console.error('❌ Error adding user to Blog Admin:', error.message)
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Permission denied.')
      console.log('   Please check your Firestore security rules.')
    }
    
    process.exit(1)
  }
}

// Run the script
addBlogAdminUser()
  .then(() => {
    console.log('\n✨ User added successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed to add user:', error)
    process.exit(1)
  })