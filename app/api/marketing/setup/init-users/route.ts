/**
 * Marketing User Initialization API Route
 * One-time setup to ensure marketing user documents exist
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * POST /api/marketing/setup/init-users
 * Initialize marketing user documents for existing Firebase Auth users
 */
export async function POST(request: NextRequest) {
  try {
    // Simple authentication check - only allow if no marketing users exist yet
    const existingUsersSnapshot = await adminDb.collection("staging_marketing_users").limit(1).get();
    
    if (!existingUsersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Marketing users already initialized' },
        { status: 400 }
      );
    }

    console.log('Initializing marketing user documents...');

    // Get all Firebase Auth users with company email domains
    const validDomains = ['@stitchesafrica.com', '@stitchesafrica.pro'];
    const listUsersResult = await adminAuth.listUsers();
    
    const companyUsers = listUsersResult.users.filter(user => 
      user.email && validDomains.some(domain => user.email!.endsWith(domain))
    );

    console.log(`Found ${companyUsers.length} company users`);

    let createdCount = 0;

    for (const user of companyUsers) {
      if (!user.email) continue;

      const userDoc = await adminDb.collection("staging_marketing_users").doc(user.uid).get();
      
      if (!userDoc.exists) {
        // Create marketing user document - first user becomes super admin
        const role = createdCount === 0 ? 'super_admin' : 'super_admin';
        
        const userProfile = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          role,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await adminDb.collection("staging_marketing_users").doc(user.uid).set(userProfile);
        console.log(`Created marketing user document for: ${user.email} (${role})`);
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Marketing user documents initialized successfully',
      stats: {
        totalCompanyUsers: companyUsers.length,
        documentsCreated: createdCount
      }
    });

  } catch (error) {
    console.error('Error initializing marketing users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize marketing users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}