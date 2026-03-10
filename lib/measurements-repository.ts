import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { UserMeasurements } from '@/types/measurements';

export class MeasurementsRepository {
  private collectionName = 'users_measurements';

  /**
   * Get user measurements by userId
   */
  async getUserMeasurements(userId: string): Promise<UserMeasurements | null> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.collectionName, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          userId,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserMeasurements;
      }
      return null;
    } catch (error) {
      console.error('Error getting user measurements:', error);
      throw new Error('Failed to get user measurements');
    }
  }

  /**
   * Save or update user measurements
   */
  async saveUserMeasurements(userId: string, measurements: Partial<UserMeasurements['volume_params']>, options?: {
    task_set_url?: string;
    manual_input?: string;
  }): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.collectionName, userId);
      
      // Check if measurements already exist
      const existingDoc = await getDoc(docRef);
      const now = new Date();
      
      if (existingDoc.exists()) {
        // Update existing measurements
        const existingData = existingDoc.data() as UserMeasurements;
        const updatedData: Partial<UserMeasurements> = {
          volume_params: {
            ...existingData.volume_params,
            ...measurements,
          },
          updatedAt: now,
          ...(options?.task_set_url && { task_set_url: options.task_set_url }),
          ...(options?.manual_input && { manual_input: options.manual_input }),
        };
        
        await updateDoc(docRef, updatedData as any);
      } else {
        // Create new measurements document
        const newMeasurements: UserMeasurements = {
          userId,
          task_set_url: options?.task_set_url || 'manual_input',
          manual_input: options?.manual_input || 'user_entered',
          volume_params: {
            abdomen: 0,
            alternative_waist_girth: 0,
            ankle: 0,
            armscye_girth: 0,
            bicep: 0,
            calf: 0,
            chest: 0,
            elbow_girth: 0,
            forearm: 0,
            high_hips: 0,
            knee: 0,
            low_hips: 0,
            mid_thigh_girth: 0,
            neck: 0,
            neck_girth: 0,
            neck_girth_relaxed: 0,
            overarm_girth: 0,
            pant_waist: 0,
            thigh: 0,
            thigh_1_inch_below_crotch: 0,
            under_bust_girth: 0,
            upper_bicep_girth: 0,
            upper_chest_girth: 0,
            upper_knee_girth: 0,
            waist: 0,
            waist_gray: 0,
            waist_green: 0,
            wrist: 0,
            ...measurements,
          },
          createdAt: now,
          updatedAt: now,
        };
        
        await setDoc(docRef, newMeasurements);
      }
    } catch (error) {
      console.error('Error saving user measurements:', error);
      throw new Error('Failed to save user measurements');
    }
  }

  /**
   * Update specific measurement fields
   */
  async updateMeasurements(userId: string, measurements: Partial<UserMeasurements['volume_params']>): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.collectionName, userId);
      
      const existingDoc = await getDoc(docRef);
      if (!existingDoc.exists()) {
        throw new Error('Measurements not found for user');
      }
      
      const existingData = existingDoc.data() as UserMeasurements;
      const updatedData = {
        volume_params: {
          ...existingData.volume_params,
          ...measurements,
        },
        updatedAt: new Date(),
      };
      
      await updateDoc(docRef, updatedData);
    } catch (error) {
      console.error('Error updating measurements:', error);
      throw new Error('Failed to update measurements');
    }
  }

  /**
   * Check if user has measurements
   */
  async hasMeasurements(userId: string): Promise<boolean> {
    try {
      const measurements = await this.getUserMeasurements(userId);
      return measurements !== null;
    } catch (error) {
      console.error('Error checking if user has measurements:', error);
      return false;
    }
  }

  /**
   * Get the most recent measurements for a user (for bespoke orders)
   */
  async getRecentMeasurements(userId: string): Promise<UserMeasurements | null> {
    try {
      // Since we're using userId as document ID, this is the same as getUserMeasurements
      // But this method is more semantic for order placement
      return await this.getUserMeasurements(userId);
    } catch (error) {
      console.error('Error getting recent measurements:', error);
      throw new Error('Failed to get recent measurements');
    }
  }

  /**
   * Delete user measurements
   */
  async deleteMeasurements(userId: string): Promise<void> {
    try {
      const db = await getFirebaseDb();
      const docRef = doc(db, this.collectionName, userId);
      
      // Instead of deleting, we'll clear the measurements but keep the document
      const clearedMeasurements = {
        volume_params: {
          abdomen: 0,
          alternative_waist_girth: 0,
          ankle: 0,
          armscye_girth: 0,
          bicep: 0,
          calf: 0,
          chest: 0,
          elbow_girth: 0,
          forearm: 0,
          high_hips: 0,
          knee: 0,
          low_hips: 0,
          mid_thigh_girth: 0,
          neck: 0,
          neck_girth: 0,
          neck_girth_relaxed: 0,
          overarm_girth: 0,
          pant_waist: 0,
          thigh: 0,
          thigh_1_inch_below_crotch: 0,
          under_bust_girth: 0,
          upper_bicep_girth: 0,
          upper_chest_girth: 0,
          upper_knee_girth: 0,
          waist: 0,
          waist_gray: 0,
          waist_green: 0,
          wrist: 0,
        },
        updatedAt: new Date(),
      };
      
      await updateDoc(docRef, clearedMeasurements);
    } catch (error) {
      console.error('Error clearing measurements:', error);
      throw new Error('Failed to clear measurements');
    }
  }

  /**
   * Validate measurements data
   */
  validateMeasurements(measurements: Partial<UserMeasurements['volume_params']>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    Object.entries(measurements).forEach(([key, value]) => {
      if (typeof value === 'number') {
        if (value < 0) {
          errors.push(`${key} cannot be negative`);
        }
        if (value > 100) { // Reasonable upper limit
          errors.push(`${key} seems too large (${value} inches)`);
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const measurementsRepository = new MeasurementsRepository();