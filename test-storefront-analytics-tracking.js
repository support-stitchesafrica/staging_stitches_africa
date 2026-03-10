/**
 * Test script to generate sample storefront analytics data
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

// Firebase config (using environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function generateSampleAnalyticsData() {
  try {
    console.log('🧪 Generating sample storefront analytics data...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Sample vendor IDs (replace with actual vendor IDs from your system)
    const sampleVendors = [
      'vendor-123',
      'vendor-456', 
      'vendor-789'
    ];
    
    const sampleProducts = [
      'product-001',
      'product-002',
      'product-003',
      'product-004',
      'product-005'
    ];
    
    const activityTypes = ['view', 'add_to_cart', 'purchase'];
    
    // Generate activities for the last 7 days
    const activities = [];
    const now = new Date();
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      
      // Generate 10-50 activities per day
      const activitiesPerDay = Math.floor(Math.random() * 40) + 10;
      
      for (let i = 0; i < activitiesPerDay; i++) {
        const activityTime = new Date(date);
        activityTime.setHours(Math.floor(Math.random() * 24));
        activityTime.setMinutes(Math.floor(Math.random() * 60));
        
        const vendorId = sampleVendors[Math.floor(Math.random() * sampleVendors.length)];
        const productId = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
        const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        const userId = `user_${Math.floor(Math.random() * 100)}`;
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const activity = {
          type: activityType,
          userId,
          sessionId,
          vendorId,
          productId,
          timestamp: Timestamp.fromDate(activityTime),
          metadata: {
            source: 'storefront',
            productName: `Product ${productId}`,
            price: Math.floor(Math.random() * 200) + 20,
            currency: 'USD',
            deviceType: Math.random() > 0.7 ? 'mobile' : 'desktop',
            userAgent: 'Mozilla/5.0 (Test Browser)',
            pathname: `/store/${vendorId}/products/${productId}`
          }
        };
        
        activities.push(activity);
      }
    }
    
    console.log(`📊 Generated ${activities.length} sample activities`);
    
    // Add activities to Firestore
    const shopActivitiesRef = collection(db, 'shop_activities');
    
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      
      try {
        await addDoc(shopActivitiesRef, activity);
        
        if ((i + 1) % 10 === 0) {
          console.log(`✅ Added ${i + 1}/${activities.length} activities`);
        }
      } catch (error) {
        console.error(`❌ Failed to add activity ${i + 1}:`, error);
      }
    }
    
    console.log('🎉 Sample analytics data generation completed!');
    
    // Summary
    const summary = {
      totalActivities: activities.length,
      vendors: sampleVendors.length,
      products: sampleProducts.length,
      dateRange: `${new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toDateString()} - ${now.toDateString()}`,
      activityBreakdown: {
        views: activities.filter(a => a.type === 'view').length,
        addToCarts: activities.filter(a => a.type === 'add_to_cart').length,
        purchases: activities.filter(a => a.type === 'purchase').length
      }
    };
    
    console.log('\n📈 Analytics Summary:', JSON.stringify(summary, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
generateSampleAnalyticsData();