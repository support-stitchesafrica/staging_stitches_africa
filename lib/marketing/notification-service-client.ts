/**
 * Notification Service Client
 * Client-side service for managing marketing notifications
 */

import { db } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  updateDoc,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import type { Notification } from './types';

export class NotificationServiceClient {
  private static readonly COLLECTION = 'marketing_notifications';

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(
    userId: string, 
    limitCount: number = 50
  ): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, this.COLLECTION);
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const notificationsRef = collection(db, this.COLLECTION);
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, this.COLLECTION, notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsRef = collection(db, this.COLLECTION);
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return;
      }

      const batch = writeBatch(db);
      const now = Timestamp.now();

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          readAt: now
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}
