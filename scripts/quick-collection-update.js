#!/usr/bin/env node

/**
 * Quick script to update collection references to staging_ prefix
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Collection mappings
const COLLECTION_MAPPINGS = {
  'users': 'staging_users',
  'tailors': 'staging_tailors',
  'tailors_local': 'staging_tailors_local',
  'tailor_works': 'staging_tailor_works',
  'tailor_works_local': 'staging_tailor_works_local',
  'user_session_analytics': 'staging_user_session_analytics',
  'user_sessions': 'staging_user_sessions',
  'users_orders': 'staging_users_orders',
  'users_addresses': 'staging_users_addresses',
  'users_cart_items': 'staging_users_cart_items',
  'users_measurements': 'staging_users_measurements',
  'users_viewed_items': 'staging_users_viewed_items',
  'users_wishlist_items': 'staging_users_wishlist_items',
  'vendor_analytics': 'staging_vendor_analytics',
  'vendor_visits': 'staging_vendor_visits',
  'vendor_stats': 'staging_vendor_stats',
  'vendor_pre_registrations': 'staging_vendor_pre_registrations',
  'product_views': 'staging_product_views',
  'product_analytics': 'staging_product_analytics',
  'referrals': 'staging_referrals',
  'referralUsers': 'staging_referralUsers',
  'referralTransactions': 'staging_referralTransactions',
  'referralPurchases': 'staging_referralPurchases',
  'free_gift_claims': 'staging_free_gift_claims',
  'shop_activities': 'staging_shop_activities',
  'ai_assistant_sessions': 'staging_ai_assistant_sessions',
  'ai_assistant_interactions': 'staging_ai_assistant_interactions',
  'ai_assistant_conversions': 'staging_ai_assistant_conversions',
  'marketing_users': 'staging_marketing_users',
  'collectionsUsers': 'staging_collectionsUsers',
  'web_hits': 'staging_web_hits',
  'web_signUp': 'staging_web_signUp',
  'wishlists': 'staging_wishlists',
  'WishlistItems': 'staging_WishlistItems',
  'vvip_shoppers': 'staging_vvip_shoppers',
  'vvip_audit_log': 'staging_vvip_audit_log',
  'vvip_audit_logs': 'staging_vvip_audit_logs',
  'waiting_list': 'staging_waiting_list',
  'templates': 'staging_templates',
  'template_library': 'staging_template_library',
  'user_credentials': 'staging_user_credentials',
  'user_profiles': 'staging_user_profiles',
  'orders': 'staging_orders',
  'returns': 'staging_returns',
  'searches': 'staging_searches',
  'app_installs': 'staging_app_installs',
  'storefronts': 'staging_storefronts',
  'storefront_themes': 'staging_storefront_themes',
  'payouts': 'staging_payouts'
};

// Files to process
const FILE_PATTERNS = [
  'services/**/*.ts',
  'vendor-services/**/*.ts',
  'agent-services/**/*.ts',
  'lib/**/*.ts',
  'app/**/*.ts',
  'components/**/*.ts',
  'hooks/**/*.ts'
];

const EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  '.next/**',
  'out/**',
  'scripts/**'
];

async function updateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let changes = 0;

    // Update collection references
    for (const [oldCollection, newCollection] of Object.entries(COLLECTION_MAPPINGS)) {
      // Skip if already has staging_ prefix
      if (oldCollection.startsWith('staging_')) continue;

      // Pattern 1: collection(db, "collection_name")
      const pattern1 = new RegExp(`collection\\(([^,]+),\\s*["']${oldCollection}["']\\)`, 'g');
      const replacement1 = `collection($1, "${newCollection}")`;
      const matches1 = updatedContent.match(pattern1);
      if (matches1) {
        updatedContent = updatedContent.replace(pattern1, replacement1);
        changes += matches1.length;
      }

      // Pattern 2: adminDb.collection("collection_name")
      const pattern2 = new RegExp(`adminDb\\.collection\\(["']${oldCollection}["']\\)`, 'g');
      const replacement2 = `adminDb.collection("${newCollection}")`;
      const matches2 = updatedContent.match(pattern2);
      if (matches2) {
        updatedContent = updatedContent.replace(pattern2, replacement2);
        changes += matches2.length;
      }

      // Pattern 3: db.collection("collection_name")
      const pattern3 = new RegExp(`\\bdb\\.collection\\(["']${oldCollection}["']\\)`, 'g');
      const replacement3 = `db.collection("${newCollection}")`;
      const matches3 = updatedContent.match(pattern3);
      if (matches3) {
        updatedContent = updatedContent.replace(pattern3, replacement3);
        changes += matches3.length;
      }

      // Pattern 4: doc(db, "collection_name", ...)
      const pattern4 = new RegExp(`doc\\(([^,]+),\\s*["']${oldCollection}["']`, 'g');
      const replacement4 = `doc($1, "${newCollection}"`;
      const matches4 = updatedContent.match(pattern4);
      if (matches4) {
        updatedContent = updatedContent.replace(pattern4, replacement4);
        changes += matches4.length;
      }
    }

    // Write updated content if changes were made
    if (changes > 0) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ ${filePath}: ${changes} changes`);
      return changes;
    }

    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🚀 Starting quick collection updates...');
  
  let totalChanges = 0;
  let filesUpdated = 0;

  // Process each file pattern
  for (const pattern of FILE_PATTERNS) {
    const files = await glob(pattern, {
      ignore: EXCLUDE_PATTERNS,
      cwd: process.cwd()
    });

    for (const file of files) {
      const changes = await updateFile(file);
      if (changes > 0) {
        totalChanges += changes;
        filesUpdated++;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 UPDATE SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Files updated: ${filesUpdated}`);
  console.log(`🔄 Total changes: ${totalChanges}`);
  console.log('\n🎉 Collection updates completed!');
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});