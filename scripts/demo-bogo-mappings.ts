#!/usr/bin/env tsx
/**
 * Demo script for BOGO specific mappings
 * Run with: npx tsx scripts/demo-bogo-mappings.ts
 */

import { demonstrateAllBOGOMappings, testCartBehavior } from '../lib/bogo/demo-specific-mappings';

async function main() {
  console.log('🚀 Starting BOGO Mappings Demo...\n');

  try {
    // Demonstrate all mappings
    await demonstrateAllBOGOMappings();
    
    // Test cart behavior
    await testCartBehavior();
    
    console.log('\n🎉 Demo completed successfully!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Run the configuration script to set up mappings');
    console.log('   2. Test with real product data');
    console.log('   3. Deploy to production for December promotion');
    
  } catch (error) {
    console.error('💥 Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  main().catch(console.error);
}

export { main as demoBOGOMappings };