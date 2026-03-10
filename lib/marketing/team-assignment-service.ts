/**
 * Team Assignment and Vendor Transfer Service
 * Handles team management and vendor assignment operations
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import { UserService, type User } from './user-service';
import { getTailorById } from '@/admin-services/useTailors';
import { MarketingEmailService } from './email-service';

// Import admin SDK for server-side operations
import { adminDb } from '@/lib/firebase-admin';

// Team Types
export interface Team {
  id: string;
  name: string;
  leadUserId: string;
  memberUserIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  description?: string;
}

export interface CreateTeamData {
  name: string;
  leadUserId: string;
  description?: string;
}

export interface VendorAssignment {
  id: string;
  vendorId: string;
  assignedToUserId: string;
  assignedByUserId: string;
  teamId?: string;
  assignmentDate: Timestamp;
  status: 'active' | 'transferred' | 'completed';
  notes?: string;
}

export interface CreateVendorAssignmentData {
  vendorId: string;
  assignedToUserId: string;
  assignedByUserId: string;
  teamId?: string;
  notes?: string;
}

export interface VendorTransferData {
  fromUserId: string;
  toUserId: string;
  transferredByUserId: string;
  reason?: string;
}

// Team Assignment Service Class
export class TeamAssignmentService {
  private static readonly TEAMS_COLLECTION = 'marketing_teams';
  private static readonly ASSIGNMENTS_COLLECTION = 'vendor_assignments';

  /**
   * Create a new team
   */
  static async createTeam(teamData: CreateTeamData): Promise<Team> {
    try {
      // Validate team lead exists and has appropriate role
      const teamLead = await UserService.getUserById(teamData.leadUserId);
      if (!teamLead) {
        throw new Error('Team lead user not found');
      }

      if (!['team_lead', 'super_admin'].includes(teamLead.role)) {
        throw new Error('User must be a Team Lead or Super Admin to lead a team');
      }

      const now = Timestamp.now();
      const team = {
        ...teamData,
        memberUserIds: [],
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.TEAMS_COLLECTION), team);
      
      return {
        id: docRef.id,
        ...team
      };
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error('Failed to create team');
    }
  }

  /**
   * Get team by ID
   */
  static async getTeamById(teamId: string): Promise<Team | null> {
    try {
      const docRef = doc(db, this.TEAMS_COLLECTION, teamId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Team;
    } catch (error) {
      console.error('Error getting team by ID:', error);
      throw new Error('Failed to retrieve team');
    }
  }

  /**
   * Get team by ID - SERVER SIDE VERSION
   */
  static async getTeamByIdServerSide(teamId: string): Promise<Team | null> {
    try {
      const doc = await adminDb.collection(this.TEAMS_COLLECTION).doc(teamId).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...(doc.data() as any)
      } as Team;
    } catch (error) {
      console.error('Error getting team by ID (server-side):', error);
      throw new Error('Failed to retrieve team');
    }
  }

  /**
   * Get all teams
   */
  static async getAllTeams(): Promise<Team[]> {
    try {
      const q = query(
        collection(db, this.TEAMS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[];
    } catch (error) {
      console.error('Error getting teams:', error);
      throw new Error('Failed to retrieve teams');
    }
  }

  /**
   * Add member to team
   */
  static async addTeamMember(teamId: string, userId: string): Promise<Team> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const user = await UserService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is already a member
      if (team.memberUserIds.includes(userId)) {
        throw new Error('User is already a team member');
      }

      // Update team with new member
      const updatedMemberIds = [...team.memberUserIds, userId];
      const docRef = doc(db, this.TEAMS_COLLECTION, teamId);
      
      await updateDoc(docRef, {
        memberUserIds: updatedMemberIds,
        updatedAt: Timestamp.now()
      });

      // Update user's team assignment
      await UserService.updateUser(userId, { teamId });

      return await this.getTeamById(teamId) as Team;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw new Error('Failed to add team member');
    }
  }

  /**
   * Remove member from team
   */
  static async removeTeamMember(teamId: string, userId: string): Promise<Team> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Check if user is a member
      if (!team.memberUserIds.includes(userId)) {
        throw new Error('User is not a team member');
      }

      // Update team by removing member
      const updatedMemberIds = team.memberUserIds.filter(id => id !== userId);
      const docRef = doc(db, this.TEAMS_COLLECTION, teamId);
      
      await updateDoc(docRef, {
        memberUserIds: updatedMemberIds,
        updatedAt: Timestamp.now()
      });

      // Remove team assignment from user
      await UserService.updateUser(userId, { teamId: undefined });

      return await this.getTeamById(teamId) as Team;
    } catch (error) {
      console.error('Error removing team member:', error);
      throw new Error('Failed to remove team member');
    }
  }

  /**
   * Get team members with full user details
   */
  static async getTeamMembers(teamId: string): Promise<User[]> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const members: User[] = [];
      
      // Get team lead
      const teamLead = await UserService.getUserById(team.leadUserId);
      if (teamLead) {
        members.push(teamLead);
      }

      // Get team members
      for (const memberId of team.memberUserIds) {
        const member = await UserService.getUserById(memberId);
        if (member) {
          members.push(member);
        }
      }

      return members;
    } catch (error) {
      console.error('Error getting team members:', error);
      throw new Error('Failed to retrieve team members');
    }
  }

  /**
   * Get team members with full user details - SERVER SIDE VERSION
   */
  static async getTeamMembersServerSide(teamId: string): Promise<User[]> {
    try {
      const team = await this.getTeamByIdServerSide(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const members: User[] = [];
      
      // Get team lead
      const teamLead = await UserService.getUserById(team.leadUserId);
      if (teamLead) {
        members.push(teamLead);
      }

      // Get team members
      for (const memberId of team.memberUserIds) {
        const member = await UserService.getUserById(memberId);
        if (member) {
          members.push(member);
        }
      }

      return members;
    } catch (error) {
      console.error('Error getting team members (server-side):', error);
      throw new Error('Failed to retrieve team members');
    }
  }

  /**
   * Get team by member ID
   */
  static async getTeamByMemberId(memberId: string): Promise<Team | null> {
    try {
      // First check if member is a team lead
      const q1 = query(
        collection(db, this.TEAMS_COLLECTION),
        where('leadUserId', '==', memberId)
      );
      
      const leadQuerySnapshot = await getDocs(q1);
      if (!leadQuerySnapshot.empty) {
        const doc = leadQuerySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as Team;
      }

      // Then check if member is in memberUserIds array
      const q2 = query(
        collection(db, this.TEAMS_COLLECTION),
        where('memberUserIds', 'array-contains', memberId)
      );
      
      const memberQuerySnapshot = await getDocs(q2);
      if (!memberQuerySnapshot.empty) {
        const doc = memberQuerySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as Team;
      }

      return null;
    } catch (error) {
      console.error('Error getting team by member ID:', error);
      return null;
    }
  }

  /**
   * Assign vendor to user
   */
  static async assignVendor(assignmentData: CreateVendorAssignmentData): Promise<VendorAssignment> {
    try {
      // Validate vendor (tailor) exists
      let vendor;
      try {
        vendor = await getTailorById(assignmentData.vendorId);
      } catch (error) {
        throw new Error('Vendor not found');
      }

      // Validate assigned user exists
      const assignedUser = await UserService.getUserById(assignmentData.assignedToUserId);
      if (!assignedUser) {
        throw new Error('Assigned user not found');
      }

      // Validate assigning user exists
      const assigningUser = await UserService.getUserById(assignmentData.assignedByUserId);
      if (!assigningUser) {
        throw new Error('Assigning user not found');
      }

      // Check if vendor is already assigned to this user
      const existingAssignment = await this.getActiveVendorAssignment(
        assignmentData.vendorId, 
        assignmentData.assignedToUserId
      );
      if (existingAssignment) {
        throw new Error('Vendor is already assigned to this user');
      }

      const now = Timestamp.now();
      const assignment = {
        ...assignmentData,
        assignmentDate: now,
        status: 'active' as const
      };

      const docRef = await addDoc(collection(db, this.ASSIGNMENTS_COLLECTION), assignment);
      
      const newAssignment = {
        id: docRef.id,
        ...assignment
      };

      // Send email notification to the assigned user
      try {
        const vendorName = vendor.brand_name || vendor.brandName || assignmentData.vendorId;
        const assignedByName = assigningUser.name || assigningUser.email || 'Unknown User';
        
        await MarketingEmailService.sendVendorAssignmentEmail(
          assignedUser.email,
          assignedUser.name || assignedUser.email,
          vendorName,
          assignmentData.vendorId,
          assignedByName
        );
        
        console.log(`✅ Assignment email sent to ${assignedUser.email}`);
      } catch (emailError) {
        // Log email error but don't fail the assignment
        console.error('❌ Failed to send assignment email:', emailError);
        // Continue with assignment even if email fails
      }
      
      return newAssignment;
    } catch (error) {
      console.error('Error assigning vendor:', error);
      throw error;
    }
  }

  /**
   * Transfer vendor between users
   */
  static async transferVendor(
    vendorId: string, 
    transferData: VendorTransferData
  ): Promise<VendorAssignment> {
    try {
      // Validate vendor (tailor) exists
      let vendor;
      try {
        vendor = await getTailorById(vendorId);
      } catch (error) {
        throw new Error('Vendor not found');
      }

      // Validate users exist
      const [fromUser, toUser, transferringUser] = await Promise.all([
        UserService.getUserById(transferData.fromUserId),
        UserService.getUserById(transferData.toUserId),
        UserService.getUserById(transferData.transferredByUserId)
      ]);

      if (!fromUser) {
        throw new Error('Source user not found');
      }
      if (!toUser) {
        throw new Error('Target user not found');
      }
      if (!transferringUser) {
        throw new Error('Transferring user not found');
      }

      // Find current assignment
      const q = query(
        collection(db, this.ASSIGNMENTS_COLLECTION),
        where('vendorId', '==', vendorId),
        where('assignedToUserId', '==', transferData.fromUserId),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('No active assignment found for this vendor and user');
      }

      const currentAssignmentDoc = querySnapshot.docs[0];
      const currentAssignment = currentAssignmentDoc.data();

      // Check if vendor is already assigned to target user
      const existingTargetAssignment = await this.getActiveVendorAssignment(vendorId, transferData.toUserId);
      if (existingTargetAssignment) {
        throw new Error('Vendor is already assigned to the target user');
      }

      // Mark current assignment as transferred
      await updateDoc(currentAssignmentDoc.ref, {
        status: 'transferred',
        transferredAt: Timestamp.now(),
        transferredToUserId: transferData.toUserId,
        transferReason: transferData.reason
      });

      // Create new assignment (this will send assignment email to new user)
      const newAssignment = await this.assignVendor({
        vendorId,
        assignedToUserId: transferData.toUserId,
        assignedByUserId: transferData.transferredByUserId,
        teamId: currentAssignment.teamId,
        notes: `Transferred from user ${transferData.fromUserId}. Reason: ${transferData.reason || 'Not specified'}`
      });

      // Send unassignment email to the old assignee
      try {
        const vendorName = vendor.brand_name || vendor.brandName || vendorId;
        const unassignedByName = transferringUser.name || transferringUser.email || 'Unknown User';
        
        await MarketingEmailService.sendUnassignmentEmail(
          fromUser.email,
          fromUser.name || fromUser.email,
          vendorName,
          vendorId,
          unassignedByName,
          transferData.reason || `Vendor reassigned to ${toUser.name || toUser.email}`
        );
        
        console.log(`✅ Unassignment email sent to ${fromUser.email}`);
      } catch (emailError) {
        // Log email error but don't fail the transfer
        console.error('❌ Failed to send unassignment email to old assignee:', emailError);
      }

      return newAssignment;
    } catch (error) {
      console.error('Error transferring vendor:', error);
      throw error;
    }
  }

  /**
   * Get vendor assignments for a user
   */
  static async getUserVendorAssignments(userId: string): Promise<VendorAssignment[]> {
    try {
      const q = query(
        collection(db, this.ASSIGNMENTS_COLLECTION),
        where('assignedToUserId', '==', userId),
        where('status', '==', 'active'),
        orderBy('assignmentDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VendorAssignment[];
    } catch (error) {
      console.error('Error getting user vendor assignments:', error);
      throw new Error('Failed to retrieve vendor assignments');
    }
  }

  /**
   * Get all vendor assignments
   */
  static async getAllVendorAssignments(): Promise<VendorAssignment[]> {
    try {
      const q = query(
        collection(db, this.ASSIGNMENTS_COLLECTION),
        orderBy('assignmentDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VendorAssignment[];
    } catch (error) {
      console.error('Error getting all vendor assignments:', error);
      throw new Error('Failed to retrieve vendor assignments');
    }
  }

  /**
   * Get all vendor assignments - SERVER SIDE VERSION
   */
  static async getAllVendorAssignmentsServerSide(): Promise<VendorAssignment[]> {
    try {
      console.log('getAllVendorAssignmentsServerSide called');
      
      // Check if adminDb is properly initialized
      if (!adminDb) {
        console.error('Firebase Admin DB is not initialized');
        throw new Error('Firebase Admin DB is not initialized');
      }
      
      console.log('Fetching vendor assignments from collection:', this.ASSIGNMENTS_COLLECTION);
      const snapshot = await adminDb.collection(this.ASSIGNMENTS_COLLECTION).orderBy('assignmentDate', 'desc').get();
      console.log('Got vendor assignments snapshot with', snapshot.docs.length, 'documents');
      
      const assignments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as VendorAssignment[];
      
      console.log('Mapped', assignments.length, 'vendor assignments');
      return assignments;
    } catch (error) {
      console.error('Error getting all vendor assignments (server-side):', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`Failed to retrieve vendor assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get team vendor assignments
   */
  static async getTeamVendorAssignments(teamId: string): Promise<VendorAssignment[]> {
    try {
      const q = query(
        collection(db, this.ASSIGNMENTS_COLLECTION),
        where('teamId', '==', teamId),
        where('status', '==', 'active'),
        orderBy('assignmentDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VendorAssignment[];
    } catch (error) {
      console.error('Error getting team vendor assignments:', error);
      throw new Error('Failed to retrieve team vendor assignments');
    }
  }

  /**
   * Get team vendor assignments - SERVER SIDE VERSION
   */
  static async getTeamVendorAssignmentsServerSide(teamId: string): Promise<VendorAssignment[]> {
    try {
      const snapshot = await adminDb.collection(this.ASSIGNMENTS_COLLECTION)
        .where('teamId', '==', teamId)
        .where('status', '==', 'active')
        .orderBy('assignmentDate', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as VendorAssignment[];
    } catch (error) {
      console.error('Error getting team vendor assignments (server-side):', error);
      throw new Error('Failed to retrieve team vendor assignments');
    }
  }

  /**
   * Get active vendor assignment for a specific vendor and user
   */
  static async getActiveVendorAssignment(vendorId: string, userId: string): Promise<VendorAssignment | null> {
    try {
      const q = query(
        collection(db, this.ASSIGNMENTS_COLLECTION),
        where('vendorId', '==', vendorId),
        where('assignedToUserId', '==', userId),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as VendorAssignment;
    } catch (error) {
      console.error('Error getting active vendor assignment:', error);
      throw new Error('Failed to retrieve vendor assignment');
    }
  }

  /**
   * Get vendor assignment history for a specific vendor
   */
  static async getVendorAssignmentHistory(vendorId: string): Promise<VendorAssignment[]> {
    try {
      const q = query(
        collection(db, this.ASSIGNMENTS_COLLECTION),
        where('vendorId', '==', vendorId),
        orderBy('assignmentDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VendorAssignment[];
    } catch (error) {
      console.error('Error getting vendor assignment history:', error);
      throw new Error('Failed to retrieve vendor assignment history');
    }
  }

  /**
   * Unassign a vendor (cancel assignment without reassigning)
   */
  static async unassignVendor(
    vendorId: string,
    userId: string,
    unassignedByUserId: string,
    reason?: string
  ): Promise<void> {
    try {
      // Validate vendor (tailor) exists
      let vendor;
      try {
        vendor = await getTailorById(vendorId);
      } catch (error) {
        throw new Error('Vendor not found');
      }

      // Validate users exist
      const [assignedUser, unassigningUser] = await Promise.all([
        UserService.getUserById(userId),
        UserService.getUserById(unassignedByUserId)
      ]);

      if (!assignedUser) {
        throw new Error('Assigned user not found');
      }
      if (!unassigningUser) {
        throw new Error('Unassigning user not found');
      }

      // Find current assignment
      const q = query(
        collection(db, this.ASSIGNMENTS_COLLECTION),
        where('vendorId', '==', vendorId),
        where('assignedToUserId', '==', userId),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('No active assignment found for this vendor and user');
      }

      const currentAssignmentDoc = querySnapshot.docs[0];

      // Mark assignment as completed (cancelled)
      await updateDoc(currentAssignmentDoc.ref, {
        status: 'completed',
        completedAt: Timestamp.now(),
        completionReason: reason || 'Assignment cancelled'
      });

      // Send unassignment email to the user
      try {
        const vendorName = vendor.brand_name || vendor.brandName || vendorId;
        const unassignedByName = unassigningUser.name || unassigningUser.email || 'Unknown User';
        
        await MarketingEmailService.sendUnassignmentEmail(
          assignedUser.email,
          assignedUser.name || assignedUser.email,
          vendorName,
          vendorId,
          unassignedByName,
          reason
        );
        
        console.log(`✅ Unassignment email sent to ${assignedUser.email}`);
      } catch (emailError) {
        // Log email error but don't fail the unassignment
        console.error('❌ Failed to send unassignment email:', emailError);
      }
    } catch (error) {
      console.error('Error unassigning vendor:', error);
      throw error;
    }
  }

  /**
   * Get all teams - SERVER SIDE VERSION
   */
  static async getAllTeamsServerSide(): Promise<Team[]> {
    try {
      console.log('getAllTeamsServerSide called');
      
      // Check if adminDb is properly initialized
      if (!adminDb) {
        console.error('Firebase Admin DB is not initialized');
        throw new Error('Firebase Admin DB is not initialized');
      }
      
      console.log('Fetching teams from collection:', this.TEAMS_COLLECTION);
      const snapshot = await adminDb.collection(this.TEAMS_COLLECTION).orderBy('createdAt', 'desc').get();
      console.log('Got teams snapshot with', snapshot.docs.length, 'documents');
      
      const teams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Team[];
      
      console.log('Mapped', teams.length, 'teams');
      return teams;
    } catch (error) {
      console.error('Error getting teams (server-side):', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`Failed to retrieve teams: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Team Management Utilities
export class TeamManagementUtils {
  /**
   * Validate team creation permissions
   */
  static canCreateTeam(userRole: string): boolean {
    return ['super_admin'].includes(userRole);
  }

  /**
   * Validate team member management permissions
   */
  static canManageTeamMembers(userRole: string, teamLeadId: string, userId: string): boolean {
    // Super admin can manage any team
    if (userRole === 'super_admin') {
      return true;
    }
    
    // Team lead can manage their own team
    if (userRole === 'team_lead' && teamLeadId === userId) {
      return true;
    }
    
    return false;
  }

  /**
   * Validate vendor assignment permissions
   */
  static canAssignVendors(userRole: string): boolean {
    return ['super_admin', 'bdm', 'team_lead'].includes(userRole);
  }

  /**
   * Validate vendor transfer permissions
   */
  static canTransferVendors(userRole: string): boolean {
    return ['super_admin', 'team_lead'].includes(userRole);
  }

  /**
   * Get assignable users for a role
   */
  static async getAssignableUsers(assignerRole: string): Promise<User[]> {
    try {
      if (assignerRole === 'super_admin') {
        // Super admin can assign to anyone
        return await UserService.getUsers({ isActive: true });
      }
      
      if (assignerRole === 'team_lead') {
        // Team lead can assign to team members
        return await UserService.getUsersByRole('team_member');
      }
      
      if (assignerRole === 'bdm') {
        // BDM can assign to team members and team leads
        const teamMembers = await UserService.getUsersByRole('team_member');
        const teamLeads = await UserService.getUsersByRole('team_lead');
        return [...teamMembers, ...teamLeads];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting assignable users:', error);
      return [];
    }
  }
}

// Export utilities
export const teamAssignmentUtils = {
  TeamAssignmentService,
  TeamManagementUtils
};