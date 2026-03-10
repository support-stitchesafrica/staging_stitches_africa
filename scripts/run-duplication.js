#!/usr/bin/env node

/**
 * Simple runner for collection duplication
 * This script can be run directly with: node scripts/run-duplication.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Firebase collection duplication...');
console.log('📋 This will duplicate all collections with "staging_" prefix');

// Ask for confirmation
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n⚠️  This will create staging copies of all your collections. Continue? (y/N): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n✅ Starting duplication process...\n');
    
    // Run the TypeScript version if ts-node is available, otherwise use JavaScript
    const scriptPath = path.join(__dirname, 'duplicate-collections.js');
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n🎉 Collection duplication completed successfully!');
      } else {
        console.log(`\n❌ Process exited with code ${code}`);
      }
      rl.close();
    });
    
    child.on('error', (error) => {
      console.error('❌ Failed to start duplication process:', error);
      rl.close();
    });
  } else {
    console.log('\n❌ Duplication cancelled.');
    rl.close();
  }
});