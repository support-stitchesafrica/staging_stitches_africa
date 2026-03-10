/**
 * Test Script for Atlas and Collections Invitation Flow
 * 
 * This script helps test the invitation flow locally by:
 * 1. Creating test invitations
 * 2. Generating invitation URLs
 * 3. Validating tokens
 * 
 * Run with: npx tsx scripts/test-invitation-flow.ts
 * Or: node --env-file=.env -r tsx/cjs scripts/test-invitation-flow.ts
 */

import { AtlasInvitationService } from '../lib/atlas/invitation-service';
import { CollectionsInvitationService } from '../lib/collections/invitation-service';
import { validateInvitationToken } from '../lib/utils/token-validator';

// Test configuration
const TEST_CONFIG = {
  // Use your local development URL
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  
  // Test user data
  ATLAS_TEST_EMAIL: 'test@stitchesafrica.com', // Must be from authorized domain
  ATLAS_TEST_NAME: 'Test Atlas User',
  ATLAS_TEST_ROLE: 'admin' as const,
  ATLAS_INVITED_BY: 'test-admin-uid', // Replace with actual admin UID if needed
  
  COLLECTIONS_TEST_EMAIL: 'test-collections@example.com',
  COLLECTIONS_TEST_NAME: 'Test Collections User',
  COLLECTIONS_TEST_ROLE: 'editor' as const,
  COLLECTIONS_INVITED_BY: 'test-admin-uid', // Replace with actual admin UID if needed
};

/**
 * Print colored output
 */
function printSection(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70) + '\n');
}

function printSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function printError(message: string) {
  console.log(`❌ ${message}`);
}

function printInfo(message: string) {
  console.log(`ℹ️  ${message}`);
}

function printUrl(label: string, url: string) {
  console.log(`\n🔗 ${label}:`);
  console.log(`   ${url}`);
}

/**
 * Test Atlas Invitation Flow
 */
