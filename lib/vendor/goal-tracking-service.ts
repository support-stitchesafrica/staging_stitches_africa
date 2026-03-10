/**
 * Goal Tracking Service
 * Handles performance goal setting, tracking, and progress monitoring
 */

import { adminDb as db } from '@/lib/firebase-admin';
import { PerformanceGoal } from '@/types/vendor-analytics';

export class GoalTrackingService {
  private readonly COLLECTION = 'vendor_goals';

  /**
   * Creates a new performance goal
   */
  async createGoal(
    vendorId: string,
    metric: PerformanceGoal['metric'],
    targetValue: number,
    deadline: Date
  ): Promise<PerformanceGoal> {
    const goal: Omit<PerformanceGoal, 'id'> = {
      vendorId,
      metric,
      targetValue,
      currentValue: 0,
      progress: 0,
      deadline,
      status: 'on_track',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection(this.COLLECTION).add(goal);
    
    return {
      id: docRef.id,
      ...goal
    };
  }

  /**
   * Updates goal progress based on current metrics
   */
  async updateGoalProgress(
    goalId: string,
    currentValue: number
  ): Promise<PerformanceGoal> {
    const goalRef = db.collection(this.COLLECTION).doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      throw new Error('Goal not found');
    }

    const goal = goalDoc.data() as PerformanceGoal;
    const progress = (currentValue / goal.targetValue) * 100;
    const status = this.determineGoalStatus(progress, goal.deadline);

    await goalRef.update({
      currentValue,
      progress,
      status,
      updatedAt: new Date()
    });

    return {
      ...goal,
      id: goalId,
      currentValue,
      progress,
      status,
      updatedAt: new Date()
    };
  }

  /**
   * Determines goal status based on progress and deadline
   */
  private determineGoalStatus(
    progress: number,
    deadline: Date
  ): PerformanceGoal['status'] {
    const now = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (progress >= 100) {
      return 'achieved';
    }

    if (daysUntilDeadline < 0) {
      return 'missed';
    }

    // Calculate expected progress based on time elapsed
    const totalDays = Math.ceil(
      (deadline.getTime() - new Date(deadline.getTime() - 30 * 24 * 60 * 60 * 1000).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    const daysElapsed = totalDays - daysUntilDeadline;
    const expectedProgress = (daysElapsed / totalDays) * 100;

    // If progress is significantly behind expected, mark as at_risk
    if (progress < expectedProgress - 20) {
      return 'at_risk';
    }

    return 'on_track';
  }

  /**
   * Gets all goals for a vendor
   */
  async getVendorGoals(vendorId: string): Promise<PerformanceGoal[]> {
    const snapshot = await db
      .collection(this.COLLECTION)
      .where('vendorId', '==', vendorId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PerformanceGoal));
  }

  /**
   * Gets active goals (not achieved or missed)
   */
  async getActiveGoals(vendorId: string): Promise<PerformanceGoal[]> {
    const snapshot = await db
      .collection(this.COLLECTION)
      .where('vendorId', '==', vendorId)
      .where('status', 'in', ['on_track', 'at_risk'])
      .orderBy('deadline', 'asc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PerformanceGoal));
  }

  /**
   * Deletes a goal
   */
  async deleteGoal(goalId: string): Promise<void> {
    await db.collection(this.COLLECTION).doc(goalId).delete();
  }

  /**
   * Updates a goal's target or deadline
   */
  async updateGoal(
    goalId: string,
    updates: Partial<Pick<PerformanceGoal, 'targetValue' | 'deadline'>>
  ): Promise<PerformanceGoal> {
    const goalRef = db.collection(this.COLLECTION).doc(goalId);
    const goalDoc = await goalRef.get();

    if (!goalDoc.exists) {
      throw new Error('Goal not found');
    }

    await goalRef.update({
      ...updates,
      updatedAt: new Date()
    });

    const updatedDoc = await goalRef.get();
    return {
      id: goalId,
      ...updatedDoc.data()
    } as PerformanceGoal;
  }

  /**
   * Calculates days remaining until deadline
   */
  getDaysRemaining(deadline: Date): number {
    const now = new Date();
    return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Formats goal progress for display
   */
  formatProgress(goal: PerformanceGoal): string {
    return `${goal.progress.toFixed(1)}% (${goal.currentValue} / ${goal.targetValue})`;
  }

  /**
   * Gets goal status color for UI
   */
  getStatusColor(status: PerformanceGoal['status']): string {
    switch (status) {
      case 'achieved':
        return 'text-green-600 bg-green-100';
      case 'on_track':
        return 'text-blue-600 bg-blue-100';
      case 'at_risk':
        return 'text-yellow-600 bg-yellow-100';
      case 'missed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Gets goal status label
   */
  getStatusLabel(status: PerformanceGoal['status']): string {
    switch (status) {
      case 'achieved':
        return 'Achieved';
      case 'on_track':
        return 'On Track';
      case 'at_risk':
        return 'At Risk';
      case 'missed':
        return 'Missed';
      default:
        return 'Unknown';
    }
  }

  /**
   * Gets metric display name
   */
  getMetricDisplayName(metric: PerformanceGoal['metric']): string {
    switch (metric) {
      case 'revenue':
        return 'Revenue';
      case 'orders':
        return 'Orders';
      case 'conversion_rate':
        return 'Conversion Rate';
      case 'rating':
        return 'Average Rating';
      case 'fulfillment_time':
        return 'Fulfillment Time';
      default:
        return metric;
    }
  }

  /**
   * Formats metric value for display
   */
  formatMetricValue(metric: PerformanceGoal['metric'], value: number): string {
    switch (metric) {
      case 'revenue':
        return `$${value.toLocaleString()}`;
      case 'orders':
        return value.toFixed(0);
      case 'conversion_rate':
        return `${value.toFixed(1)}%`;
      case 'rating':
        return value.toFixed(1);
      case 'fulfillment_time':
        return `${value.toFixed(1)} hours`;
      default:
        return value.toString();
    }
  }
}

// Export singleton instance
export const goalTrackingService = new GoalTrackingService();
