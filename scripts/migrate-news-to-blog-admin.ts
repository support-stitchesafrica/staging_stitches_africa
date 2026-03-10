#!/usr/bin/env tsx

/**
 * Migration script to add blog admin compatibility to existing news posts
 * This script adds authorId fields to existing news posts for better blog admin integration
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore'

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

async function migrateNewsToBlogs() {
  try {
    console.log('🚀 Starting news to blog admin migration...')

    // Get all news posts
    const newsSnapshot = await getDocs(collection(db, 'news'))
    console.log(`📰 Found ${newsSnapshot.docs.length} news posts`)

    // Get all blog users to map authors
    const blogUsersSnapshot = await getDocs(collection(db, 'blog_users'))
    const blogUsers = new Map()
    
    blogUsersSnapshot.docs.forEach(doc => {
      const userData = doc.data()
      const fullName = `${userData.firstName} ${userData.lastName}`
      blogUsers.set(fullName, userData.uid)
      blogUsers.set(userData.email, userData.uid)
    })

    console.log(`👥 Found ${blogUsers.size / 2} blog users for mapping`)

    let updatedCount = 0
    let skippedCount = 0

    for (const newsDoc of newsSnapshot.docs) {
      const newsData = newsDoc.data()
      
      // Skip if already has authorId
      if (newsData.authorId) {
        skippedCount++
        continue
      }

      // Try to find matching blog user
      let authorId = null
      
      if (newsData.author) {
        // Try to match by author name
        authorId = blogUsers.get(newsData.author)
        
        if (!authorId) {
          // Try to find partial matches
          for (const [name, uid] of blogUsers.entries()) {
            if (typeof name === 'string' && name.includes('@')) continue // Skip email entries
            if (typeof name === 'string' && newsData.author.toLowerCase().includes(name.toLowerCase())) {
              authorId = uid
              break
            }
          }
        }
      }

      // Update the post
      const updateData: any = {}
      
      if (authorId) {
        updateData.authorId = authorId
        console.log(`✅ Mapping "${newsData.author}" to user ${authorId}`)
      } else {
        // Set a default authorId for unmapped posts
        updateData.authorId = 'unknown'
        console.log(`⚠️  Could not map author "${newsData.author}", setting to 'unknown'`)
      }

      // Ensure the post has all required fields for blog admin
      if (!newsData.excerpt) {
        updateData.excerpt = newsData.content ? newsData.content.substring(0, 200) + '...' : ''
      }
      
      if (!newsData.tags) {
        updateData.tags = []
      }
      
      if (newsData.featured === undefined) {
        updateData.featured = false
      }
      
      if (newsData.published === undefined) {
        updateData.published = true // Assume existing posts are published
      }

      await updateDoc(doc(db, 'news', newsDoc.id), updateData)
      updatedCount++
    }

    console.log('\n✨ Migration completed!')
    console.log(`📊 Statistics:`)
    console.log(`   - Updated: ${updatedCount} posts`)
    console.log(`   - Skipped: ${skippedCount} posts (already had authorId)`)
    console.log(`   - Total: ${newsSnapshot.docs.length} posts`)

    console.log('\n🎉 Your existing news posts are now compatible with blog admin!')
    console.log('\n📋 Next steps:')
    console.log('   1. Deploy the updated Firestore rules')
    console.log('   2. Test the blog admin interface')
    console.log('   3. Create blog admin users for your authors')

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run the migration
migrateNewsToBlogs()
  .then(() => {
    console.log('\n✅ Migration script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  })