// lib/services/firstSignupService.ts
import { db } from '@/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export class FirstSignupService {
  private static readonly COLLECTION_NAME = 'web_signUp';

  /**
   * Check if this would be the first signup
   * Returns true if no signups exist yet
   */
  static async isFirstSignup(): Promise<boolean> {
    try {
      const signupsQuery = query(
        collection(db, this.COLLECTION_NAME),
        limit(1)
      );
      const snapshot = await getDocs(signupsQuery);
      return snapshot.empty;
    } catch (error) {
      console.error('Error checking first signup:', error);
      // Default to false to be safe - require invitation if we can't determine
      return false;
    }
  }

  /**
   * Check if registration is allowed
   * Returns true only if this is the first signup
   */
  static async isRegistrationAllowed(): Promise<boolean> {
    return await this.isFirstSignup();
  }
}