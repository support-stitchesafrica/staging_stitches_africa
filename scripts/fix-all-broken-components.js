#!/usr/bin/env node

/**
 * Comprehensive fix for all broken component exports
 */

const fs = require('fs');
const path = require('path');

const BROKEN_FILES = [
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

console.log('🔧 Comprehensive fix for broken component exports...\n');

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
    
    // Pattern 1: Fix broken function signature with export in middle
    // function ComponentName({ ... }
    // export default memo(ComponentName) {
    const brokenFunctionPattern = /function\s+([A-Z][a-zA-Z0-9]*)\s*\(\s*\{([^}]*)\}\s*\n\s*export default memo\([^)]+\)\s*\{/gs;
    if (brokenFunctionPattern.test(content)) {
      content = content.replace(brokenFunctionPattern, (match, componentName, props) => {
        return `function ${componentName}({ ${props.trim()} }: any) {`;
      });
      
      // Remove any standalone export statements
      content = content.replace(/\nexport default memo\([^)]+\);\s*$/gm, '');
      
      // Add proper export at the end
      const componentMatch = content.match(/function\s+([A-Z][a-zA-Z0-9]*)/);
      if (componentMatch && !content.includes(`export default memo(${componentMatch[1]})`)) {
        content += `\n\nexport default memo(${componentMatch[1]});`;
      }
      
      modified = true;
    }
    
    // Pattern 2: Fix export statements in wrong places
    // Remove exports that appear in the middle of files
    const middleExportPattern = /^export default memo\([^)]+\)\s*\{/gm;
    if (middleExportPattern.test(content)) {
      content = content.replace(middleExportPattern, '{');
      modified = true;
    }
    
    // Pattern 3: Fix broken export const patterns
    if (content.includes('export const MemoizedWaitingList = memo(WaitingList);')) {
      // This is a special case - need to restructure completely
      content = content.replace(
        /export const MemoizedWaitingList = memo\(WaitingList\);[\s\S]*/,
        ''
      );
      
      // Find the WaitingList function and add proper export
      if (content.includes('function WaitingList') || content.includes('const WaitingList')) {
        content += '\n\nexport default memo(WaitingList);';
      }
      modified = true;
    }
    
    // Pattern 4: Fix standalone export statements that are malformed
    const standaloneExportPattern = /^export default memo\([^)]+\);\s*$/gm;
    const exportMatches = [...content.matchAll(standaloneExportPattern)];
    
    if (exportMatches.length > 0) {
      // Check if these exports are at the end of the file (which is correct)
      const lastExportIndex = content.lastIndexOf('export default memo(');
      const contentAfterLastExport = content.substring(lastExportIndex);
      
      // If there's significant content after the export, it's misplaced
      if (contentAfterLastExport.split('\n').length > 3) {
        // Remove all exports and add one at the end
        content = content.replace(standaloneExportPattern, '');
        
        const componentMatch = content.match(/(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/);
        if (componentMatch) {
          content += `\n\nexport default memo(${componentMatch[1]});`;
        }
        modified = true;
      }
    }
    
    // Pattern 5: Ensure proper TypeScript types for props
    if (content.includes('}: any)') && content.includes('interface') && content.includes('Props')) {
      const interfaceMatch = content.match(/interface\s+([A-Z][a-zA-Z0-9]*Props)/);
      if (interfaceMatch) {
        content = content.replace('}: any)', `}: ${interfaceMatch[1]})`);
        modified = true;
      }
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

console.log(`\n📊 Summary:`);
console.log(`- Fixed ${fixedCount} files`);
console.log(`- Checked ${BROKEN_FILES.length} files total`);

console.log('\n🎉 Comprehensive component fixes complete!');