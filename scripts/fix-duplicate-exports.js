#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files with duplicate export issues from the build error
const problematicFiles = [
  'components/BrandSlider.tsx',
  'components/FeaturesSection.tsx',
  'components/HeroSection.tsx',
  'components/HeroSectionBrand.tsx',
  'components/HowItWorks.tsx',
  'components/VendorWishlist.tsx',
  'components/backoffice/BackOfficeHeader.tsx',
  'components/backoffice/auth/AcceptInvitationForm.tsx',
  'components/backoffice/auth/LoginForm.tsx',
  'components/vendor/FeaturesSection.tsx'
];

function fixDuplicateExports(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Pattern to match: export default function ComponentName() followed by export default memo(ComponentName);
    const exportDefaultFunctionPattern = /export default function (\w+)\(/g;
    const exportDefaultMemoPattern = /export default memo\((\w+)\);/g;

    // Find all export default function declarations
    const functionMatches = [...content.matchAll(exportDefaultFunctionPattern)];
    const memoMatches = [...content.matchAll(exportDefaultMemoPattern)];

    if (functionMatches.length > 0 && memoMatches.length > 0) {
      // Remove the 'export default' from function declarations
      content = content.replace(exportDefaultFunctionPattern, 'function $1(');
      
      // Ensure memo import is present
      if (!content.includes('import { memo }') && !content.includes('import React, { memo }')) {
        if (content.includes('import React')) {
          content = content.replace('import React', 'import React, { memo }');
        } else {
          content = 'import { memo } from "react";\n' + content;
        }
      }

      console.log(`✅ Fixed duplicate exports in: ${filePath}`);
    } else if (functionMatches.length > 1) {
      // Multiple export default function declarations
      const matches = [...content.matchAll(/export default function/g)];
      if (matches.length > 1) {
        // Keep only the first one, remove others
        let count = 0;
        content = content.replace(/export default function/g, (match) => {
          count++;
          return count === 1 ? match : 'function';
        });
        console.log(`✅ Fixed multiple export default functions in: ${filePath}`);
      }
    } else {
      console.log(`ℹ️  No duplicate exports found in: ${filePath}`);
    }

    // Write back only if content changed
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`💾 Updated: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing duplicate export issues...\n');

problematicFiles.forEach(fixDuplicateExports);

console.log('\n✨ Duplicate export fix completed!');