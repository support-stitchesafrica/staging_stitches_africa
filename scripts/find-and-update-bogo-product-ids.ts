#!/usr/bin/env tsx
/**
 * Script to find actual product IDs from Firestore and update BOGO mappings
 * Run with: npx tsx scripts/find-and-update-bogo-product-ids.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Product search terms to find in Firestore
 */
const PRODUCT_SEARCH_TERMS = {
  // Main products (items customers buy)
  'REPLACE_WITH_OUCH_SNEAKERS_ID': ['SNEAKERS', 'ouch sneakers', 'OUCH', 'sneakers'],
  'REPLACE_WITH_TRAX_WIDE_LEG_ID': ['White T-Shirt with Aso Oke Pockets x Wide Leg Fringe Pant', 'trax wide leg', 'TRAX', 'wide leg pant'],
  'REPLACE_WITH_TRAX_SHORTS_ID': ['Sleeveless Cowrie Jacket x Splatted Cargo Jorts', 'Sleeveless Cowrie Jacket x Splatted Cargo Jorts', 'splattered shorts'],
  'REPLACE_WITH_AKWETE_DRESS_ID': ['THE AKWETE MAXI DRESS', 'akwete maxi', 'HAUTE AFRIKANA', 'akwete'],
  'REPLACE_WITH_SILENT_POWER_ID': ['SILENT POWER TOP', 'silent power', 'NANCY HANSON'],
  'REPLACE_WITH_PEARL_NEUTRAL_ID': ['PEARL NEUTRAL', 'pearl neutral', 'NANCY HANSON'],
  'REPLACE_WITH_AINA_DRESS_ID': ['Aina', 'aina', 'IYANGA WOMAN'],
  
  // Free products (items customers get free)
  'REPLACE_WITH_TTDALK_WALLET_ID': ['Brown Leather Long Wallet', 'ttdalk wallet', 'TTDALK', 'long wallet'],
  'REPLACE_WITH_SEQUIN_PURSE_ID': ['SEQUIN PURSE', 'sequin purse', 'BY ORE'],
  'REPLACE_WITH_LOLA_CANDY_ID': ['CANDY', 'lola candy', 'LOLA SIGNATURE'],
  'REPLACE_WITH_LOLA_BEAD_BAG_ID': ['EWA BEAD BAG', 'ewa bead bag', 'LOLA SIGNATURE']
};

/**
 * Search for a product in Firestore by title/name
 */
async function findProductByName(searchTerms: string[]): Promise<string | null> {
  try {
    const productsRef = collection(db, 'tailor_works');
    
    // Try each search term
    for (const term of searchTerms) {
      console.log(`  Searching for: "${term}"`);
      
      // Search by title field (case insensitive)
      const titleQuery = query(productsRef, where('title', '>=', term), where('title', '<=', term + '\uf8ff'));
      const titleSnapshot = await getDocs(titleQuery);
      
      if (!titleSnapshot.empty) {
        const product = titleSnapshot.docs[0];
        console.log(`  ✓ Found by title: ${product.id} - ${product.data().title}`);
        return product.id;
      }
      
      // Search by tags array (if exists)
      try {
        const tagsQuery = query(productsRef, where('tags', 'array-contains', term.toLowerCase()));
        const tagsSnapshot = await getDocs(tagsQuery);
        
        if (!tagsSnapshot.empty) {
          const product = tagsSnapshot.docs[0];
          console.log(`  ✓ Found by tags: ${product.id} - ${product.data().title}`);
          return product.id;
        }
      } catch (error) {
        // Tags field might not exist on all products
      }
    }
    
    console.log(`  ❌ Not found with any search terms`);
    return null;
  } catch (error) {
    console.error(`  ❌ Error searching for product:`, error);
    return null;
  }
}

/**
 * Find all product IDs and create a mapping
 */
async function findAllProductIds(): Promise<Record<string, string>> {
  console.log('🔍 Searching for products in Firestore...\n');
  
  const foundIds: Record<string, string> = {};
  
  for (const [placeholder, searchTerms] of Object.entries(PRODUCT_SEARCH_TERMS)) {
    console.log(`Looking for ${placeholder}:`);
    const productId = await findProductByName(searchTerms);
    
    if (productId) {
      foundIds[placeholder] = productId;
    } else {
      console.log(`⚠️  Could not find product for ${placeholder}`);
      // Keep the placeholder for manual replacement
      foundIds[placeholder] = placeholder;
    }
    console.log('');
  }
  
  return foundIds;
}

/**
 * Update the configuration file with found product IDs
 */
function updateConfigurationFile(productIds: Record<string, string>): void {
  const configPath = join(process.cwd(), 'lib/bogo/configure-specific-mappings.ts');
  
  try {
    let content = readFileSync(configPath, 'utf-8');
    
    // Replace each placeholder with the found ID
    for (const [placeholder, actualId] of Object.entries(productIds)) {
      const regex = new RegExp(`'${placeholder}'`, 'g');
      content = content.replace(regex, `'${actualId}'`);
    }
    
    writeFileSync(configPath, content, 'utf-8');
    console.log('✅ Updated configuration file with found product IDs');
  } catch (error) {
    console.error('❌ Error updating configuration file:', error);
  }
}

/**
 * Display summary of found vs missing products
 */
function displaySummary(productIds: Record<string, string>): void {
  const found = Object.entries(productIds).filter(([placeholder, id]) => id !== placeholder);
  const missing = Object.entries(productIds).filter(([placeholder, id]) => id === placeholder);
  
  console.log('\n📊 Summary:');
  console.log('===========');
  console.log(`✅ Found: ${found.length} products`);
  console.log(`❌ Missing: ${missing.length} products`);
  
  if (found.length > 0) {
    console.log('\n✅ Found Products:');
    found.forEach(([placeholder, id]) => {
      console.log(`   ${placeholder} → ${id}`);
    });
  }
  
  if (missing.length > 0) {
    console.log('\n❌ Missing Products (need manual replacement):');
    missing.forEach(([placeholder]) => {
      console.log(`   ${placeholder}`);
    });
    
    console.log('\n💡 To find missing products manually:');
    console.log('   1. Check your Firestore console');
    console.log('   2. Browse the "tailor_works" collection');
    console.log('   3. Search for products by title/name');
    console.log('   4. Replace the placeholder IDs in the configuration file');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 BOGO Product ID Finder');
  console.log('========================\n');
  
  try {
    // Find all product IDs
    const productIds = await findAllProductIds();
    
    // Update configuration file
    updateConfigurationFile(productIds);
    
    // Display summary
    displaySummary(productIds);
    
    console.log('\n🎉 Process completed!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Review the updated configuration file');
    console.log('   2. Manually replace any remaining placeholder IDs');
    console.log('   3. Test the BOGO mappings with real product data');
    console.log('   4. Deploy the configuration to production');
    
  } catch (error) {
    console.error('💥 Process failed:', error);
    
    if (error instanceof Error && error.message.includes('Firebase')) {
      console.log('\n💡 Firebase Connection Tips:');
      console.log('   - Ensure your .env.local file has the correct Firebase config');
      console.log('   - Check that your Firebase project is accessible');
      console.log('   - Verify your service account permissions');
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { main as findAndUpdateBogoProductIds };