async function testAtlasInvitation() {
  printSection('Testing Atlas Invitation Flow');
  
  try {
    // Step 1: Create invitation
    printInfo('Creating Atlas invitation...');
    const invitation = await AtlasInvitationService.createInvitation({
      email: TEST_CONFIG.ATLAS_TEST_EMAIL,
      name: TEST_CONFIG.ATLAS_TEST_NAME,
      role: TEST_CONFIG.ATLAS_TEST_ROLE,
      invitedByUserId: TEST_CONFIG.ATLAS_INVITED_BY,
    });
    
    printSuccess('Atlas invitation created successfully!');
    console.log(`   Invitation ID: ${invitation.id}`);
    console.log(`   Email: ${invitation.email}`);
    console.log(`   Role: ${invitation.role}`);
    console.log(`   Status: ${invitation.status}`);
    console.log(`   Expires At: ${invitation.expiresAt.toDate().toISOString()}`);
    
    // Step 2: Generate invitation URL
    const invitationUrl = `${TEST_CONFIG.BASE_URL}/atlas/invite/${encodeURIComponent(invitation.token)}`;
    printUrl('Atlas Invitation URL', invitationUrl);
    
    // Step 3: Validate token
    printInfo('Validating invitation token...');
    const validation = await AtlasInvitationService.validateInvitation(invitation.token);
    
    if (validation.isValid && validation.invitation) {
      printSuccess('Token validation successful!');
      console.log(`   Email: ${validation.invitation.email}`);
      console.log(`   Role: ${validation.invitation.role}`);
      console.log(`   Status: ${validation.invitation.status}`);
    } else {
      printError(`Token validation failed: ${validation.error}`);
    }
    
    // Step 4: Test token validation utility directly
    printInfo('Testing centralized token validator...');
    const tokenValidation = validateInvitationToken(invitation.token, 'atlas');
    
    if (tokenValidation.success && tokenValidation.payload) {
      printSuccess('Centralized token validator working!');
      console.log(`   Invite ID: ${tokenValidation.payload.inviteId}`);
      console.log(`   Email: ${tokenValidation.payload.email}`);
      console.log(`   Role: ${tokenValidation.payload.role}`);
      console.log(`   System: ${tokenValidation.payload.system}`);
    } else {
      printError(`Token validation failed: ${tokenValidation.error}`);
    }
    
    return { success: true, invitation, url: invitationUrl };
  } catch (error: any) {
    printError(`Atlas invitation test failed: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

/**
 * Test Collections Invitation Flow
 */
async function testCollectionsInvitation() {
  printSection('Testing Collections Invitation Flow');
  
  try {
    // Step 1: Create invitation
    printInfo('Creating Collections invitation...');
    const invitation = await CollectionsInvitationService.createInvitation({
      email: TEST_CONFIG.COLLECTIONS_TEST_EMAIL,
      name: TEST_CONFIG.COLLECTIONS_TEST_NAME,
      role: TEST_CONFIG.COLLECTIONS_TEST_ROLE,
      invitedByUserId: TEST_CONFIG.COLLECTIONS_INVITED_BY,
    });
    
    printSuccess('Collections invitation created successfully!');
    console.log(`   Invitation ID: ${invitation.id}`);
    console.log(`   Email: ${invitation.email}`);
    console.log(`   Role: ${invitation.role}`);
    console.log(`   Status: ${invitation.status}`);
    console.log(`   Expires At: ${invitation.expiresAt.toDate().toISOString()}`);
    
    // Step 2: Generate invitation URL
    const invitationUrl = `${TEST_CONFIG.BASE_URL}/collections/invite/${encodeURIComponent(invitation.token)}`;
    printUrl('Collections Invitation URL', invitationUrl);
    
    // Step 3: Validate token
    printInfo('Validating invitation token...');
    const validation = await CollectionsInvitationService.validateInvitation(invitation.token);
    
    if (validation.isValid && validation.invitation) {
      printSuccess('Token validation successful!');
      console.log(`   Email: ${validation.invitation.email}`);
      console.log(`   Role: ${validation.invitation.role}`);
      console.log(`   Status: ${validation.invitation.status}`);
    } else {
      printError(`Token validation failed: ${validation.error}`);
    }
    
    // Step 4: Test token validation utility directly
    printInfo('Testing centralized token validator...');
    const tokenValidation = validateInvitationToken(invitation.token, 'collections');
    
    if (tokenValidation.success && tokenValidation.payload) {
      printSuccess('Centralized token validator working!');
      console.log(`   Invite ID: ${tokenValidation.payload.inviteId}`);
      console.log(`   Email: ${tokenValidation.payload.email}`);
      console.log(`   Role: ${tokenValidation.payload.role}`);
      console.log(`   System: ${tokenValidation.payload.system}`);
    } else {
      printError(`Token validation failed: ${tokenValidation.error}`);
    }
    
    return { success: true, invitation, url: invitationUrl };
  } catch (error: any) {
    printError(`Collections invitation test failed: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

/**
 * Test URL encoding/decoding
 */
function testUrlEncoding(token: string) {
  printSection('Testing URL Encoding/Decoding');
  
  const encoded = encodeURIComponent(token);
  const decoded = decodeURIComponent(encoded);
  
  printInfo('Original token:');
  console.log(`   ${token.substring(0, 50)}...`);
  
  printInfo('Encoded token:');
  console.log(`   ${encoded.substring(0, 50)}...`);
  
  printInfo('Decoded token:');
  console.log(`   ${decoded.substring(0, 50)}...`);
  
  if (token === decoded) {
    printSuccess('URL encoding/decoding working correctly!');
  } else {
    printError('URL encoding/decoding mismatch!');
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('\n🧪 Atlas & Collections Invitation Flow Test Script');
  console.log('='.repeat(70));
  console.log('\nThis script will:');
  console.log('  1. Create test invitations for Atlas and Collections');
  console.log('  2. Generate invitation URLs');
  console.log('  3. Validate tokens');
  console.log('  4. Test URL encoding/decoding');
  console.log('\n⚠️  Note: Make sure your Firebase is configured and the app is running!');
  console.log(`   Base URL: ${TEST_CONFIG.BASE_URL}\n`);
  
  const results = {
    atlas: null as any,
    collections: null as any,
  };
  
  // Test Atlas
  results.atlas = await testAtlasInvitation();
  
  // Test Collections
  results.collections = await testCollectionsInvitation();
  
  // Test URL encoding if we have a token
  if (results.atlas?.invitation?.token) {
    testUrlEncoding(results.atlas.invitation.token);
  }
  
  // Summary
  printSection('Test Summary');
  
  if (results.atlas?.success) {
    printSuccess('Atlas invitation flow: PASSED');
    printUrl('Atlas Test URL', results.atlas.url);
  } else {
    printError(`Atlas invitation flow: FAILED - ${results.atlas?.error || 'Unknown error'}`);
  }
  
  if (results.collections?.success) {
    printSuccess('Collections invitation flow: PASSED');
    printUrl('Collections Test URL', results.collections.url);
  } else {
    printError(`Collections invitation flow: FAILED - ${results.collections?.error || 'Unknown error'}`);
  }
  
  // Instructions
  printSection('Next Steps - Manual Testing');
  console.log('To test the full invitation flow manually:');
  console.log('\n1. Make sure your Next.js dev server is running:');
  console.log('   npm run dev');
  console.log('\n2. Open one of the invitation URLs above in your browser');
  console.log('\n3. Test scenarios:');
  console.log('   a) New user (email not in Firebase):');
  console.log('      - Should show create account form');
  console.log('      - Enter password and name');
  console.log('      - Should successfully create account and accept invitation');
  console.log('\n   b) Existing user (email already in Firebase):');
  console.log('      - Should show login form');
  console.log('      - Enter password');
  console.log('      - Should successfully log in and accept invitation');
  console.log('\n4. Check browser console and server logs for any errors');
  console.log('\n5. Verify in Firestore that:');
  console.log('   - Invitation status changed to "accepted"');
  console.log('   - User profile was created/updated with correct role');
  console.log('\n6. Test edge cases:');
  console.log('   - Expired token (wait 7+ days or manually expire)');
  console.log('   - Already accepted invitation');
  console.log('   - Invalid/malformed token');
  console.log('\n');
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

