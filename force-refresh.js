/**
 * Force refresh script to clear caches and restart development
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Force refreshing development environment...');

// Function to touch a file to trigger rebuild
function touchFile(filePath) {
  try {
    const now = new Date();
    fs.utimesSync(filePath, now, now);
    console.log(`✅ Touched: ${filePath}`);
  } catch (error) {
    console.log(`⚠️  Could not touch ${filePath}:`, error.message);
  }
}

// Function to remove cache directories
function removeDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`🗑️  Removed: ${dirPath}`);
    }
  } catch (error) {
    console.log(`⚠️  Could not remove ${dirPath}:`, error.message);
  }
}

// Clear Next.js cache
console.log('\n🧹 Clearing Next.js cache...');
removeDir('.next');

// Clear Turbopack cache if it exists
console.log('\n🧹 Clearing Turbopack cache...');
removeDir('.turbo');

// Touch key files to trigger rebuild
console.log('\n👆 Touching key files to trigger rebuild...');
touchFile('lib/firestore.ts');
touchFile('contexts/WishlistContext.tsx');
touchFile('next.config.mjs');

// Create a temporary file to force a rebuild
const tempFile = '.force-rebuild-' + Date.now();
fs.writeFileSync(tempFile, 'temp file to force rebuild');
setTimeout(() => {
  try {
    fs.unlinkSync(tempFile);
  } catch (e) {
    // ignore
  }
}, 1000);

console.log('\n🎉 Cache cleared! Please restart your development server:');
console.log('   npm run dev');
console.log('   # or');
console.log('   yarn dev');
console.log('\n💡 If the error persists, try:');
console.log('   1. Hard refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)');
console.log('   2. Clear browser cache');
console.log('   3. Check browser console for the new detailed error logs');