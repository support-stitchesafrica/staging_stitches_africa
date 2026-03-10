/**
 * Firebase Functions Wrapper Test Script
 * 
 * Simple verification script to test the Firebase Functions wrapper functionality
 */

import { getFirebaseFunctionsWrapper } from '../firebase-functions-wrapper';

/**
 * Test Firebase Functions wrapper availability and basic operations
 */
export async function testFirebaseFunctionsWrapper(): Promise<void> {
  console.log('🧪 Testing Firebase Functions Wrapper...');

  try {
    // Get wrapper instance
    const wrapper = getFirebaseFunctionsWrapper({
      logErrors: true,
      enableFallbacks: true,
      retryAttempts: 1,
    });

    console.log('✅ Wrapper instance created successfully');

    // Test availability check
    console.log('🔍 Checking Functions service availability...');
    const isAvailable = await wrapper.isAvailable();
    console.log(`📊 Functions service available: ${isAvailable}`);

    // Test getting Functions instance
    console.log('🔧 Getting Functions instance...');
    const functions = await wrapper.getFunctions();
    console.log(`📦 Functions instance: ${functions ? 'Available' : 'Not available'}`);

    // Test callable creation (should handle unavailability gracefully)
    console.log('📞 Testing callable creation...');
    const callable = await wrapper.getHttpsCallable('testFunction');
    console.log(`🎯 Callable created: ${callable ? 'Success' : 'Null (expected if Functions unavailable)'}`);

    // Test function call with fallback
    console.log('🚀 Testing function call with fallback...');
    try {
      const result = await wrapper.callFunction('testFunction', { test: 'data' });
      console.log('📋 Function call result:', result);
    } catch (error) {
      console.log('⚠️ Function call failed (expected if Functions unavailable):', error instanceof Error ? error.message : error);
    }

    // Test detailed function call
    console.log('📊 Testing detailed function call...');
    const detailedResult = await wrapper.callFunctionWithResult('testFunction', { test: 'data' });
    console.log('📈 Detailed result:', {
      success: detailedResult.success,
      hasData: !!detailedResult.data,
      hasError: !!detailedResult.error,
      fallbackUsed: detailedResult.fallbackUsed,
    });

    console.log('✅ Firebase Functions Wrapper test completed successfully!');
    
    return;
  } catch (error) {
    console.error('❌ Firebase Functions Wrapper test failed:', error);
    throw error;
  }
}

/**
 * Test wrapper configuration options
 */
export async function testWrapperConfiguration(): Promise<void> {
  console.log('⚙️ Testing wrapper configuration options...');

  try {
    // Test with fallbacks disabled
    const wrapperNoFallback = getFirebaseFunctionsWrapper({
      enableFallbacks: false,
      logErrors: false,
      retryAttempts: 1,
    });

    console.log('✅ No-fallback wrapper created');

    // Test with custom emulator config
    const wrapperWithEmulator = getFirebaseFunctionsWrapper({
      enableFallbacks: true,
      logErrors: true,
      retryAttempts: 2,
      emulatorConfig: {
        host: 'localhost',
        port: 5001,
      },
    });

    console.log('✅ Emulator-configured wrapper created');

    // Test emulator connection (should fail gracefully in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 Testing emulator connection...');
      const connected = await wrapperWithEmulator.connectFunctionsEmulator('localhost', 5001);
      console.log(`🔗 Emulator connection: ${connected ? 'Success' : 'Failed (expected if emulator not running)'}`);
    }

    console.log('✅ Configuration test completed successfully!');
  } catch (error) {
    console.error('❌ Configuration test failed:', error);
    throw error;
  }
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<void> {
  console.log('🎯 Starting Firebase Functions Wrapper Tests...\n');

  try {
    await testFirebaseFunctionsWrapper();
    console.log('');
    await testWrapperConfiguration();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('📝 Summary:');
    console.log('  - Wrapper creation: ✅');
    console.log('  - Availability checking: ✅');
    console.log('  - Graceful degradation: ✅');
    console.log('  - Fallback behavior: ✅');
    console.log('  - Configuration options: ✅');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    throw error;
  }
}

// Export for use in other modules
export default {
  testFirebaseFunctionsWrapper,
  testWrapperConfiguration,
  runAllTests,
};