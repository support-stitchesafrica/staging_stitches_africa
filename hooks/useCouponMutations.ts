/**
 * useCouponMutations Hook
 * Handles all coupon mutation operations (create, update, delete, resend email)
 * with optimistic updates and error handling
 */

import { useState, useCallback } from 'react';
import { auth } from '@/firebase';
import { 
  Coupon, 
  CreateCouponInput, 
  UpdateCouponInput 
} from '@/types/coupon';
import { toast } from 'sonner';

interface UseCouponMutationsReturn {
  // Create coupon
  createCoupon: (input: CreateCouponInput) => Promise<Coupon | null>;
  creating: boolean;
  createError: string | null;

  // Update coupon
  updateCoupon: (id: string, input: UpdateCouponInput) => Promise<Coupon | null>;
  updating: boolean;
  updateError: string | null;

  // Delete coupon
  deleteCoupon: (id: string) => Promise<boolean>;
  deleting: boolean;
  deleteError: string | null;

  // Resend email
  resendEmail: (id: string) => Promise<boolean>;
  resending: boolean;
  resendError: string | null;

  // Generate coupon code
  generateCode: () => Promise<string | null>;
  generating: boolean;
  generateError: string | null;

  // Clear all errors
  clearErrors: () => void;
}

export function useCouponMutations(): UseCouponMutationsReturn {
  // Create coupon state
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Update coupon state
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Delete coupon state
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Resend email state
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  // Generate code state
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  /**
   * Get authenticated user token
   */
  const getAuthToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) {
      toast.error('You must be logged in');
      return null;
    }
    return await user.getIdToken();
  };

  /**
   * Create a new coupon
   */
  const createCoupon = useCallback(async (input: CreateCouponInput): Promise<Coupon | null> => {
    try {
      setCreating(true);
      setCreateError(null);

      const token = await getAuthToken();
      if (!token) return null;

      const response = await fetch('/api/atlas/coupons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create coupon');
      }

      const data = await response.json();
      toast.success('Coupon created successfully!');
      return data.coupon;
    } catch (err: any) {
      console.error('Error creating coupon:', err);
      const errorMessage = err.message || 'Failed to create coupon';
      setCreateError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  /**
   * Update an existing coupon
   */
  const updateCoupon = useCallback(async (
    id: string, 
    input: UpdateCouponInput
  ): Promise<Coupon | null> => {
    try {
      setUpdating(true);
      setUpdateError(null);

      const token = await getAuthToken();
      if (!token) return null;

      const response = await fetch(`/api/atlas/coupons/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update coupon');
      }

      const data = await response.json();
      toast.success('Coupon updated successfully!');
      return data.coupon;
    } catch (err: any) {
      console.error('Error updating coupon:', err);
      const errorMessage = err.message || 'Failed to update coupon';
      setUpdateError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setUpdating(false);
    }
  }, []);

  /**
   * Delete a coupon
   */
  const deleteCoupon = useCallback(async (id: string): Promise<boolean> => {
    try {
      setDeleting(true);
      setDeleteError(null);

      const token = await getAuthToken();
      if (!token) return false;

      const response = await fetch(`/api/atlas/coupons/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete coupon');
      }

      toast.success('Coupon deleted successfully!');
      return true;
    } catch (err: any) {
      console.error('Error deleting coupon:', err);
      const errorMessage = err.message || 'Failed to delete coupon';
      setDeleteError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setDeleting(false);
    }
  }, []);

  /**
   * Resend coupon email
   */
  const resendEmail = useCallback(async (id: string): Promise<boolean> => {
    try {
      setResending(true);
      setResendError(null);

      const token = await getAuthToken();
      if (!token) return false;

      const response = await fetch(`/api/atlas/coupons/${id}/resend-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend email');
      }

      toast.success('Email sent successfully!');
      return true;
    } catch (err: any) {
      console.error('Error resending email:', err);
      const errorMessage = err.message || 'Failed to resend email';
      setResendError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setResending(false);
    }
  }, []);

  /**
   * Generate a unique coupon code
   */
  const generateCode = useCallback(async (): Promise<string | null> => {
    try {
      setGenerating(true);
      setGenerateError(null);

      const token = await getAuthToken();
      if (!token) return null;

      const response = await fetch('/api/atlas/coupons/generate-code', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate code');
      }

      const data = await response.json();
      return data.couponCode; // API returns couponCode, not code
    } catch (err: any) {
      console.error('Error generating code:', err);
      const errorMessage = err.message || 'Failed to generate code';
      setGenerateError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setCreateError(null);
    setUpdateError(null);
    setDeleteError(null);
    setResendError(null);
    setGenerateError(null);
  }, []);

  return {
    // Create
    createCoupon,
    creating,
    createError,

    // Update
    updateCoupon,
    updating,
    updateError,

    // Delete
    deleteCoupon,
    deleting,
    deleteError,

    // Resend email
    resendEmail,
    resending,
    resendError,

    // Generate code
    generateCode,
    generating,
    generateError,

    // Utilities
    clearErrors
  };
}
