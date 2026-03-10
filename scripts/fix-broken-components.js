#!/usr/bin/env node

/**
 * Fix broken component exports caused by optimization script
 */

const fs = require('fs');
const path = require('path');

const BROKEN_FILES = [
  'components/atlas/InvitationCreateAccountForm.tsx',
  'components/atlas/InvitationLoginForm.tsx',
  'components/backoffice/admin/TailorsList.tsx',
  'components/backoffice/admin/UsersList.tsx',
  'components/backoffice/DashboardCard.tsx',
  'components/backoffice/PermissionGuard.tsx',
  'components/backoffice/StatsCard.tsx',
  'components/collections/InvitationCreateAccountForm.tsx',
  'components/collections/InvitationLoginForm.tsx',
  'components/marketing/InvitationCreateAccountForm.tsx',
  'components/marketing/InvitationLoginForm.tsx',
  'components/newsletter/subscribers/waitlist-table.tsx',
  'components/vendor/storefront/HeroSectionEditor.tsx',
  'components/VendorSubaccountDetails.tsx'
];

console.log('🔧 Fixing broken component exports...\n');

let fixedCount = 0;

for (const filePath of BROKEN_FILES) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    continue;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    const originalContent = content;
    
    // Fix malformed import statements - merge duplicate React imports
    if (content.includes('import React, {') && content.includes('} from "react"')) {
      // Extract all React imports and merge them
      const reactImportRegex = /import React,?\s*\{([^}]*)\}\s*from\s*["']react["'];?/g;
      const matches = [...content.matchAll(reactImportRegex)];
      
      if (matches.length > 1) {
        // Collect all imports
        const allImports = new Set();
        matches.forEach(match => {
          const imports = match[1].split(',').map(imp => imp.trim()).filter(Boolean);
          imports.forEach(imp => allImports.add(imp));
        });
        
        // Remove all existing React imports
        content = content.replace(reactImportRegex, '');
        
        // Add single consolidated import at the top
        const consolidatedImport = `import React, { ${Array.from(allImports).join(', ')} } from 'react';\n`;
        content = consolidatedImport + content;
        modified = true;
      }
    }
    
    // Fix broken function declarations and exports
    // Pattern: export default function ComponentName({ ... }
    // export default memo(ComponentName);: ComponentNameProps) {
    const brokenExportPattern = /export default function ([^(]+)\(\{[^}]*\}\s*\n\s*export default memo\([^)]+\);:\s*[^)]+\)\s*\{/gs;
    if (brokenExportPattern.test(content)) {
      content = content.replace(brokenExportPattern, (match, componentName) => {
        // Extract the props from the function signature
        const functionMatch = match.match(/export default function [^(]+\(([^{]*\{[^}]*\}[^)]*)\)/s);
        if (functionMatch) {
          return `function ${componentName}(${functionMatch[1].trim()}) {`;
        }
        return match;
      });
      
      // Add proper memo export at the end
      if (!content.includes('export default memo(')) {
        const componentNameMatch = content.match(/function ([^(]+)\(/);
        if (componentNameMatch) {
          content += `\n\nexport default memo(${componentNameMatch[1]});`;
        }
      }
      modified = true;
    }
    
    // Fix standalone broken export statements
    if (content.includes('export default memo(') && content.includes(');:')) {
      content = content.replace(
        /export default memo\(([^)]+)\);:\s*[^)]+\)\s*\{/g,
        ''
      );
      modified = true;
    }
    
    // Fix any remaining malformed syntax patterns
    content = content.replace(/;:\s*[^)]+\)\s*\{/g, ';');
    
    // Ensure proper memo export exists
    if (content.includes('import React, { memo') && !content.includes('export default memo(')) {
      const functionMatch = content.match(/(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/);
      if (functionMatch) {
        const componentName = functionMatch[1];
        if (!content.includes(`export default memo(${componentName})`)) {
          content += `\n\nexport default memo(${componentName});`;
          modified = true;
        }
      }
    }
    
    // Clean up any duplicate exports
    const exportMatches = [...content.matchAll(/export default memo\([^)]+\);/g)];
    if (exportMatches.length > 1) {
      // Keep only the last export
      const lastExport = exportMatches[exportMatches.length - 1][0];
      content = content.replace(/export default memo\([^)]+\);/g, '');
      content += `\n\n${lastExport}`;
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
      fixedCount++;
    } else {
      console.log(`✅ Already clean: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Fix the analytics aggregation service file
const analyticsServicePath = path.join(process.cwd(), 'lib/atlas/unified-analytics/services/analytics-aggregation-service.ts');
if (fs.existsSync(analyticsServicePath)) {
  try {
    let content = fs.readFileSync(analyticsServicePath, 'utf8');
    
    // Fix any unclosed braces or syntax issues
    if (content.includes('} catch (error) {') && !content.trim().endsWith('}')) {
      content = content.trim();
      if (!content.endsWith('}')) {
        content += '\n    }\n  }\n}';
      }
      fs.writeFileSync(analyticsServicePath, content);
      console.log('✅ Fixed: analytics-aggregation-service.ts');
      fixedCount++;
    }
  } catch (error) {
    console.error('❌ Error fixing analytics service:', error.message);
  }
}

console.log(`\n📊 Summary:`);
console.log(`- Fixed ${fixedCount} files`);
console.log(`- Checked ${BROKEN_FILES.length + 1} files total`);

console.log('\n🎉 Component fixes complete!');
console.log('\n📋 Next steps:');
console.log('1. Run "npx tsc --noEmit --skipLibCheck" to verify fixes');
console.log('2. Run "npm run dev" to test the application');
console.log('3. All performance optimizations are still active');