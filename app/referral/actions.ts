'use server';

import { ReferralService } from '@/lib/referral/referral-service';
import { ReferralCartStats } from '@/lib/referral/types';

/**
 * Server action to fetch referral cart stats
 * This wrapper allows Client Components to call the server-side ReferralService
 */
export async function getReferralCartStatsAction(userId: string): Promise<{ success: boolean; data?: ReferralCartStats[]; error?: string }> {
  try {
    const stats = await ReferralService.getReferralsWithCartStats(userId);
    // Serialize complex objects if necessary (dates are usually handled by Next.js server actions but let's be safe if they are Firestore Timestamps)
    // The types say FirestoreTimestamp | Date. Next.js serialization might choke on Firestore objects.
    // Let's ensure we return plain objects.
    const serializedStats = JSON.parse(JSON.stringify(stats)); 
    
    return { success: true, data: serializedStats };
  } catch (error) {
    console.error('Error in getReferralCartStatsAction:', error);
    return { success: false, error: 'Failed to fetch referral cart stats' };
  }
}
