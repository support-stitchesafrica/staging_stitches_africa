/**
 * Marketing Dashboard Team Service
 * Handles team creation, management, member assignment, and hierarchy
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/firebase';
import { adminDb } from '@/lib/firebase-admin';
import { ActivityLogService } from './activity-log-service';
import { UserService } from './user-service';

// Team Types
export interface Team {
  id: string;
  name: string;
  description?: string;
  leadUserId: string;
  leadName?: string;
  memberUserIds: string[];
  createdByUserId: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateTeamData {
  name: string;
  description?: string;
  leadUserId: string;
  createdByUserId: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  leadUserId?: string;
  isActive?: boolean;
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: Timestamp;
}

export interface TeamWithMembers extends Team {
  lead?: {
    id: string;
    name: string;
    email: string;
  };
  members: TeamMember[];
}

// Team Service Class
export class TeamService {
  private static readonly COLLECTION_NAME = 'marketing_teams';

  /**
   * Validate team name uniqueness
   */
  private static async validateTeamNameUnique(name: string, excludeTeamId?: string): Promise<boolean> {
    try {
      const normalizedName = name.trim().toLowerCase();
      
      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const team = doc.data() as Team;
        const existingName = team.name.trim().toLowerCase();
        
        // Skip if this is the team being updated
        if (excludeTeamId && doc.id === excludeTeamId) {
          continue;
        }
        
        if (existingName === normalizedName) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validating team name uniqueness:', error);
      return false;
    }
  }

  /**
   * Validate team lead exists and has appropriate role
   */
  private static async validateTeamLead(leadUserId: string): Promise<{ valid: boolean; error?: string; user?: any }> {
    try {
      const leadUser = await UserService.getUserById(leadUserId);
      
      if (!leadUser) {
        return { valid: false, error: 'Team lead user not found' };
      }

      if (!leadUser.isActive) {
        return { valid: false, error: 'Team lead user is not active' };
      }

      if (leadUser.role !== 'team_lead') {
        return { valid: false, error: 'Assigned user must have team_lead role' };
      }

      return { valid: true, user: leadUser };
    } catch (error) {
      console.error('Error validating team lead:', error);
      return { valid: false, error: 'Failed to validate team lead' };
    }
  }

  /**
   * Validate member IDs exist and are active
   */
  private static async validateMemberIds(memberIds: string[]): Promise<{ valid: boolean; error?: string; invalidIds?: string[] }> {
    try {
      const invalidIds: string[] = [];
      
      for (const memberId of memberIds) {
        const user = await UserService.getUserById(memberId);
        
        if (!user) {
          invalidIds.push(memberId);
          continue;
        }
        
        if (!user.isActive) {
          invalidIds.push(memberId);
        }
      }
      
      if (invalidIds.length > 0) {
        return {
          valid: false,
          error: `Invalid or inactive user IDs: ${invalidIds.join(', ')}`,
          invalidIds
        };
      }
      
      return { valid: true };
    } catch (error) {
      console.error('Error validating member IDs:', error);
      return { valid: false, error: 'Failed to validate member IDs' };
    }
  }

  /**
   * Comprehensive validation for team creation
   */
  private static async validateTeamCreation(teamData: CreateTeamData): Promise<{ valid: boolean; error?: string }> {
    // Validate team name is not empty
    if (!teamData.name || teamData.name.trim().length === 0) {
      return { valid: false, error: 'Team name is required' };
    }

    // Validate team name length
    if (teamData.name.trim().length < 2) {
      return { valid: false, error: 'Team name must be at least 2 characters long' };
    }

    if (teamData.name.trim().length > 100) {
      return { valid: false, error: 'Team name must be less than 100 characters' };
    }

    // Validate team name uniqueness
    const isUnique = await this.validateTeamNameUnique(teamData.name);
    if (!isUnique) {
      return { valid: false, error: 'A team with this name already exists' };
    }

    // Validate team lead
    const leadValidation = await this.validateTeamLead(teamData.leadUserId);
    if (!leadValidation.valid) {
      return { valid: false, error: leadValidation.error };
    }

    return { valid: true };
  }

  /**
   * Create a new team
   */
  static async createTeam(
    teamData: CreateTeamData,
    creatorName?: string
  ): Promise<Team> {
    try {
      // Comprehensive validation
      const validation = await this.validateTeamCreation(teamData);
      if (!validation.valid) {
        throw new Error(validation.error || 'Team validation failed');
      }

      // Get validated team lead (we know it exists from validation)
      const leadUser = await UserService.getUserById(teamData.leadUserId);
      if (!leadUser) {
        throw new Error('Team lead user not found');
      }

      const now = Timestamp.now();
      const teamDoc = {
        name: teamData.name,
        description: teamData.description || '',
        leadUserId: teamData.leadUserId,
        leadName: leadUser.name,
        memberUserIds: [],
        createdByUserId: teamData.createdByUserId,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), teamDoc);
      
      // Update team lead's teamId
      await UserService.updateUser(teamData.leadUserId, {
        teamId: docRef.id
      });

      const newTeam: Team = {
        id: docRef.id,
        ...teamDoc
      };

      // Log team creation
      if (creatorName) {
        await ActivityLogService.createLog({
          userId: teamData.createdByUserId,
          userName: creatorName,
          action: 'team_created',
          entityType: 'team',
          entityId: docRef.id,
          entityName: teamData.name,
          details: {
            leadUserId: teamData.leadUserId,
            leadName: leadUser.name
          }
        }).catch(err => console.error('Failed to log team creation:', err));
      }

      return newTeam;
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create team');
    }
  }

  /**
   * Get team by ID
   */
  static async getTeamById(teamId: string): Promise<Team | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, teamId);
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
   * Get team with full member details
   */
  static async getTeamWithMembers(teamId: string): Promise<TeamWithMembers | null> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        return null;
      }

      // Get lead details
      const leadUser = await UserService.getUserById(team.leadUserId);
      
      // Get all member details
      const members: TeamMember[] = [];
      for (const memberId of team.memberUserIds) {
        const user = await UserService.getUserById(memberId);
        if (user) {
          members.push({
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            joinedAt: user.createdAt
          });
        }
      }

      return {
        ...team,
        lead: leadUser ? {
          id: leadUser.id,
          name: leadUser.name,
          email: leadUser.email
        } : undefined,
        members
      };
    } catch (error) {
      console.error('Error getting team with members:', error);
      throw new Error('Failed to retrieve team details');
    }
  }

  /**
   * Update team information
   */
  static async updateTeam(
    teamId: string,
    updateData: UpdateTeamData,
    updaterUserId?: string,
    updaterName?: string
  ): Promise<Team> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, teamId);
      
      // Check if team exists
      const existingTeam = await this.getTeamById(teamId);
      if (!existingTeam) {
        throw new Error('Team not found');
      }

      // Validate team name if being updated
      if (updateData.name !== undefined) {
        if (!updateData.name || updateData.name.trim().length === 0) {
          throw new Error('Team name cannot be empty');
        }

        if (updateData.name.trim().length < 2) {
          throw new Error('Team name must be at least 2 characters long');
        }

        if (updateData.name.trim().length > 100) {
          throw new Error('Team name must be less than 100 characters');
        }

        // Check uniqueness (excluding current team)
        const isUnique = await this.validateTeamNameUnique(updateData.name, teamId);
        if (!isUnique) {
          throw new Error('A team with this name already exists');
        }
      }

      // If updating lead, validate the new lead
      if (updateData.leadUserId && updateData.leadUserId !== existingTeam.leadUserId) {
        const leadValidation = await this.validateTeamLead(updateData.leadUserId);
        if (!leadValidation.valid) {
          throw new Error(leadValidation.error || 'Invalid team lead');
        }

        const newLead = leadValidation.user;

        // Update old lead's teamId
        await UserService.updateUser(existingTeam.leadUserId, {
          teamId: undefined
        });

        // Update new lead's teamId
        await UserService.updateUser(updateData.leadUserId, {
          teamId: teamId
        });

        // Add leadName to update data
        updateData = { ...updateData, leadName: newLead.name } as UpdateTeamData & { leadName: string };
      }

      const updatePayload = {
        ...updateData,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updatePayload);
      
      const updatedTeam = await this.getTeamById(teamId) as Team;

      // Log team update
      if (updaterUserId && updaterName) {
        await ActivityLogService.createLog({
          userId: updaterUserId,
          userName: updaterName,
          action: 'team_updated',
          entityType: 'team',
          entityId: teamId,
          entityName: updatedTeam.name,
          details: updateData
        }).catch(err => console.error('Failed to log team update:', err));
      }

      return updatedTeam;
    } catch (error) {
      console.error('Error updating team:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update team');
    }
  }

  /**
   * Add member to team
   */
  static async addMemberToTeam(
    teamId: string,
    userId: string,
    addedByUserId?: string,
    addedByName?: string
  ): Promise<Team> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Validate user exists and is active
      const user = await UserService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Cannot add inactive user to team');
      }

      // Check if user is already a member
      if (team.memberUserIds.includes(userId)) {
        throw new Error('User is already a member of this team');
      }

      // Check if user is the team lead
      if (team.leadUserId === userId) {
        throw new Error('Team lead is automatically part of the team');
      }

      // Check if user is already in another team
      if (user.teamId && user.teamId !== teamId) {
        throw new Error('User is already a member of another team. Remove them from that team first.');
      }

      // Add user to team
      const updatedMemberIds = [...team.memberUserIds, userId];
      const docRef = doc(db, this.COLLECTION_NAME, teamId);
      
      await updateDoc(docRef, {
        memberUserIds: updatedMemberIds,
        updatedAt: Timestamp.now()
      });

      // Update user's teamId
      await UserService.updateUser(userId, {
        teamId: teamId
      });

      const updatedTeam = await this.getTeamById(teamId) as Team;

      // Log member addition
      if (addedByUserId && addedByName) {
        await ActivityLogService.createLog({
          userId: addedByUserId,
          userName: addedByName,
          action: 'team_member_added',
          entityType: 'team',
          entityId: teamId,
          entityName: team.name,
          details: {
            addedUserId: userId,
            addedUserName: user.name,
            addedUserEmail: user.email
          }
        }).catch(err => console.error('Failed to log member addition:', err));
      }

      return updatedTeam;
    } catch (error) {
      console.error('Error adding member to team:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to add member to team');
    }
  }

  /**
   * Remove member from team
   */
  static async removeMemberFromTeam(
    teamId: string,
    userId: string,
    removedByUserId?: string,
    removedByName?: string
  ): Promise<Team> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Check if user is a member
      if (!team.memberUserIds.includes(userId)) {
        throw new Error('User is not a member of this team');
      }

      // Get user details before removal
      const user = await UserService.getUserById(userId);

      // Remove user from team
      const updatedMemberIds = team.memberUserIds.filter(id => id !== userId);
      const docRef = doc(db, this.COLLECTION_NAME, teamId);
      
      await updateDoc(docRef, {
        memberUserIds: updatedMemberIds,
        updatedAt: Timestamp.now()
      });

      // Clear user's teamId
      await UserService.updateUser(userId, {
        teamId: undefined
      });

      const updatedTeam = await this.getTeamById(teamId) as Team;

      // Log member removal
      if (removedByUserId && removedByName && user) {
        await ActivityLogService.createLog({
          userId: removedByUserId,
          userName: removedByName,
          action: 'team_member_removed',
          entityType: 'team',
          entityId: teamId,
          entityName: team.name,
          details: {
            removedUserId: userId,
            removedUserName: user.name,
            removedUserEmail: user.email
          }
        }).catch(err => console.error('Failed to log member removal:', err));
      }

      return updatedTeam;
    } catch (error) {
      console.error('Error removing member from team:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to remove member from team');
    }
  }

  /**
   * Transfer team leadership
   */
  static async transferLeadership(
    teamId: string,
    newLeadUserId: string,
    transferredByUserId?: string,
    transferredByName?: string
  ): Promise<Team> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const oldLeadUserId = team.leadUserId;

      // Validate new lead
      const newLead = await UserService.getUserById(newLeadUserId);
      if (!newLead) {
        throw new Error('New team lead not found');
      }

      // Update new lead's role if needed
      if (newLead.role !== 'team_lead') {
        await UserService.updateUserRole(newLeadUserId, 'team_lead');
      }

      // Remove new lead from members if they're in the list
      const updatedMemberIds = team.memberUserIds.filter(id => id !== newLeadUserId);
      
      // Add old lead to members if not already there
      if (!updatedMemberIds.includes(oldLeadUserId)) {
        updatedMemberIds.push(oldLeadUserId);
      }

      // Update team
      const docRef = doc(db, this.COLLECTION_NAME, teamId);
      await updateDoc(docRef, {
        leadUserId: newLeadUserId,
        leadName: newLead.name,
        memberUserIds: updatedMemberIds,
        updatedAt: Timestamp.now()
      });

      // Update user teamIds
      await UserService.updateUser(newLeadUserId, { teamId: teamId });
      await UserService.updateUser(oldLeadUserId, { teamId: teamId });

      const updatedTeam = await this.getTeamById(teamId) as Team;

      // Log leadership transfer
      if (transferredByUserId && transferredByName) {
        const oldLead = await UserService.getUserById(oldLeadUserId);
        await ActivityLogService.createLog({
          userId: transferredByUserId,
          userName: transferredByName,
          action: 'team_leadership_transferred',
          entityType: 'team',
          entityId: teamId,
          entityName: team.name,
          details: {
            oldLeadUserId,
            oldLeadName: oldLead?.name,
            newLeadUserId,
            newLeadName: newLead.name
          }
        }).catch(err => console.error('Failed to log leadership transfer:', err));
      }

      return updatedTeam;
    } catch (error) {
      console.error('Error transferring leadership:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to transfer leadership');
    }
  }

  /**
   * Delete team (soft delete by deactivating)
   */
  static async deleteTeam(
    teamId: string,
    deletedByUserId?: string,
    deletedByName?: string
  ): Promise<void> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Deactivate team
      await this.updateTeam(teamId, { isActive: false });

      // Clear teamId from all members
      const allMemberIds = [team.leadUserId, ...team.memberUserIds];
      for (const memberId of allMemberIds) {
        await UserService.updateUser(memberId, { teamId: undefined });
      }

      // Log team deletion
      if (deletedByUserId && deletedByName) {
        await ActivityLogService.createLog({
          userId: deletedByUserId,
          userName: deletedByName,
          action: 'team_deleted',
          entityType: 'team',
          entityId: teamId,
          entityName: team.name,
          details: {
            memberCount: team.memberUserIds.length
          }
        }).catch(err => console.error('Failed to log team deletion:', err));
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete team');
    }
  }

  /**
   * Get all teams
   */
  static async getAllTeams(includeInactive: boolean = false): Promise<Team[]> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));

      if (!includeInactive) {
        q = query(q, where('isActive', '==', true));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[];
    } catch (error) {
      console.error('Error getting all teams:', error);
      throw new Error('Failed to retrieve teams');
    }
  }

  /**
   * Get all teams - SERVER SIDE VERSION
   */
  static async getAllTeamsServerSide(includeInactive: boolean = false): Promise<Team[]> {
    try {
      let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb.collection(this.COLLECTION_NAME);

      if (!includeInactive) {
        query = query.where('isActive', '==', true);
      }

      query = query.orderBy('createdAt', 'desc');

      const snapshot = await query.get();
      
      return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Team[];
    } catch (error) {
      console.error('Error getting all teams (server-side):', error);
      throw new Error('Failed to retrieve teams');
    }
  }

  /**
   * Get teams by lead user ID
   */
  static async getTeamsByLead(leadUserId: string): Promise<Team[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('leadUserId', '==', leadUserId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[];
    } catch (error) {
      console.error('Error getting teams by lead:', error);
      throw new Error('Failed to retrieve teams');
    }
  }

  /**
   * Get teams by lead user ID - SERVER SIDE VERSION
   */
  static async getTeamsByLeadServerSide(leadUserId: string): Promise<Team[]> {
    try {
      const snapshot = await adminDb.collection(this.COLLECTION_NAME)
        .where('leadUserId', '==', leadUserId)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as Team[];
    } catch (error) {
      console.error('Error getting teams by lead (server-side):', error);
      throw new Error('Failed to retrieve teams');
    }
  }

  /**
   * Get team members with details
   */
  static async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      const members: TeamMember[] = [];
      
      for (const memberId of team.memberUserIds) {
        const user = await UserService.getUserById(memberId);
        if (user) {
          members.push({
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            joinedAt: user.createdAt
          });
        }
      }

      return members;
    } catch (error) {
      console.error('Error getting team members:', error);
      throw new Error('Failed to retrieve team members');
    }
  }

  /**
   * Bulk add members to team
   */
  static async bulkAddMembers(
    teamId: string,
    userIds: string[],
    addedByUserId?: string,
    addedByName?: string
  ): Promise<Team> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Validate all member IDs first
      const memberValidation = await this.validateMemberIds(userIds);
      if (!memberValidation.valid) {
        throw new Error(memberValidation.error || 'Invalid member IDs');
      }

      const batch = writeBatch(db);
      const newMemberIds: string[] = [];
      const skippedUsers: string[] = [];

      for (const userId of userIds) {
        // Validate user exists and is active
        const user = await UserService.getUserById(userId);
        if (!user) {
          console.warn(`User ${userId} not found, skipping`);
          skippedUsers.push(userId);
          continue;
        }

        if (!user.isActive) {
          console.warn(`User ${userId} is inactive, skipping`);
          skippedUsers.push(userId);
          continue;
        }

        // Skip if already a member or is the lead
        if (team.memberUserIds.includes(userId) || team.leadUserId === userId) {
          console.warn(`User ${userId} is already a member or is the team lead, skipping`);
          continue;
        }

        // Skip if user is in another team
        if (user.teamId && user.teamId !== teamId) {
          console.warn(`User ${userId} is already in another team, skipping`);
          skippedUsers.push(userId);
          continue;
        }

        newMemberIds.push(userId);

        // Update user's teamId
        const userRef = doc(db, "staging_marketing_users", userId);
        batch.update(userRef, { teamId: teamId });
      }

      // Update team with new members
      const updatedMemberIds = [...team.memberUserIds, ...newMemberIds];
      const teamRef = doc(db, this.COLLECTION_NAME, teamId);
      batch.update(teamRef, {
        memberUserIds: updatedMemberIds,
        updatedAt: Timestamp.now()
      });

      await batch.commit();

      const updatedTeam = await this.getTeamById(teamId) as Team;

      // Log bulk member addition
      if (addedByUserId && addedByName) {
        await ActivityLogService.createLog({
          userId: addedByUserId,
          userName: addedByName,
          action: 'team_members_bulk_added',
          entityType: 'team',
          entityId: teamId,
          entityName: team.name,
          details: {
            addedUserIds: newMemberIds,
            count: newMemberIds.length
          }
        }).catch(err => console.error('Failed to log bulk member addition:', err));
      }

      return updatedTeam;
    } catch (error) {
      console.error('Error bulk adding members:', error);
      throw new Error('Failed to add members to team');
    }
  }

  /**
   * Get team hierarchy (lead and members)
   */
  static async getTeamHierarchy(teamId: string): Promise<{
    team: Team;
    lead: TeamMember | null;
    members: TeamMember[];
  }> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Get lead details
      const leadUser = await UserService.getUserById(team.leadUserId);
      const lead: TeamMember | null = leadUser ? {
        userId: leadUser.id,
        name: leadUser.name,
        email: leadUser.email,
        role: leadUser.role,
        joinedAt: leadUser.createdAt
      } : null;

      // Get member details
      const members = await this.getTeamMembers(teamId);

      return {
        team,
        lead,
        members
      };
    } catch (error) {
      console.error('Error getting team hierarchy:', error);
      throw new Error('Failed to retrieve team hierarchy');
    }
  }

  /**
   * Check if user is team lead
   */
  static async isTeamLead(userId: string, teamId: string): Promise<boolean> {
    try {
      const team = await this.getTeamById(teamId);
      return team?.leadUserId === userId;
    } catch (error) {
      console.error('Error checking team lead:', error);
      return false;
    }
  }

  /**
   * Check if user is team member
   */
  static async isTeamMember(userId: string, teamId: string): Promise<boolean> {
    try {
      const team = await this.getTeamById(teamId);
      return team?.memberUserIds.includes(userId) || team?.leadUserId === userId;
    } catch (error) {
      console.error('Error checking team member:', error);
      return false;
    }
  }
}

// Export utilities
export const teamUtils = {
  TeamService
};
