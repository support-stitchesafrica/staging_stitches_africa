/**
 * VVIP Service
 * Handles VVIP user status checking and manual payment functionality
 */

import { db } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export interface VvipUser {
  userId: string;
  email: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  createdBy: string;
  createdByEmail: string;
}

export class VvipService {
  /**
   * Check if a user is a VVIP shopper using the API endpoint
   * @param userId - The user ID to check
   * @returns Promise<boolean> - True if user is VVIP
   */
  static async isVvipUser(userId: string): Promise<boolean> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        return false;
      }

      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/vvip/status', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to check VVIP status:', response.status);
        return false;
      }

      const data = await response.json();
      return data.isVvip || false;
    } catch (error) {
      console.error('Error checking VVIP status:', error);
      return false;
    }
  }

  /**
   * Get VVIP user details using the API endpoint
   * @param userId - The user ID to get details for
   * @returns Promise<VvipUser | null> - VVIP user details or null if not VVIP
   */
  static async getVvipUser(userId: string): Promise<VvipUser | null> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        return null;
      }

      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/vvip/status', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to get VVIP user details:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (!data.isVvip || !data.vvipDetails) {
        return null;
      }

      return {
        userId: data.vvipDetails.userId,
        email: data.vvipDetails.email,
        name: data.vvipDetails.name,
        status: data.vvipDetails.status,
        createdAt: new Date(data.vvipDetails.createdAt),
        createdBy: data.vvipDetails.createdBy,
        createdByEmail: data.vvipDetails.createdByEmail,
      };
    } catch (error) {
      console.error('Error getting VVIP user details:', error);
      return null;
    }
  }

  /**
   * Submit a manual payment request for VVIP users
   * @param orderData - Order data for manual payment
   * @returns Promise<string> - Order ID
   */
  static async submitManualPaymentRequest(orderData: {
    userId: string;
    items: any[];
    totalAmount: number;
    shippingAddress: any;
    shippingCost: number;
    currency: string;
    measurements?: any;
  }): Promise<string> {
    try {
      const orderId = `VVIP-${Date.now()}`;
      
      // In a real implementation, you would save this to Firestore
      // For now, we'll just log it and return the order ID
      console.log('Manual payment request submitted:', {
        orderId,
        ...orderData,
        status: 'pending_payment',
        submittedAt: new Date(),
      });

      return orderId;
    } catch (error) {
      console.error('Error submitting manual payment request:', error);
      throw new Error('Failed to submit manual payment request');
    }
  }
}