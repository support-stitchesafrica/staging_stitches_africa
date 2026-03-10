#!/usr/bin/env node

/**
 * Fix broken function signatures in components
 */

const fs = require('fs');
const path = require('path');

const BROKEN_FILES = [
  'components/backoffice/admin/TailorsList.tsx',
  'components/backoffice/admin/UsersList.tsx',
  'components/backoffice/DashboardCard.tsx',
  'components/backoffice/PermissionGuard.tsx',
  'components/backoffice/StatsCard.tsx',
  'components/marketing/InvitationCreateAccountForm.tsx',
  'components/marketing/InvitationLoginForm.tsx',
  'components/newsletter/subscribers/waitlist-table.tsx',
  'components/vendor/storefront/HeroSectionEditor.tsx',
  'components/VendorSubaccountDetails.tsx'
];

console.log('🔧 Fixing broken function signatures...\n');

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
    
    // Pattern 1: Fix broken function signature where parameters are outside function body
    // export default function ComponentName({ ... }
    // 
    // const ... (function body starts here)
    const brokenSignaturePattern = /export default function\s+([A-Z][a-zA-Z0-9]*)\s*\(\s*\{([^}]*)\}\s*\)\s*\n\s*\n\s*const/gs;
    if (brokenSignaturePattern.test(content)) {
      content = content.replace(brokenSignaturePattern, (match, componentName, params) => {
        return `function ${componentName}({ ${params.trim()} }: any) {\n  const`;
      });
      
      // Remove any standalone export statements
      content = content.replace(/\nexport default memo\([^)]+\);\s*$/gm, '');
      
      // Add proper export at the end
      if (!content.includes(`export default memo(${componentName})`)) {
        content += `\n\nexport default memo(${componentName});`;
      }
      
      modified = true;
    }
    
    // Pattern 2: Fix function signature without export default
    // function ComponentName({ ... }
    // 
    // const ... (function body starts here)
    const functionSignaturePattern = /^function\s+([A-Z][a-zA-Z0-9]*)\s*\(\s*\{([^}]*)\}\s*\)\s*\n\s*\n\s*const/gm;
    if (functionSignaturePattern.test(content)) {
      content = content.replace(functionSignaturePattern, (match, componentName, params) => {
        return `function ${componentName}({ ${params.trim()} }: any) {\n  const`;
      });
      modified = true;
    }
    
    // Pattern 3: Fix cases where function body is completely separated
    // export default function ComponentName({ ... }
    // 
    // 
    //   const ... (function body with wrong indentation)
    const separatedBodyPattern = /export default function\s+([A-Z][a-zA-Z0-9]*)\s*\(\s*\{([^}]*)\}\s*\)\s*\n\s*\n\s*\n\s*const/gs;
    if (separatedBodyPattern.test(content)) {
      content = content.replace(separatedBodyPattern, (match, componentName, params) => {
        return `function ${componentName}({ ${params.trim()} }: any) {\n  const`;
      });
      modified = true;
    }
    
    // Pattern 4: Fix missing function signature entirely
    // Just starts with const declarations
    if (content.trim().startsWith('const ') && !content.includes('function ')) {
      // Find the component name from the export statement
      const exportMatch = content.match(/export default memo\(([A-Z][a-zA-Z0-9]*)\)/);
      if (exportMatch) {
        const componentName = exportMatch[1];
        content = `function ${componentName}(props: any) {\n  ${content.replace(/export default memo\([^)]+\);\s*$/, '')}`;
        content += `\n\nexport default memo(${componentName});`;
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

console.log('\n🎉 Function signature fixes complete!');