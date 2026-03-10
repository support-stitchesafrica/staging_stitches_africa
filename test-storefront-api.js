/**
 * Manual test script for storefront handle validation API
 * Run with: node test-storefront-api.js
 */

const testCases = [
  { handle: 'my-awesome-store', expected: 'valid' },
  { handle: 'MyStore123', expected: 'valid' },
  { handle: 'ab', expected: 'invalid - too short' },
  { handle: 'admin', expected: 'invalid - reserved' },
  { handle: '-invalid-', expected: 'invalid - format' },
  { handle: 'my store!', expected: 'valid after sanitization' }
];

async function testAPI() {
  console.log('🧪 Testing Storefront Handle Validation API\n');
  
  for (const testCase of testCases) {
    console.log(`Testing: "${testCase.handle}" (${testCase.expected})`);
    
    try {
      const response = await fetch('http://localhost:3001/api/storefront/validate-handle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle: testCase.handle })
      });
      
      const result = await response.json();
      
      console.log(`  ✅ Status: ${response.status}`);
      console.log(`  📝 Valid: ${result.isValid}`);
      console.log(`  🔍 Available: ${result.isAvailable}`);
      console.log(`  🧹 Sanitized: "${result.sanitizedHandle}"`);
      
      if (result.errors) {
        console.log(`  ❌ Errors: ${result.errors.join(', ')}`);
      }
      
      if (result.suggestions) {
        console.log(`  💡 Suggestions: ${result.suggestions.slice(0, 3).join(', ')}`);
      }
      
      if (result.previewUrl) {
        console.log(`  🔗 Preview URL: ${result.previewUrl}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// Test GET endpoint first
async function testGetEndpoint() {
  console.log('🔍 Testing GET endpoint...\n');
  
  try {
    const response = await fetch('http://localhost:3001/api/storefront/validate-handle');
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Message: ${result.message}`);
    console.log(`Usage: ${result.usage}\n`);
  } catch (error) {
    console.log(`❌ GET endpoint error: ${error.message}\n`);
  }
}

// Run tests
async function runTests() {
  await testGetEndpoint();
  await testAPI();
}

// Check if server is running
fetch('http://localhost:3001/api/storefront/validate-handle')
  .then(() => {
    console.log('✅ Server is running, starting tests...\n');
    runTests();
  })
  .catch(() => {
    console.log('❌ Server not running. Please start with: npm run dev\n');
    console.log('Expected server at: http://localhost:3001\n');
  });