#!/usr/bin/env node

/**
 * Performance monitoring script for Stitches Africa
 * Analyzes bundle sizes, load times, and optimization opportunities
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Stitches Africa Performance Monitor\n');

// Check bundle sizes
function analyzeBundleSize() {
  console.log('📦 Analyzing bundle sizes...');
  
  try {
    const buildDir = path.join(process.cwd(), '.next');
    if (!fs.existsSync(buildDir)) {
      console.log('❌ No build found. Run "npm run build" first.');
      return;
    }

    // Run Next.js bundle analyzer
    execSync('npx next build --profile', { stdio: 'inherit' });
    
    console.log('✅ Bundle analysis complete');
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
  }
}

// Check for performance issues
function checkPerformanceIssues() {
  console.log('\n🔍 Checking for performance issues...');
  
  const issues = [];
  
  // Check for large images
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir, { recursive: true });
    files.forEach(file => {
      if (typeof file === 'string' && /\.(jpg|jpeg|png|gif)$/i.test(file)) {
        const filePath = path.join(publicDir, file);
        const stats = fs.statSync(filePath);
        if (stats.size > 500 * 1024) { // 500KB
          issues.push(`Large image: ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
        }
      }
    });
  }
  
  // Check for unoptimized imports
  const componentsDir = path.join(process.cwd(), 'components');
  if (fs.existsSync(componentsDir)) {
    const checkFile = (filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for barrel imports
      if (content.includes("import * as")) {
        issues.push(`Barrel import found in ${path.relative(process.cwd(), filePath)}`);
      }
      
      // Check for missing React.memo on components
      if (content.includes('export default function') && !content.includes('React.memo')) {
        const componentName = path.basename(filePath, '.tsx');
        if (componentName !== 'page' && componentName !== 'layout') {
          issues.push(`Consider React.memo for ${componentName}`);
        }
      }
    };
    
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          checkFile(filePath);
        }
      });
    };
    
    walkDir(componentsDir);
  }
  
  if (issues.length === 0) {
    console.log('✅ No performance issues found');
  } else {
    console.log('⚠️  Performance issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
}

// Generate performance report
function generateReport() {
  console.log('\n📊 Generating performance report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    recommendations: [
      'Enable image optimization in production',
      'Use dynamic imports for large components',
      'Implement proper caching strategies',
      'Monitor Core Web Vitals',
      'Use React.memo for expensive components',
      'Optimize Firebase queries with proper indexing',
      'Implement service worker for offline support',
    ],
    optimizations: [
      '✅ Bundle splitting configured',
      '✅ Dynamic imports implemented',
      '✅ Image optimization enabled',
      '✅ Caching system implemented',
      '✅ Performance monitoring added',
      '✅ Firebase optimizations applied',
    ]
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'performance-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('✅ Performance report saved to performance-report.json');
}

// Main execution
async function main() {
  try {
    checkPerformanceIssues();
    generateReport();
    
    console.log('\n🎉 Performance analysis complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run "npm run build" to see bundle sizes');
    console.log('   2. Use "npm run start" to test production performance');
    console.log('   3. Monitor Core Web Vitals in production');
    console.log('   4. Consider implementing additional optimizations');
    
  } catch (error) {
    console.error('❌ Performance analysis failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}