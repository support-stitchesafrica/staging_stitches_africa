// lib/services/signupCounterService.ts
import { db } from '@/firebase';
import { collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';

export interface SignupRecord {
  userId: string;
  email: string;
  registration_country: string;
  registration_state: string;
  registration_city?: string;
  registration_ip?: string;
  timezone?: string;
  language?: string;
  registration_method: 'email' | 'google';
  timestamp: Timestamp;
}

export class SignupCounterService {
  private static readonly COLLECTION_NAME = 'web_signUp';

  /**
   * Record a new user signup
   */
  static async recordSignup(data: Omit<SignupRecord, 'timestamp'>): Promise<void> {
    try {
      const signupData: SignupRecord = {
        ...data,
        timestamp: Timestamp.now(),
      };

      await addDoc(collection(db, this.COLLECTION_NAME), signupData);
      
      console.log('Signup recorded successfully');
    } catch (error) {
      console.error('Error recording signup:', error);
      // Don't throw error to prevent signup failure if counter fails
    }
  }

  /**
   * Get total signup count (requires Firestore query)
   * Note: This should be called from a server-side function for better performance
   */
  static async getTotalSignups(): Promise<number> {
    try {
      const { getDocs, query, collection: firestoreCollection } = await import('firebase/firestore');
      const signupsQuery = query(firestoreCollection(db, this.COLLECTION_NAME));
      const snapshot = await getDocs(signupsQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting signup count:', error);
      return 0;
    }
  }
}
