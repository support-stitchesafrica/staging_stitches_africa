/**
 * Script to fix user roles for marketing dashboard
 * This script can be used to assign proper roles to users who are getting permission errors
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { config } from '../firebase';

// Initialize Firebase
const app = initializeApp(config);
const db = getFirestore(app);

interface UserRole {
  role: 'super_admin' | 'team_lead' | 'bdm' | 'team_member';
  teamId?: string;
}

/**
 * Fix user role to allow access to sections and team management features
 * @param userId - The user ID to fix
 * @param newRole - The new role to assign
 * @param teamId - Optional team ID to assign the user to
 */
export async function fixUserRole(userId: string, newRole: UserRole['role'], teamId?: string): Promise<void> {
  try {
    const userRef = doc(db, 'marketing_users', userId);
    
    const updateData: any = {
      role: newRole,
      updatedAt: new Date()
    };
    
    // If teamId is provided, assign the user to that team
    if (teamId) {
      updateData.teamId = teamId;
    }
    
    await updateDoc(userRef, updateData);
    
    console.log(`Successfully updated user ${userId} to role: ${newRole}${teamId ? ` and team: ${teamId}` : ''}`);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

/**
 * Assign user as team lead for a specific team
 * @param userId - The user ID to make a team lead
 * @param teamId - The team ID to lead
 */
export async function assignTeamLead(userId: string, teamId: string): Promise<void> {
  try {
    await fixUserRole(userId, 'team_lead', teamId);
    console.log(`User ${userId} is now team lead for team ${teamId}`);
  } catch (error) {
    console.error('Error assigning team lead:', error);
    throw error;
  }
}

// Example usage:
// fixUserRole('jl4SjJhgpNW6WhxVlmLgxJgJssV2', 'team_lead');
// assignTeamLead('jl4SjJhgpNW6WhxVlmLgxJgJssV2', 'team-id-here');

// To run this script:
// 1. Save it as a .ts file
// 2. Run with ts-node: npx ts-node fix-user-role.ts
// 3. Or compile and run: tsc fix-user-role.ts && node fix-user-role.js