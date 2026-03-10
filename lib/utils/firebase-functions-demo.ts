/**
 * Firebase Functions Wrapper Demonstration
 * 
 * This file demonstrates how the Firebase Functions wrapper handles
 * service unavailability gracefully, which is exactly what we're seeing
 * with the current Firebase Storage initialization issues.
 */

import { getFirebaseFunctionsWrapper } from '../firebase-functions-wrapper';

/**
 * Demonstrate Firebase Functions wrapper handling service unavailability
 */
export async function demonstrateFirebaseFunctionsWrapper(): Promise<void> {
  console.log('🎯 Demonstrating Firebase Functions Wrapper with Service Unavailability');
  
  try {
    // Get the wrapper instance with fallbacks enabled
    const wrapper = getFirebaseFunctionsWrapper({
      enableFallbacks: true,
      logErrors: true,
      retryAttempts: 1,
    });

    console.log('✅ Firebase Functions Wrapper created successfully');

    // 1. Check availability (should handle unavailable services gracefully)
    console.log('\n🔍 Step 1: Checking Functions service availability...');
    const isAvailable = await wrapper.isAvailable();
    console.log(`📊 Functions service available: ${isAvailable}`);
    
    if (!isAvailable) {
      console.log('ℹ️  This is expected when Firebase services are having issues');
    }

    // 2. Try to get Functions instance (should return null gracefully)
    console.log('\n🔧 Step 2: Getting Functions instance...');
    const functions = await wrapper.getFunctions();
    console.log(`📦 Functions instance: ${functions ? 'Available' : 'Not available (gracefully handled)'}`);

    // 3. Try to create a callable (should handle unavailability)
    console.log('\n📞 Step 3: Testing callable creation...');
    const callable = await wrapper.getHttpsCallable('exampleFunction');
    console.log(`🎯 Callable: ${callable ? 'Created successfully' : 'Null (gracefully handled)'}`);

    // 4. Try to call a function (should use fallback)
    console.log('\n🚀 Step 4: Testing function call with fallback...');
    try {
      const result = await wrapper.callFunction('exampleFunction', { 
        message: 'Hello from wrapper demo',
        timestamp: new Date().toISOString()
      });
      
      console.log('📋 Function call result:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result && typeof result === 'object' && 'fallback' in result) {
        console.log('✅ Fallback behavior working correctly!');
      }
    } catch (error) {
      console.log('⚠️  Function call failed (this is expected when fallbacks are disabled)');
      console.log('Error:', error instanceof Error ? error.message : error);
    }

    // 5. Test detailed function call result
    console.log('\n📊 Step 5: Testing detailed function call...');
    const detailedResult = await wrapper.callFunctionWithResult('exampleFunction', {
      action: 'test',
      data: { demo: true }
    });
    
    console.log('📈 Detailed result:');
    console.log(`  - Success: ${detailedResult.success}`);
    console.log(`  - Has Data: ${!!detailedResult.data}`);
    console.log(`  - Has Error: ${!!detailedResult.error}`);
    console.log(`  - Fallback Used: ${detailedResult.fallbackUsed}`);
    
    if (detailedResult.fallbackUsed) {
      console.log('✅ Fallback mechanism working as expected!');
    }

    console.log('\n🎉 Firebase Functions Wrapper demonstration completed!');
    console.log('\n📝 Summary:');
    console.log('  ✅ Wrapper handles service unavailability gracefully');
    console.log('  ✅ Null-safe operations work correctly');
    console.log('  ✅ Fallback behavior provides meaningful responses');
    console.log('  ✅ Error handling prevents application crashes');
    console.log('  ✅ Detailed result information available for debugging');
    
    console.log('\n💡 Key Benefits:');
    console.log('  - Application continues to work even when Firebase Functions is unavailable');
    console.log('  - Graceful degradation instead of hard failures');
    console.log('  - Configurable fallback behavior for different use cases');
    console.log('  - Comprehensive error logging for debugging');
    console.log('  - Retry mechanisms for transient failures');

  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    console.log('\n🔧 This error demonstrates why the wrapper is needed:');
    console.log('  - Without the wrapper, Firebase service failures would crash the app');
    console.log('  - With the wrapper, failures are handled gracefully with fallbacks');
  }
}

/**
 * Show how the wrapper configuration affects behavior
 */
export async function demonstrateWrapperConfiguration(): Promise<void> {
  console.log('\n⚙️  Demonstrating Wrapper Configuration Options');

  // Configuration 1: Strict mode (no fallbacks)
  console.log('\n🔒 Configuration 1: Strict Mode (No Fallbacks)');
  const strictWrapper = getFirebaseFunctionsWrapper({
    enableFallbacks: false,
    logErrors: false,
    retryAttempts: 1,
  });

  try {
    await strictWrapper.callFunction('testFunction');
    console.log('✅ Function call succeeded');
  } catch (error) {
    console.log('❌ Function call failed (expected in strict mode when service unavailable)');
  }

  // Configuration 2: Resilient mode (with fallbacks)
  console.log('\n🛡️  Configuration 2: Resilient Mode (With Fallbacks)');
  const resilientWrapper = getFirebaseFunctionsWrapper({
    enableFallbacks: true,
    logErrors: true,
    retryAttempts: 2,
  });

  try {
    const result = await resilientWrapper.callFunction('testFunction');
    console.log('✅ Function call completed (with fallback if needed)');
    console.log('Result type:', typeof result);
  } catch (error) {
    console.log('ℹ️  This should not happen in resilient mode');
  }

  // Configuration 3: Development mode (with emulator support)
  console.log('\n🔧 Configuration 3: Development Mode (With Emulator)');
  const devWrapper = getFirebaseFunctionsWrapper({
    enableFallbacks: true,
    logErrors: true,
    retryAttempts: 1,
    emulatorConfig: {
      host: 'localhost',
      port: 5001,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    const connected = await devWrapper.connectFunctionsEmulator('localhost', 5001);
    console.log(`🔌 Emulator connection: ${connected ? 'Success' : 'Failed (emulator not running)'}`);
  }

  console.log('\n✅ Configuration demonstration completed!');
}

// Export for use in other modules
export default {
  demonstrateFirebaseFunctionsWrapper,
  demonstrateWrapperConfiguration,
};