import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { measurementsRepository } from '@/lib/measurements-repository';
import { UserMeasurements } from '@/types/measurements';

export const useMeasurements = () => {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<UserMeasurements | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeasurements = async () => {
    if (!user) {
      setMeasurements(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const userMeasurements = await measurementsRepository.getUserMeasurements(user.uid);
      setMeasurements(userMeasurements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load measurements');
      setMeasurements(null);
    } finally {
      setLoading(false);
    }
  };

  const saveMeasurements = async (measurementData: Partial<UserMeasurements['volume_params']>) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      await measurementsRepository.saveUserMeasurements(user.uid, measurementData);
      await loadMeasurements(); // Reload to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save measurements');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMeasurements = async (measurementData: Partial<UserMeasurements['volume_params']>) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      await measurementsRepository.updateMeasurements(user.uid, measurementData);
      await loadMeasurements(); // Reload to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update measurements');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const hasMeasurements = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      return await measurementsRepository.hasMeasurements(user.uid);
    } catch (err) {
      console.error('Error checking measurements:', err);
      return false;
    }
  };

  const getRecentMeasurements = async (): Promise<UserMeasurements | null> => {
    if (!user) return null;
    
    try {
      return await measurementsRepository.getRecentMeasurements(user.uid);
    } catch (err) {
      console.error('Error getting recent measurements:', err);
      return null;
    }
  };

  useEffect(() => {
    loadMeasurements();
  }, [user]);

  return {
    measurements,
    loading,
    error,
    loadMeasurements,
    saveMeasurements,
    updateMeasurements,
    hasMeasurements,
    getRecentMeasurements,
  };
};