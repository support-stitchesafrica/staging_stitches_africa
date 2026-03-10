#!/usr/bin/env node

/**
 * Image optimization script for Stitches Africa
 * Compresses and optimizes images to improve performance
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const MAX_SIZE = 500 * 1024; // 500KB max size
const QUALITY = 80;

// Image optimization configurations
const OPTIMIZATION_CONFIGS = {
  '.png': { format: 'webp', quality: QUALITY },
  '.jpg': { format: 'webp', quality: QUALITY },
  '.jpeg': { format: 'webp', quality: QUALITY },
};

async function optimizeImage(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const config = OPTIMIZATION_CONFIGS[ext];
    
    if (!config) return;

    const stats = fs.statSync(filePath);
    if (stats.size <= MAX_SIZE) return;

    console.log(`🔧 Optimizing: ${path.relative(PUBLIC_DIR, filePath)} (${(stats.size / 1024).toFixed(1)}KB)`);

    const outputPath = filePath.replace(ext, '.webp');
    
    await sharp(filePath)
      .webp({ quality: config.quality })
      .toFile(outputPath);

    const newStats = fs.statSync(outputPath);
    const savings = ((stats.size - newStats.size) / stats.size * 100).toFixed(1);
    
    console.log(`✅ Saved: ${savings}% (${(newStats.size / 1024).toFixed(1)}KB)`);
    
    // Keep original and create optimized version
    return {
      original: filePath,
      optimized: outputPath,
      savings: savings
    };
  } catch (error) {
    console.error(`❌ Failed to optimize ${filePath}:`, error.message);
  }
}

async function findAndOptimizeImages(dir) {
  const results = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const subResults = await findAndOptimizeImages(fullPath);
        results.push(...subResults);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (['.png', '.jpg', '.jpeg'].includes(ext)) {
          const result = await optimizeImage(fullPath);
          if (result) results.push(result);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error.message);
  }
  
  return results;
}

async function main() {
  console.log('🖼️  Starting image optimization...\n');
  
  const results = await findAndOptimizeImages(PUBLIC_DIR);
  
  if (results.length === 0) {
    console.log('✅ No images need optimization!');
    return;
  }
  
  console.log(`\n📊 Optimization Summary:`);
  console.log(`- Optimized ${results.length} images`);
  
  const totalSavings = results.reduce((sum, r) => sum + parseFloat(r.savings), 0) / results.length;
  console.log(`- Average savings: ${totalSavings.toFixed(1)}%`);
  
  console.log('\n💡 Next steps:');
  console.log('1. Update image references to use .webp versions');
  console.log('2. Implement fallback for browsers that don\'t support WebP');
  console.log('3. Consider using Next.js Image component for automatic optimization');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { optimizeImage, findAndOptimizeImages };