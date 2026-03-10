#!/usr/bin/env node

/**
 * Script to update all Firebase collection references to use "staging_" prefix
 * This will systematically replace collection names throughout the codebase
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Collection names to update (without staging_ prefix)
const COLLECTIONS_TO_UPDATE = [
  'tailors',
  'tailors_local', 
  'tailor_works',
  'tailor_works_local',
  'template_library',
  'templates',
  'user_credentials',
  'user_profiles',
  'user_session_analytics',
  'user_sessions',
  'users',
  'users_local',
  'WishlistItems',
  'users_addresses',
  'users_cart_items',
  'users_measurements',
  'users_orders',
  'users_viewed_items',
  'users_wishlist_items',
  'vendor_analytics',
  'vendor_pre_registrations',
  'vendor_stats',
  'vendor_visits',
  'vvip_audit_log',
  'vvip_audit_logs',
  'vvip_shoppers',
  'waiting_list',
  'web_hits',
  'web_signUp',
  'wishlists',
  'orders',
  'product_views',
  'product_analytics',
  'referrals',
  'referralUsers',
  'referralTransactions',
  'referralPurchases',
  'free_gift_claims',
  'shop_activities',
  'ai_assistant_sessions',
  'ai_assistant_interactions',
  'ai_assistant_conversions',
  'marketing_users',
  'collectionsUsers',
  'collectionsInvitations',
  'collection_waitlists',
  'waitlist_subscriptions',
  'waitlist_analytics_events',
  'waitlist_analytics_counters',
  'searches',
  'app_installs',
  'storefronts',
  'storefront_themes',
  'payouts',
  'returns',
  'hierarchical_influencers',
  'hierarchical_admins'
];

// File patterns to search
const FILE_PATTERNS = [
  '**/*.ts',
  '**/*.tsx', 
  '**/*.js',
  '**/*.jsx'
];

// Directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  '.next/**',
  'out/**',
  'scripts/update-collection-names.ts' // Don't update this script itself
];

interface UpdateResult {
  file: string;
  changes: number;
  collections: string[];
}

class CollectionUpdater {
  private results: UpdateResult[] = [];
  private totalChanges = 0;

  async updateAllFiles(): Promise<void> {
    console.log('🚀 Starting collection name updates...');
    console.log(`📋 Collections to update: ${COLLECTIONS_TO_UPDATE.length}`);
    console.log(`🔍 Searching for files...`);

    // Find all files to process
    const files = await this.findFiles();
    console.log(`📄 Found ${files.length} files to process`);

    // Process each file
    for (const file of files) {
      await this.updateFile(file);
    }

    this.printSummary();
  }

  private async findFiles(): Promise<string[]> {
    const allFiles: string[] = [];
    
    for (const pattern of FILE_PATTERNS) {
      const files = await glob(pattern, {
        ignore: EXCLUDE_PATTERNS,
        cwd: process.cwd()
      });
      allFiles.push(...files);
    }

    // Remove duplicates and sort
    return [...new Set(allFiles)].sort();
  }

  private async updateFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.resolve(filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      let updatedContent = content;
      const changedCollections: string[] = [];
      let fileChanges = 0;

      // Update each collection reference
      for (const collection of COLLECTIONS_TO_UPDATE) {
        const patterns = this.getReplacementPatterns(collection);
        
        for (const { pattern, replacement } of patterns) {
          const regex = new RegExp(pattern, 'g');
          const matches = updatedContent.match(regex);
          
          if (matches) {
            updatedContent = updatedContent.replace(regex, replacement);
            fileChanges += matches.length;
            
            if (!changedCollections.includes(collection)) {
              changedCollections.push(collection);
            }
          }
        }
      }

      // Write updated content if changes were made
      if (fileChanges > 0) {
        fs.writeFileSync(fullPath, updatedContent, 'utf8');
        
        this.results.push({
          file: filePath,
          changes: fileChanges,
          collections: changedCollections
        });
        
        this.totalChanges += fileChanges;
        console.log(`✅ ${filePath}: ${fileChanges} changes (${changedCollections.join(', ')})`);
      }

    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
    }
  }

  private getReplacementPatterns(collection: string): Array<{ pattern: string; replacement: string }> {
    const stagingCollection = `staging_${collection}`;
    
    return [
      // Client-side Firestore: collection(db, "collection_name")
      {
        pattern: `collection\\(([^,]+),\\s*["']${collection}["']\\)`,
        replacement: `collection($1, "${stagingCollection}")`
      },
      
      // Admin SDK: adminDb.collection("collection_name")
      {
        pattern: `adminDb\\.collection\\(["']${collection}["']\\)`,
        replacement: `adminDb.collection("${stagingCollection}")`
      },
      
      // Admin SDK: db.collection("collection_name")
      {
        pattern: `\\bdb\\.collection\\(["']${collection}["']\\)`,
        replacement: `db.collection("${stagingCollection}")`
      },
      
      // Firebase v8 style: firebase.firestore().collection("collection_name")
      {
        pattern: `\\.collection\\(["']${collection}["']\\)`,
        replacement: `.collection("${stagingCollection}")`
      },
      
      // String literals in COLLECTIONS constants
      {
        pattern: `["']${collection}["'](?=\\s*[,;\\}\\]])`,
        replacement: `"${stagingCollection}"`
      },
      
      // Collection references in doc paths
      {
        pattern: `doc\\(([^,]+),\\s*["']${collection}["']`,
        replacement: `doc($1, "${stagingCollection}"`
      }
    ];
  }

  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COLLECTION UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Files updated: ${this.results.length}`);
    console.log(`🔄 Total changes: ${this.totalChanges}`);
    
    if (this.results.length > 0) {
      console.log('\n📋 Updated files:');
      this.results.forEach(result => {
        console.log(`   ${result.file} (${result.changes} changes)`);
      });
      
      // Show collection usage statistics
      const collectionStats: { [key: string]: number } = {};
      this.results.forEach(result => {
        result.collections.forEach(collection => {
          collectionStats[collection] = (collectionStats[collection] || 0) + 1;
        });
      });
      
      console.log('\n📈 Collection usage:');
      Object.entries(collectionStats)
        .sort(([,a], [,b]) => b - a)
        .forEach(([collection, count]) => {
          console.log(`   ${collection}: ${count} files`);
        });
    }
    
    console.log('\n🎉 Collection name updates completed!');
    console.log('⚠️  Please review the changes and test your application.');
  }
}

// Run the updater
async function main() {
  const updater = new CollectionUpdater();
  await updater.updateAllFiles();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

export { CollectionUpdater };