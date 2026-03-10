
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc,
  getDocs, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/firebase';
import { TailorStoryboard, CreateTailorStoryboardData } from '@/types/tailor-storyboard';

export class TailorStoryboardService {
  private static readonly COLLECTION_NAME = 'tailor_storyboards';

  /**
   * Create a new tailor storyboard
   */
  static async createStoryboard(data: CreateTailorStoryboardData, userId: string): Promise<TailorStoryboard> {
    try {
      const now = Timestamp.now();
      
      const storyboardData = {
        title: data.title,
        tailorId: data.tailorId,
        tailorName: data.tailorName,
        tailorDescription: data.tailorDescription,
        tailorLogo: data.tailorLogo || null,
        productIds: data.productIds,
        active: data.active ?? true,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        productsCount: data.productIds.length,
        previewImage: data.previewImage || null,
        bannerImage: data.bannerImage || null
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), storyboardData);
      
      return {
        id: docRef.id,
        ...storyboardData
      } as TailorStoryboard;
    } catch (error) {
      console.error('Error creating tailor storyboard:', error);
      throw new Error('Failed to create tailor storyboard');
    }
  }

  /**
   * Get storyboard by ID
   */
  static async getStoryboardById(id: string): Promise<TailorStoryboard | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as TailorStoryboard;
    } catch (error) {
      console.error('Error getting tailor storyboard:', error);
      throw new Error('Failed to retrieve tailor storyboard');
    }
  }

  /**
   * Get all storyboards
   */
  static async getAllStoryboards(): Promise<TailorStoryboard[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TailorStoryboard[];
    } catch (error) {
      console.error('Error getting all tailor storyboards:', error);
      throw new Error('Failed to retrieve tailor storyboards');
    }
  }

  /**
   * Get all active storyboards for frontend display
   */
  static async getActiveStoryboards(): Promise<TailorStoryboard[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TailorStoryboard[];
    } catch (error) {
      console.error('Error getting active tailor storyboards:', error);
      throw new Error('Failed to retrieve active tailor storyboards');
    }
  }

  /**
   * Update storyboard
   */
  static async updateStoryboard(id: string, updates: Partial<CreateTailorStoryboardData>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const updateData: DocumentData = {
        updatedAt: Timestamp.now(),
        ...updates
      };
      
      // Update product count if products are updated
      if (updates.productIds) {
        updateData.productsCount = updates.productIds.length;
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating tailor storyboard:', error);
      throw new Error('Failed to update tailor storyboard');
    }
  }

  /**
   * Delete storyboard
   */
  static async deleteStoryboard(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting tailor storyboard:', error);
      throw new Error('Failed to delete tailor storyboard');
    }
  }
}
