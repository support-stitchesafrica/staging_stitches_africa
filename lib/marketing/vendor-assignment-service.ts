/**
 * Marketing Dashboard Vendor Assignment Service
 * Handles vendor-to-user assignments for the marketing team
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
import { VendorAssignment, AssignmentStatus } from './types';

// Validation configuration
const MAX_ASSIGNMENTS_PER_USER = 50; // Maximum active assignments per user
const MIN_VENDOR_NAME_LENGTH = 2;
const MAX_VENDOR_NAME_LENGTH = 200;
const MAX_NOTES_LENGTH = 1000;

// Assignment Service Types
export interface CreateAssignmentData {
  vendorId: string;
  vendorName: string;
  userId: string;
  assignedBy: string;
  notes?: string;
}

export interface UpdateAssignmentData {
  status?: AssignmentStatus;
  notes?: string;
}

export interface AssignmentFilters {
  userId?: string;
  vendorId?: string;
  status?: AssignmentStatus;
  assignedBy?: string;
}

// Vendor Assignment Service Class
export class VendorAssignmentService {
  private static readonly COLLECTION_NAME = 'vendor_assignments';
  private static readonly VENDORS_COLLECTION = 'tailors';

  /**
   * Validate that a vendor exists in Firestore
   */
  private static async validateVendorExists(vendorId: string): Promise<boolean> {
    try {
      const vendorRef = doc(db, this.VENDORS_COLLECTION, vendorId);
      const vendorSnap = await getDoc(vendorRef);
      return vendorSnap.exists();
    } catch (error) {
      console.error('Error validating vendor:', error);
      return false;
    }
  }

  /**
   * Validate that a user exists and is active
   */
  private static async validateUserExists(userId: string): Promise<boolean> {
    try {
      const user = await UserService.getUserById(userId);
      return user !== null && user.isActive;
    } catch (error) {
      console.error('Error validating user:', error);
      return false;
    }
  }

  /**
   * Check if user has capacity for more assignments
   */
  private static async validateUserCapacity(userId: string): Promise<boolean> {
    try {
      const activeAssignments = await this.getAssignmentsByUser(userId, 'active');
      return activeAssignments.length < MAX_ASSIGNMENTS_PER_USER;
    } catch (error) {
      console.error('Error validating user capacity:', error);
      return false;
    }
  }

  /**
   * Check for duplicate active assignments
   */
  private static async validateNoDuplicateAssignment(vendorId: string): Promise<boolean> {
    try {
      const existingAssignment = await this.getActiveAssignmentByVendor(vendorId);
      return existingAssignment === null;
    } catch (error) {
      console.error('Error checking duplicate assignment:', error);
      return false;
    }
  }

  /**
   * Validate assignment data fields
   */
  private static validateAssignmentData(data: CreateAssignmentData): { valid: boolean; error?: string } {
    // Validate vendor ID
    if (!data.vendorId || data.vendorId.trim().length === 0) {
      return { valid: false, error: 'Vendor ID is required' };
    }

    // Validate vendor name
    if (!data.vendorName || data.vendorName.trim().length === 0) {
      return { valid: false, error: 'Vendor name is required' };
    }

    if (data.vendorName.trim().length < MIN_VENDOR_NAME_LENGTH) {
      return { valid: false, error: `Vendor name must be at least ${MIN_VENDOR_NAME_LENGTH} characters` };
    }

    if (data.vendorName.trim().length > MAX_VENDOR_NAME_LENGTH) {
      return { valid: false, error: `Vendor name must be less than ${MAX_VENDOR_NAME_LENGTH} characters` };
    }

    // Validate user ID
    if (!data.userId || data.userId.trim().length === 0) {
      return { valid: false, error: 'User ID is required' };
    }

    // Validate assigned by
    if (!data.assignedBy || data.assignedBy.trim().length === 0) {
      return { valid: false, error: 'Assigned by user ID is required' };
    }

    // Validate notes length if provided
    if (data.notes && data.notes.length > MAX_NOTES_LENGTH) {
      return { valid: false, error: `Notes must be less than ${MAX_NOTES_LENGTH} characters` };
    }

    return { valid: true };
  }

  /**
   * Comprehensive validation for assignment creation
   */
  private static async validateAssignment(
    vendorId: string,
    userId: string
  ): Promise<{ valid: boolean; error?: string }> {
    // Validate IDs are not empty
    if (!vendorId || vendorId.trim().length === 0) {
      return { valid: false, error: 'Vendor ID is required' };
    }

    if (!userId || userId.trim().length === 0) {
      return { valid: false, error: 'User ID is required' };
    }

    // Validate vendor exists
    const vendorExists = await this.validateVendorExists(vendorId);
    if (!vendorExists) {
      return { valid: false, error: 'Vendor not found or does not exist' };
    }

    // Validate user exists and is active
    const userExists = await this.validateUserExists(userId);
    if (!userExists) {
      return { valid: false, error: 'User not found or is inactive' };
    }

    // Check for duplicate assignment
    const noDuplicate = await this.validateNoDuplicateAssignment(vendorId);
    if (!noDuplicate) {
      return { valid: false, error: 'Vendor is already assigned to another user' };
    }

    // Check user capacity
    const hasCapacity = await this.validateUserCapacity(userId);
    if (!hasCapacity) {
      return { 
        valid: false, 
        error: `User has reached maximum capacity of ${MAX_ASSIGNMENTS_PER_USER} active assignments` 
      };
    }

    return { valid: true };
  }

  /**
   * Assign a vendor to a user
   */
  static async assignVendor(
    assignmentData: CreateAssignmentData,
    assignedByName: string
  ): Promise<VendorAssignment> {
    try {
      // Validate assignment data fields
      const dataValidation = this.validateAssignmentData(assignmentData);
      if (!dataValidation.valid) {
        throw new Error(dataValidation.error || 'Invalid assignment data');
      }

      // Comprehensive validation
      const validation = await this.validateAssignment(
        assignmentData.vendorId,
        assignmentData.userId
      );

      if (!validation.valid) {
        throw new Error(validation.error || 'Assignment validation failed');
      }

      // Get user details (we know it exists from validation)
      const user = await UserService.getUserById(assignmentData.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const now = Timestamp.now();
      const assignmentDoc = {
        vendorId: assignmentData.vendorId,
        vendorName: assignmentData.vendorName,
        userId: assignmentData.userId,
        userName: user.name,
        userEmail: user.email,
        assignedBy: assignmentData.assignedBy,
        assignedByName: assignedByName,
        assignedAt: now,
        status: 'active' as AssignmentStatus,
        notes: assignmentData.notes || '',
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), assignmentDoc);

      const newAssignment: VendorAssignment = {
        id: docRef.id,
        ...assignmentDoc
      };

      // Log assignment creation
      await ActivityLogService.createLog({
        userId: assignmentData.assignedBy,
        userName: assignedByName,
        action: 'vendor_assigned',
        entityType: 'vendor_assignment',
        entityId: docRef.id,
        entityName: assignmentData.vendorName,
        details: {
          vendorId: assignmentData.vendorId,
          vendorName: assignmentData.vendorName,
          assignedToUserId: assignmentData.userId,
          assignedToUserName: user.name,
          assignedToUserEmail: user.email,
          notes: assignmentData.notes
        }
      }).catch(err => console.error('Failed to log vendor assignment:', err));

      return newAssignment;
    } catch (error) {
      console.error('Error assigning vendor:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to assign vendor');
    }
  }

  /**
   * Reassign a vendor to a different user
   */
  static async reassignVendor(
    assignmentId: string,
    newUserId: string,
    reassignedBy: string,
    reassignedByName: string,
    notes?: string
  ): Promise<VendorAssignment> {
    try {
      // Validate input parameters
      if (!assignmentId || assignmentId.trim().length === 0) {
        throw new Error('Assignment ID is required');
      }

      if (!newUserId || newUserId.trim().length === 0) {
        throw new Error('New user ID is required');
      }

      if (!reassignedBy || reassignedBy.trim().length === 0) {
        throw new Error('Reassigned by user ID is required');
      }

      if (notes && notes.length > MAX_NOTES_LENGTH) {
        throw new Error(`Notes must be less than ${MAX_NOTES_LENGTH} characters`);
      }

      // Get existing assignment
      const existingAssignment = await this.getAssignmentById(assignmentId);
      if (!existingAssignment) {
        throw new Error('Assignment not found');
      }

      if (existingAssignment.status !== 'active') {
        throw new Error('Can only reassign active assignments');
      }

      // Check if reassigning to the same user
      if (existingAssignment.userId === newUserId) {
        throw new Error('Vendor is already assigned to this user');
      }

      // Validate new user exists and is active
      const userExists = await this.validateUserExists(newUserId);
      if (!userExists) {
        throw new Error('New user not found or is inactive');
      }

      // Check new user capacity
      const hasCapacity = await this.validateUserCapacity(newUserId);
      if (!hasCapacity) {
        throw new Error(`New user has reached maximum capacity of ${MAX_ASSIGNMENTS_PER_USER} active assignments`);
      }

      const newUser = await UserService.getUserById(newUserId);
      if (!newUser) {
        throw new Error('New user not found');
      }

      const oldUserId = existingAssignment.userId;
      const oldUserName = existingAssignment.userName;

      // Update assignment
      const docRef = doc(db, this.COLLECTION_NAME, assignmentId);
      const updatePayload = {
        userId: newUserId,
        userName: newUser.name,
        userEmail: newUser.email,
        assignedBy: reassignedBy,
        assignedByName: reassignedByName,
        assignedAt: Timestamp.now(),
        notes: notes || existingAssignment.notes,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updatePayload);

      const updatedAssignment = await this.getAssignmentById(assignmentId) as VendorAssignment;

      // Log reassignment
      await ActivityLogService.createLog({
        userId: reassignedBy,
        userName: reassignedByName,
        action: 'vendor_reassigned',
        entityType: 'vendor_assignment',
        entityId: assignmentId,
        entityName: existingAssignment.vendorName,
        details: {
          vendorId: existingAssignment.vendorId,
          vendorName: existingAssignment.vendorName,
          oldUserId,
          oldUserName,
          newUserId,
          newUserName: newUser.name,
          newUserEmail: newUser.email,
          notes
        }
      }).catch(err => console.error('Failed to log vendor reassignment:', err));

      return updatedAssignment;
    } catch (error) {
      console.error('Error reassigning vendor:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to reassign vendor');
    }
  }

  /**
   * Unassign a vendor (cancel assignment)
   */
  static async unassignVendor(
    assignmentId: string,
    unassignedBy: string,
    unassignedByName: string,
    reason?: string
  ): Promise<void> {
    try {
      // Validate input parameters
      if (!assignmentId || assignmentId.trim().length === 0) {
        throw new Error('Assignment ID is required');
      }

      if (!unassignedBy || unassignedBy.trim().length === 0) {
        throw new Error('Unassigned by user ID is required');
      }

      if (reason && reason.length > MAX_NOTES_LENGTH) {
        throw new Error(`Reason must be less than ${MAX_NOTES_LENGTH} characters`);
      }

      // Get existing assignment
      const existingAssignment = await this.getAssignmentById(assignmentId);
      if (!existingAssignment) {
        throw new Error('Assignment not found');
      }

      if (existingAssignment.status === 'cancelled') {
        throw new Error('Assignment is already cancelled');
      }

      // Update assignment status to cancelled
      const docRef = doc(db, this.COLLECTION_NAME, assignmentId);
      await updateDoc(docRef, {
        status: 'cancelled' as AssignmentStatus,
        notes: reason ? `${existingAssignment.notes}\nCancellation reason: ${reason}` : existingAssignment.notes,
        updatedAt: Timestamp.now()
      });

      // Log unassignment
      await ActivityLogService.createLog({
        userId: unassignedBy,
        userName: unassignedByName,
        action: 'vendor_unassigned',
        entityType: 'vendor_assignment',
        entityId: assignmentId,
        entityName: existingAssignment.vendorName,
        details: {
          vendorId: existingAssignment.vendorId,
          vendorName: existingAssignment.vendorName,
          userId: existingAssignment.userId,
          userName: existingAssignment.userName,
          reason
        }
      }).catch(err => console.error('Failed to log vendor unassignment:', err));
    } catch (error) {
      console.error('Error unassigning vendor:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to unassign vendor');
    }
  }

  /**
   * Get assignment by ID
   */
  static async getAssignmentById(assignmentId: string): Promise<VendorAssignment | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, assignmentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as VendorAssignment;
    } catch (error) {
      console.error('Error getting assignment by ID:', error);
      throw new Error('Failed to retrieve assignment');
    }
  }

  /**
   * Get assignments by user ID
   */
  static async getAssignmentsByUser(
    userId: string,
    status?: AssignmentStatus
  ): Promise<VendorAssignment[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      q = query(q, orderBy('assignedAt', 'desc'));

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VendorAssignment[];
    } catch (error) {
      console.error('Error getting assignments by user:', error);
      throw new Error('Failed to retrieve user assignments');
    }
  }

  /**
   * Get assignments by vendor ID
   */
  static async getAssignmentsByVendor(
    vendorId: string,
    status?: AssignmentStatus
  ): Promise<VendorAssignment[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('vendorId', '==', vendorId)
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      q = query(q, orderBy('assignedAt', 'desc'));

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VendorAssignment[];
    } catch (error) {
      console.error('Error getting assignments by vendor:', error);
      throw new Error('Failed to retrieve vendor assignments');
    }
  }

  /**
   * Get active assignment for a vendor
   */
  static async getActiveAssignmentByVendor(vendorId: string): Promise<VendorAssignment | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('vendorId', '==', vendorId),
        where('status', '==', 'active'),
        orderBy('assignedAt', 'desc')
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
      console.error('Error getting active assignment by vendor:', error);
      throw new Error('Failed to retrieve active assignment');
    }
  }

  /**
   * Get all assignments with optional filters
   */
  static async getAssignments(filters?: AssignmentFilters): Promise<VendorAssignment[]> {
    try {
      let q = query(collection(db, this.COLLECTION_NAME));

      if (filters?.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }

      if (filters?.vendorId) {
        q = query(q, where('vendorId', '==', filters.vendorId));
      }

      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.assignedBy) {
        q = query(q, where('assignedBy', '==', filters.assignedBy));
      }

      q = query(q, orderBy('assignedAt', 'desc'));

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VendorAssignment[];
    } catch (error) {
      console.error('Error getting assignments:', error);
      throw new Error('Failed to retrieve assignments');
    }
  }

  /**
   * Complete an assignment
   */
  static async completeAssignment(
    assignmentId: string,
    completedBy: string,
    completedByName: string,
    notes?: string
  ): Promise<VendorAssignment> {
    try {
      // Validate input parameters
      if (!assignmentId || assignmentId.trim().length === 0) {
        throw new Error('Assignment ID is required');
      }

      if (!completedBy || completedBy.trim().length === 0) {
        throw new Error('Completed by user ID is required');
      }

      if (notes && notes.length > MAX_NOTES_LENGTH) {
        throw new Error(`Notes must be less than ${MAX_NOTES_LENGTH} characters`);
      }

      const existingAssignment = await this.getAssignmentById(assignmentId);
      if (!existingAssignment) {
        throw new Error('Assignment not found');
      }

      if (existingAssignment.status !== 'active') {
        throw new Error('Can only complete active assignments');
      }

      if (existingAssignment.status === 'completed') {
        throw new Error('Assignment is already completed');
      }

      const docRef = doc(db, this.COLLECTION_NAME, assignmentId);
      const updatePayload = {
        status: 'completed' as AssignmentStatus,
        notes: notes ? `${existingAssignment.notes}\nCompletion notes: ${notes}` : existingAssignment.notes,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updatePayload);

      const updatedAssignment = await this.getAssignmentById(assignmentId) as VendorAssignment;

      // Log completion
      await ActivityLogService.createLog({
        userId: completedBy,
        userName: completedByName,
        action: 'vendor_assignment_completed',
        entityType: 'vendor_assignment',
        entityId: assignmentId,
        entityName: existingAssignment.vendorName,
        details: {
          vendorId: existingAssignment.vendorId,
          vendorName: existingAssignment.vendorName,
          userId: existingAssignment.userId,
          userName: existingAssignment.userName,
          notes
        }
      }).catch(err => console.error('Failed to log assignment completion:', err));

      return updatedAssignment;
    } catch (error) {
      console.error('Error completing assignment:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to complete assignment');
    }
  }

  /**
   * Bulk assign vendors to users
   */
  static async bulkAssignVendors(
    assignments: CreateAssignmentData[],
    assignedByName: string
  ): Promise<VendorAssignment[]> {
    try {
      const batch = writeBatch(db);
      const newAssignments: VendorAssignment[] = [];
      const now = Timestamp.now();

      for (const assignmentData of assignments) {
        // Validate assignment
        const validation = await this.validateAssignment(
          assignmentData.vendorId,
          assignmentData.userId
        );

        if (!validation.valid) {
          console.warn(`Skipping assignment for vendor ${assignmentData.vendorId}: ${validation.error}`);
          continue;
        }

        // Get user details
        const user = await UserService.getUserById(assignmentData.userId);
        if (!user) {
          console.warn(`User ${assignmentData.userId} not found, skipping`);
          continue;
        }

        const assignmentDoc = {
          vendorId: assignmentData.vendorId,
          vendorName: assignmentData.vendorName,
          userId: assignmentData.userId,
          userName: user.name,
          userEmail: user.email,
          assignedBy: assignmentData.assignedBy,
          assignedByName: assignedByName,
          assignedAt: now,
          status: 'active' as AssignmentStatus,
          notes: assignmentData.notes || '',
          createdAt: now,
          updatedAt: now
        };

        const docRef = doc(collection(db, this.COLLECTION_NAME));
        batch.set(docRef, assignmentDoc);

        newAssignments.push({
          id: docRef.id,
          ...assignmentDoc
        });
      }

      await batch.commit();

      // Log bulk assignment
      if (newAssignments.length > 0) {
        await ActivityLogService.createLog({
          userId: assignments[0].assignedBy,
          userName: assignedByName,
          action: 'vendors_bulk_assigned',
          entityType: 'vendor_assignment',
          entityId: 'bulk',
          entityName: 'Multiple Vendors',
          details: {
            count: newAssignments.length,
            vendorIds: newAssignments.map(a => a.vendorId)
          }
        }).catch(err => console.error('Failed to log bulk assignment:', err));
      }

      return newAssignments;
    } catch (error) {
      console.error('Error bulk assigning vendors:', error);
      throw new Error('Failed to bulk assign vendors');
    }
  }

  /**
   * Get assignment statistics for a user
   */
  static async getUserAssignmentStats(userId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  }> {
    try {
      const allAssignments = await this.getAssignmentsByUser(userId);
      
      return {
        total: allAssignments.length,
        active: allAssignments.filter(a => a.status === 'active').length,
        completed: allAssignments.filter(a => a.status === 'completed').length,
        cancelled: allAssignments.filter(a => a.status === 'cancelled').length
      };
    } catch (error) {
      console.error('Error getting user assignment stats:', error);
      throw new Error('Failed to retrieve assignment statistics');
    }
  }

  /**
   * Check if a vendor is currently assigned
   */
  static async isVendorAssigned(vendorId: string): Promise<boolean> {
    try {
      const activeAssignment = await this.getActiveAssignmentByVendor(vendorId);
      return activeAssignment !== null;
    } catch (error) {
      console.error('Error checking vendor assignment:', error);
      return false;
    }
  }

  /**
   * Get assignments by assignedBy user ID
   */
  static async getAssignmentsByAssigner(assignerId: string): Promise<VendorAssignment[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('assignedBy', '==', assignerId),
        orderBy('assignedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VendorAssignment[];
    } catch (error) {
      console.error('Error getting assignments by assigner:', error);
      throw new Error('Failed to retrieve assignments');
    }
  }

  /**
   * Public method to check if an assignment can be created
   */
  static async canAssignVendor(
    vendorId: string,
    userId: string
  ): Promise<{ canAssign: boolean; reason?: string }> {
    const validation = await this.validateAssignment(vendorId, userId);
    return {
      canAssign: validation.valid,
      reason: validation.error
    };
  }

  /**
   * Get user's remaining assignment capacity
   */
  static async getUserRemainingCapacity(userId: string): Promise<number> {
    try {
      const activeAssignments = await this.getAssignmentsByUser(userId, 'active');
      return Math.max(0, MAX_ASSIGNMENTS_PER_USER - activeAssignments.length);
    } catch (error) {
      console.error('Error getting user remaining capacity:', error);
      return 0;
    }
  }
}

// Export utilities
export const assignmentUtils = {
  VendorAssignmentService
};
