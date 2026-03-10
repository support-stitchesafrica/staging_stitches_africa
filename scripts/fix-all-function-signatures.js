#!/usr/bin/env node

/**
 * Fix all broken function signatures in components
 */

const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'components/backoffice/DashboardCard.tsx',
    search: /export default function DashboardCard\(\s*\{([^}]*)\}\s*\)\s*\n\s*\n\s*const/gs,
    replace: 'function DashboardCard({ $1 }: DashboardCardProps) {\n  const'
  },
  {
    file: 'components/backoffice/PermissionGuard.tsx',
    search: /export default function PermissionGuard\(\s*\{([^}]*)\}\s*\)\s*\n\s*\n\s*const/gs,
    replace: 'function PermissionGuard({ $1 }: PermissionGuardProps) {\n  const'
  },
  {
    file: 'components/backoffice/StatsCard.tsx',
    search: /export default function StatsCard\(\s*\{([^}]*)\}\s*\)\s*\n\s*\n\s*const/gs,
    replace: 'function StatsCard({ $1 }: StatsCardProps) {\n  const'
  },
  {
    file: 'components/marketing/InvitationCreateAccountForm.tsx',
    search: /export default function InvitationCreateAccountForm\(\s*\{([^}]*)\}\s*\)\s*\n\s*\n\s*const/gs,
    replace: 'function InvitationCreateAccountForm({ $1 }: InvitationCreateAccountFormProps) {\n  const'
  },
  {
    file: 'components/marketing/InvitationLoginForm.tsx',
    search: /export default function InvitationLoginForm\(\s*\{([^}]*)\}\s*\)\s*\n\s*\n\s*const/gs,
    replace: 'function InvitationLoginForm({ $1 }: InvitationLoginFormProps) {\n  const'
  },
  {
    file: 'components/vendor/storefront/HeroSectionEditor.tsx',
    search: /export default function HeroSection\(\s*\{([^}]*)\}\s*\)\s*\n\s*\n\s*const/gs,
    replace: 'function HeroSection({ $1 }: HeroSectionProps) {\n  const'
  },
  {
    file: 'components/VendorSubaccountDetails.tsx',
    search: /export default function VendorSubaccountDetails\(\s*\{([^}]*)\}\s*\)\s*\n\s*\n\s*if/gs,
    replace: 'function VendorSubaccountDetails({ $1 }: VendorSubaccountDetailsProps) {\n  if'
  }
];

console.log('🔧 Fixing all function signatures...\n');

let fixedCount = 0;

for (const fix of fixes) {
  const fullPath = path.join(process.cwd(), fix.file);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${fix.file}`);
    continue;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (fix.search.test(content)) {
      content = content.replace(fix.search, fix.replace);
      
      // Remove any standalone export statements
      content = content.replace(/\nexport default memo\([^)]+\);\s*$/gm, '');
      
      // Add proper export at the end if not present
      const componentMatch = content.match(/function\s+([A-Z][a-zA-Z0-9]*)/);
      if (componentMatch && !content.includes(`export default memo(${componentMatch[1]})`)) {
        content += `\n\nexport default memo(${componentMatch[1]});`;
      }
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${fix.file}`);
      fixedCount++;
    } else {
      console.log(`✅ Already clean: ${fix.file}`);
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${fix.file}:`, error.message);
  }
}

// Special case for waitlist-table.tsx
const waitlistPath = path.join(process.cwd(), 'components/newsletter/subscribers/waitlist-table.tsx');
if (fs.existsSync(waitlistPath)) {
  try {
    let content = fs.readFileSync(waitlistPath, 'utf8');
    
    // Fix the waitlist table which has a different pattern
    if (content.includes('export default memo(WaitingList);') && !content.includes('function WaitingList')) {
      // Find where the component logic starts
      const logicStart = content.indexOf('const allSelected');
      if (logicStart > -1) {
        const beforeLogic = content.substring(0, logicStart);
        const afterLogic = content.substring(logicStart);
        
        // Remove the export statement from the middle
        const cleanedAfterLogic = afterLogic.replace(/export default memo\(WaitingList\);\s*/, '');
        
        // Reconstruct with proper function signature
        content = beforeLogic + 'function WaitingList(props: any) {\n  ' + cleanedAfterLogic;
        content += '\n\nexport default memo(WaitingList);';
        
        fs.writeFileSync(waitlistPath, content);
        console.log(`✅ Fixed: components/newsletter/subscribers/waitlist-table.tsx`);
        fixedCount++;
      }
    }
  } catch (error) {
    console.error(`❌ Error fixing waitlist-table.tsx:`, error.message);
  }
}

console.log(`\n📊 Summary:`);
console.log(`- Fixed ${fixedCount} files`);
console.log(`- Checked ${fixes.length + 1} files total`);

console.log('\n🎉 All function signature fixes complete!');