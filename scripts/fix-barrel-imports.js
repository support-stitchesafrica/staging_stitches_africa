#!/usr/bin/env node

/**
 * Barrel import optimization script
 * Converts barrel imports to direct imports for better tree shaking
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();

// Common barrel import patterns to fix
const BARREL_PATTERNS = [
  {
    // UI components barrel imports
    pattern: /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/components\/ui['"];?/g,
    replacement: (match, imports) => {
      const importList = imports.split(',').map(imp => imp.trim());
      return importList.map(imp => `import { ${imp} } from "@/components/ui/${imp.toLowerCase()}";`).join('\n');
    }
  },
  {
    // React barrel imports
    pattern: /import\s*{\s*([^}]+)\s*}\s*from\s*['"]react['"];?/g,
    replacement: (match, imports) => {
      const importList = imports.split(',').map(imp => imp.trim());
      const reactImports = importList.filter(imp => 
        ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext'].includes(imp)
      );
      const otherImports = importList.filter(imp => !reactImports.includes(imp));
      
      let result = '';
      if (reactImports.length > 0) {
        result += `import { ${reactImports.join(', ')} } from "react";\n`;
      }
      if (otherImports.length > 0) {
        result += `import { ${otherImports.join(', ')} } from "react";`;
      }
      return result.trim();
    }
  }
];

function optimizeBarrelImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const pattern of BARREL_PATTERNS) {
      const originalContent = content;
      content = content.replace(pattern.pattern, pattern.replacement);
      if (content !== originalContent) {
        modified = true;
      }
    }
    
    // Fix specific UI component imports
    const uiComponents = [
      'Button', 'Input', 'Label', 'Card', 'Dialog', 'Sheet', 'Popover',
      'Select', 'Checkbox', 'RadioGroup', 'Switch', 'Slider', 'Progress',
      'Avatar', 'Badge', 'Alert', 'Toast', 'Tooltip', 'Accordion',
      'Tabs', 'Table', 'Form', 'Calendar', 'Command', 'DropdownMenu'
    ];
    
    for (const component of uiComponents) {
      const barrelImportRegex = new RegExp(`import\\s*{[^}]*${component}[^}]*}\\s*from\\s*['"]@/components/ui['"];?`, 'g');
      if (barrelImportRegex.test(content)) {
        content = content.replace(barrelImportRegex, `import { ${component} } from "@/components/ui/${component.toLowerCase()}";`);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed barrel imports: ${path.relative(PROJECT_ROOT, filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Failed to fix ${filePath}:`, error.message);
    return false;
  }
}

function findFilesWithBarrelImports(dir) {
  const results = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        results.push(...findFilesWithBarrelImports(fullPath));
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.jsx') || item.endsWith('.ts'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        // Check for barrel imports
        if (content.includes('from "@/components/ui"') || 
            content.includes('from "react"') ||
            content.includes('} from "@/')) {
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
  console.log('📦 Starting barrel import optimization...\n');
  
  const files = findFilesWithBarrelImports(PROJECT_ROOT);
  let optimizedCount = 0;
  
  for (const file of files) {
    if (optimizeBarrelImports(file)) {
      optimizedCount++;
    }
  }
  
  console.log(`\n📊 Optimization Summary:`);
  console.log(`- Fixed barrel imports in ${optimizedCount} files`);
  console.log(`- Checked ${files.length} files total`);
  
  console.log('\n💡 Benefits:');
  console.log('- Better tree shaking');
  console.log('- Smaller bundle sizes');
  console.log('- Faster build times');
  console.log('- More explicit dependencies');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { optimizeBarrelImports, findFilesWithBarrelImports };