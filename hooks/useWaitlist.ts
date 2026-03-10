/**
 * Waitlist Management Hook
 * Client-side hook for waitlist operations
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Waitlist, 
  WaitlistDashboardData, 
  WaitlistSignup, 
  WaitlistAnalytics,
  CreateWaitlistForm,
  WaitlistApiResponse 
} from '@/types/waitlist';

interface UseWaitlistOptions {
  autoLoad?: boolean;
}

export function useWaitlist(options: UseWaitlistOptions = {}) {
  const { autoLoad = false } = options;
  
  const [waitlists, setWaitlists] = useState<Waitlist[]>([]);
  const [dashboardData, setDashboardData] = useState<WaitlistDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all waitlists
  const loadWaitlists = useCallback(async (publishedOnly = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = publishedOnly ? '/api/waitlist?published=true' : '/api/waitlist';
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setWaitlists(result.data);
      } else {
        setError(result.error || 'Failed to load waitlists');
      }
    } catch (err) {
      setError('Failed to load waitlists');
      console.error('Load waitlists error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/waitlist/dashboard');
      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
        setWaitlists(result.data.waitlists);
      } else {
        setError(result.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Load dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create waitlist
  const createWaitlist = useCallback(async (
    waitlistData: CreateWaitlistForm, 
    createdBy: string
  ): Promise<WaitlistApiResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          waitlistData,
          createdBy
        })
      });

      const result = await response.json();

      if (result.success) {
        // Refresh data
        await loadDashboardData();
      }

      return result;
    } catch (err) {
      const error = 'Failed to create waitlist';
      setError(error);
      console.error('Create waitlist error:', err);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [loadDashboardData]);

  // Update waitlist
  const updateWaitlist = useCallback(async (
    id: string,
    waitlistData: Partial<CreateWaitlistForm>,
    updatedBy: string
  ): Promise<WaitlistApiResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/waitlist/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          waitlistData,
          updatedBy
        })
      });

      const result = await response.json();

      if (result.success) {
        // Refresh data
        await loadDashboardData();
      }

      return result;
    } catch (err) {
      const error = 'Failed to update waitlist';
      setError(error);
      console.error('Update waitlist error:', err);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [loadDashboardData]);

  // Delete waitlist
  const deleteWaitlist = useCallback(async (id: string): Promise<WaitlistApiResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/waitlist/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        // Refresh data
        await loadDashboardData();
      }

      return result;
    } catch (err) {
      const error = 'Failed to delete waitlist';
      setError(error);
      console.error('Delete waitlist error:', err);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [loadDashboardData]);

  // Publish waitlist
  const publishWaitlist = useCallback(async (id: string): Promise<WaitlistApiResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/waitlist/${id}/publish`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        // Refresh data
        await loadDashboardData();
      }

      return result;
    } catch (err) {
      const error = 'Failed to publish waitlist';
      setError(error);
      console.error('Publish waitlist error:', err);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [loadDashboardData]);

  // Archive waitlist
  const archiveWaitlist = useCallback(async (id: string): Promise<WaitlistApiResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/waitlist/${id}/archive`, {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        // Refresh data
        await loadDashboardData();
      }

      return result;
    } catch (err) {
      const error = 'Failed to archive waitlist';
      setError(error);
      console.error('Archive waitlist error:', err);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [loadDashboardData]);

  // Get waitlist by ID
  const getWaitlist = useCallback(async (id: string): Promise<Waitlist | null> => {
    try {
      const response = await fetch(`/api/waitlist/${id}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        setError(result.error || 'Failed to load waitlist');
        return null;
      }
    } catch (err) {
      setError('Failed to load waitlist');
      console.error('Get waitlist error:', err);
      return null;
    }
  }, []);

  // Get waitlist signups
  const getWaitlistSignups = useCallback(async (id: string): Promise<WaitlistSignup[]> => {
    try {
      const response = await fetch(`/api/waitlist/${id}/signups`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        setError(result.error || 'Failed to load signups');
        return [];
      }
    } catch (err) {
      setError('Failed to load signups');
      console.error('Get signups error:', err);
      return [];
    }
  }, []);

  // Get waitlist analytics
  const getWaitlistAnalytics = useCallback(async (id: string): Promise<WaitlistAnalytics | null> => {
    try {
      const response = await fetch(`/api/waitlist/${id}/analytics`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        setError(result.error || 'Failed to load analytics');
        return null;
      }
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Get analytics error:', err);
      return null;
    }
  }, []);

  // Export signups
  const exportSignups = useCallback(async (id?: string): Promise<string | null> => {
    try {
      const url = id ? `/api/waitlist/${id}/signups?format=csv` : '/api/waitlist/signups?format=csv';
      const response = await fetch(url);

      if (response.ok) {
        return await response.text();
      } else {
        setError('Failed to export signups');
        return null;
      }
    } catch (err) {
      setError('Failed to export signups');
      console.error('Export signups error:', err);
      return null;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad) {
      loadDashboardData();
    }
  }, [autoLoad, loadDashboardData]);

  return {
    // State
    waitlists,
    dashboardData,
    loading,
    error,

    // Actions
    loadWaitlists,
    loadDashboardData,
    createWaitlist,
    updateWaitlist,
    deleteWaitlist,
    publishWaitlist,
    archiveWaitlist,
    getWaitlist,
    getWaitlistSignups,
    getWaitlistAnalytics,
    exportSignups,
    clearError
  };
}

// Hook for countdown timer
export function useCountdown(targetDate: Date | string | number) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const target = typeof targetDate === 'string' || typeof targetDate === 'number' 
        ? new Date(targetDate).getTime() 
        : targetDate.getTime();
      
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}