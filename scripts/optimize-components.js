#!/usr/bin/env node

/**
 * Component optimization script
 * Automatically adds React.memo to components that need it
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(process.cwd(), 'components');

// Components that should be memoized (from performance report)
const COMPONENTS_TO_OPTIMIZE = [
  'BrandSlider', 'BvnVerification', 'FeaturesSection', 'HeroSection',
  'HeroSectionBrand', 'HowItWorks', 'ReferAndEarnBanner', 'VendorSubaccountDetails',
  'VendorWishlist', 'WaitingList', 'InvitationCreateAccountForm', 'InvitationLoginForm',
  'BackOfficeHeader', 'DashboardCard', 'PermissionGuard', 'StatsCard',
  'AdminDashboard', 'SystemSettings', 'TailorsList', 'UsersList',
  'LogisticsDashboard', 'OverviewDashboard', 'ProductsDashboard', 'SalesDashboard',
  'TrafficDashboard', 'AcceptInvitationForm', 'LoginForm', 'CollectionsList',
  'CreateCollectionForm', 'FeaturedCollections', 'InteractionsList', 'MarketingDashboard',
  'TasksList', 'VendorsList', 'CreateEventForm', 'EventAnalytics',
  'EventsList', 'InvitationsList', 'RoleManagement', 'TeamMembers'
];

function addReactMemo(filePath, componentName) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already memoized
    if (content.includes('React.memo') || content.includes('memo(')) {
      return false;
    }
    
    // Check if it's a valid React component
    const componentRegex = new RegExp(`(export\\s+(?:default\\s+)?(?:const|function)\\s+${componentName}|const\\s+${componentName}\\s*=)`, 'g');
    
    if (!componentRegex.test(content)) {
      return false;
    }
    
    // Add React import if not present
    if (!content.includes('import React') && !content.includes("import { memo }")) {
      if (content.includes("import {")) {
        content = content.replace(/import\s*{([^}]+)}\s*from\s*['"]react['"]/, 'import React, { $1, memo } from "react"');
      } else {
        content = 'import React, { memo } from "react";\n' + content;
      }
    } else if (content.includes('import React') && !content.includes('memo')) {
      content = content.replace(/import React([^;]*from\s*['"]react['"])/, 'import React, { memo }$1');
    }
    
    // Wrap component with memo
    const patterns = [
      // Default export function
      {
        regex: new RegExp(`(export\\s+default\\s+function\\s+${componentName}[^{]*{[\\s\\S]*?^})`, 'm'),
        replacement: `$1\n\nexport default memo(${componentName});`
      },
      // Named export function
      {
        regex: new RegExp(`(export\\s+function\\s+${componentName}[^{]*{[\\s\\S]*?^})`, 'm'),
        replacement: `$1\n\nexport const Memoized${componentName} = memo(${componentName});`
      },
      // Const arrow function
      {
        regex: new RegExp(`(const\\s+${componentName}\\s*=\\s*[^;]+;)`, 'g'),
        replacement: `$1\n\nexport const Memoized${componentName} = memo(${componentName});`
      }
    ];
    
    let modified = false;
    for (const pattern of patterns) {
      if (pattern.regex.test(content)) {
        content = content.replace(pattern.regex, pattern.replacement);
        modified = true;
        break;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Optimized: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Failed to optimize ${filePath}:`, error.message);
    return false;
  }
}

function findComponentFiles(dir, componentName) {
  const results = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        results.push(...findComponentFiles(fullPath, componentName));
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.jsx'))) {
        // Check if file contains the component
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(componentName)) {
          results.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error.message);
  }
  
  return results;
}

async function main() {
  console.log('⚛️  Starting component optimization...\n');
  
  let optimizedCount = 0;
  
  for (const componentName of COMPONENTS_TO_OPTIMIZE) {
    console.log(`🔍 Looking for ${componentName}...`);
    
    const files = findComponentFiles(COMPONENTS_DIR, componentName);
    
    for (const file of files) {
      if (addReactMemo(file, componentName)) {
        optimizedCount++;
      }
    }
  }
  
  console.log(`\n📊 Optimization Summary:`);
  console.log(`- Optimized ${optimizedCount} components with React.memo`);
  console.log(`- Checked ${COMPONENTS_TO_OPTIMIZE.length} component types`);
  
  console.log('\n💡 Benefits:');
  console.log('- Reduced unnecessary re-renders');
  console.log('- Improved component performance');
  console.log('- Better user experience');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { addReactMemo, findComponentFiles };