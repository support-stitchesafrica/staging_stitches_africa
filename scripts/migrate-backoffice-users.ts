/**
 * Migration Script for Unified Back Office System
 * Migrates users from legacy systems to unified backoffice_users collection
 * 
 * Usage:
 *   npm run migrate-backoffice -- --system=marketing
 *   npm run migrate-backoffice -- --system=all
 *   npm run migrate-backoffice -- --system=marketing --dry-run
 *   npm run migrate-backoffice -- --help
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { MigrationService, LegacySystem } from '@/lib/backoffice/migration-service';
import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
function parseArgs(): {
  system?: LegacySystem | 'all';
  dryRun: boolean;
  skipIfExists: boolean;
  batchSize: number;
  help: boolean;
  report: boolean;
} {
  const args = process.argv.slice(2);
  const options = {
    system: undefined as LegacySystem | 'all' | undefined,
    dryRun: false,
    skipIfExists: true,
    batchSize: 100,
    help: false,
    report: true,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--system=')) {
      const system = arg.split('=')[1];
      if (system === 'all' || ['atlas', 'promotional', 'collections', 'marketing', 'admin'].includes(system)) {
        options.system = system as LegacySystem | 'all';
      } else {
        console.error(`Invalid system: ${system}`);
        console.error('Valid systems: atlas, promotional, collections, marketing, admin, all');
        process.exit(1);
      }
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.skipIfExists = false;
    } else if (arg.startsWith('--batch-size=')) {
      const size = parseInt(arg.split('=')[1], 10);
      if (isNaN(size) || size < 1) {
        console.error('Invalid batch size. Must be a positive integer.');
        process.exit(1);
      }
      options.batchSize = size;
    } else if (arg === '--no-report') {
      options.report = false;
    }
  }

  return options;
}

// Display help message
function displayHelp() {
  console.log(`
Unified Back Office Migration Script
=====================================

Migrates users from legacy systems to the unified backoffice_users collection.

USAGE:
  npm run migrate-backoffice -- [OPTIONS]

OPTIONS:
  --system=<system>    Specify which system to migrate from
                       Valid values: atlas, promotional, collections, marketing, admin, all
                       Required unless --help is specified

  --dry-run           Run migration without making any changes
                       Useful for testing and validation

  --force             Force migration even if user already exists
                       By default, existing users are skipped

  --batch-size=<n>    Number of users to process in each batch
                       Default: 100

  --no-report         Don't generate a migration report file

  --help, -h          Display this help message

EXAMPLES:
  # Migrate users from marketing system
  npm run migrate-backoffice -- --system=marketing

  # Dry run for all systems
  npm run migrate-backoffice -- --system=all --dry-run

  # Migrate atlas users with custom batch size
  npm run migrate-backoffice -- --system=atlas --batch-size=50

  # Force migration (overwrite existing users)
  npm run migrate-backoffice -- --system=marketing --force

ROLE MAPPING:
  Legacy Role          → Unified Role
  ─────────────────────────────────────
  superadmin          → superadmin
  founder             → founder
  sales_lead          → bdm (merged)
  brand_lead          → brand_lead
  logistics_lead      → logistics_lead
  super_admin         → superadmin
  team_lead           → marketing_manager
  bdm                 → bdm
  team_member         → marketing_member
  admin               → admin
  editor              → editor
  viewer              → viewer

NOTES:
  - Users are skipped by default if they already exist in the unified system
  - Use --force to overwrite existing users
  - Migration preserves user permissions and access levels
  - A detailed report is generated after migration
  - Failed migrations are logged but don't stop the process
`);
}

// Save migration report to file
function saveMigrationReport(report: string, system: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `migration-report-${system}-${timestamp}.txt`;
  const reportsDir = path.join(process.cwd(), 'migration-reports');

  // Create reports directory if it doesn't exist
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filepath = path.join(reportsDir, filename);
  fs.writeFileSync(filepath, report, 'utf-8');

  console.log(`\nMigration report saved to: ${filepath}`);
}

// Main migration function
async function main() {
  const options = parseArgs();

  // Display help if requested
  if (options.help) {
    displayHelp();
    process.exit(0);
  }

  // Validate system is specified
  if (!options.system) {
    console.error('Error: --system option is required');
    console.error('Run with --help for usage information');
    process.exit(1);
  }

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     UNIFIED BACK OFFICE MIGRATION SCRIPT                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Display configuration
  console.log('Configuration:');
  console.log(`  System: ${options.system}`);
  console.log(`  Dry Run: ${options.dryRun ? 'YES' : 'NO'}`);
  console.log(`  Skip Existing: ${options.skipIfExists ? 'YES' : 'NO'}`);
  console.log(`  Batch Size: ${options.batchSize}`);
  console.log(`  Generate Report: ${options.report ? 'YES' : 'NO'}`);
  console.log('');

  if (options.dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made to the database');
    console.log('');
  }

  try {
    // Validate migration readiness
    if (options.system !== 'all') {
      console.log(`Validating migration readiness for ${options.system}...`);
      const validation = await MigrationService.validateMigrationReadiness(options.system);
      
      if (!validation.ready) {
        console.error('\n❌ Migration validation failed:');
        validation.issues.forEach(issue => console.error(`  - ${issue}`));
        process.exit(1);
      }
      
      console.log('✓ Migration validation passed');
      console.log('');
    }

    // Perform migration
    let summaries: Record<string, any>;

    if (options.system === 'all') {
      console.log('Starting migration for ALL systems...');
      console.log('');
      
      summaries = await MigrationService.migrateAllSystems({
        dryRun: options.dryRun,
        skipIfExists: options.skipIfExists,
        batchSize: options.batchSize,
      });
    } else {
      console.log(`Starting migration for ${options.system} system...`);
      console.log('');
      
      const summary = await MigrationService.migrateAllUsers(options.system, {
        dryRun: options.dryRun,
        skipIfExists: options.skipIfExists,
        batchSize: options.batchSize,
      });
      
      summaries = { [options.system]: summary };
    }

    // Generate and display reports
    if (options.report) {
      console.log('\n');
      console.log('═'.repeat(60));
      console.log('GENERATING MIGRATION REPORTS');
      console.log('═'.repeat(60));
      console.log('');

      for (const [system, summary] of Object.entries(summaries)) {
        const report = MigrationService.generateMigrationReport(summary);
        console.log(report);
        
        if (!options.dryRun) {
          saveMigrationReport(report, system);
        }
      }
    }

    // Final summary
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     MIGRATION COMPLETED                                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    if (options.dryRun) {
      console.log('✓ Dry run completed successfully');
      console.log('  Run without --dry-run to perform actual migration');
    } else {
      console.log('✓ Migration completed successfully');
      console.log('  All users have been migrated to the unified system');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n');
    console.error('╔════════════════════════════════════════════════════════════╗');
    console.error('║     MIGRATION FAILED                                       ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the migration
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
