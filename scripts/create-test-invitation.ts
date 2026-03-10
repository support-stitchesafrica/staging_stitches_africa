/**
 * Quick Script to Create a Single Test Invitation
 * 
 * Usage:
 *   npx tsx scripts/create-test-invitation.ts atlas test@stitchesafrica.com admin
 *   npx tsx scripts/create-test-invitation.ts collections test@example.com editor
 */

import { AtlasInvitationService } from '../lib/atlas/invitation-service';
import { CollectionsInvitationService } from '../lib/collections/invitation-service';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function createTestInvitation() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: npx tsx scripts/create-test-invitation.ts <system> <email> <role> [name]');
    console.error('');
    console.error('Examples:');
    console.error('  npx tsx scripts/create-test-invitation.ts atlas test@stitchesafrica.com admin');
    console.error('  npx tsx scripts/create-test-invitation.ts collections test@example.com editor "Test User"');
    console.error('');
    console.error('Systems: atlas, collections');
    console.error('Atlas roles: admin, editor, viewer');
    console.error('Collections roles: superadmin, editor, viewer');
    console.error('');
    console.error('Note: Atlas requires email from authorized domain (@stitchesafrica.com or @stitchesafrica.pro)');
    process.exit(1);
  }
  
  const [system, email, role, name] = args;
  
  if (system !== 'atlas' && system !== 'collections') {
    console.error(`❌ Invalid system: ${system}. Must be 'atlas' or 'collections'`);
    process.exit(1);
  }
  
  try {
    console.log(`\n📧 Creating ${system} invitation...`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: ${role}`);
    console.log(`   Name: ${name || email.split('@')[0]}\n`);
    
    let invitation;
    let invitationUrl;
    
    if (system === 'atlas') {
      invitation = await AtlasInvitationService.createInvitation({
        email,
        name: name || email.split('@')[0],
        role: role as any,
        invitedByUserId: 'test-admin-uid',
      });
      invitationUrl = `${BASE_URL}/atlas/invite/${encodeURIComponent(invitation.token)}`;
    } else {
      invitation = await CollectionsInvitationService.createInvitation({
        email,
        name: name || email.split('@')[0],
        role: role as any,
        invitedByUserId: 'test-admin-uid',
      });
      invitationUrl = `${BASE_URL}/collections/invite/${encodeURIComponent(invitation.token)}`;
    }
    
    console.log('✅ Invitation created successfully!\n');
    console.log('📋 Invitation Details:');
    console.log(`   ID: ${invitation.id}`);
    console.log(`   Email: ${invitation.email}`);
    console.log(`   Name: ${invitation.name}`);
    console.log(`   Role: ${invitation.role}`);
    console.log(`   Status: ${invitation.status}`);
    console.log(`   Expires: ${invitation.expiresAt.toDate().toISOString()}`);
    console.log(`\n🔗 Invitation URL:`);
    console.log(`   ${invitationUrl}\n`);
    console.log('💡 Copy the URL above and open it in your browser to test the invitation flow.\n');
    
  } catch (error: any) {
    console.error(`\n❌ Failed to create invitation: ${error.message}\n`);
    if (error.message.includes('domain')) {
      console.error('💡 For Atlas, email must be from an authorized domain:');
      console.error('   - @stitchesafrica.com');
      console.error('   - @stitchesafrica.pro\n');
    }
    process.exit(1);
  }
}

createTestInvitation();

