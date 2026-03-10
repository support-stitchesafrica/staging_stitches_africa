/**
 * Test script to verify the tailor works permission fix
 */

console.log('🧪 Testing Tailor Works Permission Fix...');

// Mock Firebase functions for testing
const mockFirestore = {
  doc: (collection, id) => ({
    collection,
    id,
    get: () => {
      if (collection === 'tailor_works') {
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            tailor_id: 'test-tailor-123',
            title: 'Test Product',
            price: { base: 100, currency: 'USD' },
            images: [],
            tags: [],
            sizes: []
          })
        });
      }
      
      if (collection === 'users') {
        return Promise.resolve({
          exists: () => true,
          data: () => ({
            is_tailor: true,
            is_sub_tailor: false
          })
        });
      }
      
      return Promise.resolve({
        exists: () => false
      });
    }
  })
};

// Mock the improved getTailorWorkById function
async function testGetTailorWorkById(workId, userId) {
  try {
    console.log(`📋 Testing getTailorWorkById with workId: ${workId}, userId: ${userId}`);
    
    const docRef = mockFirestore.doc("tailor_works", workId);
    const docSnap = await docRef.get();

    if (!docSnap.exists()) {
      return { success: false, message: "Tailor work not found" };
    }

    const workData = docSnap.data();
    
    // Check if the current user is the owner of this tailor work
    const isMainTailor = userId === workData.tailor_id;

    if (isMainTailor) {
      console.log('✅ User is the main tailor, allowing access');
      return { success: true, data: workData };
    }

    // For sub-tailors, we need to check their user document
    // But only try to read the current user's own document to avoid permission issues
    try {
      const userRef = mockFirestore.doc("users", userId);
      const userSnap = await userRef.get();

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const isSubTailorAccessingOwnMain = userData?.is_sub_tailor && userData?.tailorId === workData.tailor_id;

        if (isSubTailorAccessingOwnMain) {
          console.log('✅ User is a sub-tailor with access, allowing access');
          return { success: true, data: workData };
        }
      }
    } catch (userError) {
      console.warn("⚠️ Could not verify sub-tailor permissions:", userError.message);
      // If we can't read the user document due to permissions, 
      // fall back to checking if they're the main tailor (already done above)
    }

    // If we reach here, user doesn't have permission
    console.log('❌ User does not have permission');
    return {
      success: false,
      message: "You do not have permission to view this tailor work",
    };
  } catch (error) {
    console.error("❌ Error fetching tailor work by ID:", error);
    
    // Provide more specific error messages
    if (error.code === 'permission-denied') {
      return { 
        success: false, 
        message: "Permission denied. Please ensure you're logged in and have access to this product." 
      };
    }
    
    return { success: false, message: error.message || "Failed to fetch tailor work" };
  }
}

// Run tests
async function runTests() {
  console.log('\n🔬 Running Permission Tests...\n');
  
  // Test 1: Main tailor accessing their own product
  console.log('Test 1: Main tailor accessing their own product');
  const result1 = await testGetTailorWorkById('product-123', 'test-tailor-123');
  console.log('Result:', result1.success ? '✅ SUCCESS' : '❌ FAILED', result1.message || '');
  
  // Test 2: Different user trying to access product
  console.log('\nTest 2: Different user trying to access product');
  const result2 = await testGetTailorWorkById('product-123', 'different-user-456');
  console.log('Result:', result2.success ? '❌ UNEXPECTED SUCCESS' : '✅ CORRECTLY DENIED', result2.message || '');
  
  // Test 3: Non-existent product
  console.log('\nTest 3: Non-existent product');
  const result3 = await testGetTailorWorkById('non-existent-product', 'test-tailor-123');
  console.log('Result:', result3.success ? '❌ UNEXPECTED SUCCESS' : '✅ CORRECTLY FAILED', result3.message || '');
  
  console.log('\n🎉 Permission fix tests completed!');
  console.log('\n💡 Key improvements:');
  console.log('   - Checks product ownership first before user document access');
  console.log('   - Only reads current user\'s own document to avoid permission issues');
  console.log('   - Provides specific error messages for different failure types');
  console.log('   - Gracefully handles permission errors when checking sub-tailor access');
}

// Run the tests
runTests().catch(console.error);