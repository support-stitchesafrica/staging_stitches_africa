import { getAuth } from 'firebase-admin/auth';

/**
 * Authentication and Custom Claims Management for Hierarchical Referral System
 */

export interface HierarchicalReferralClaims {
  hierarchicalReferral: boolean;
  influencerType: 'mother' | 'mini';
  canCreateSubCodes: boolean;
  canAccessDashboard: boolean;
  canViewEarnings: boolean;
  canManageProfile: boolean;
  canAccessAdminPanel?: boolean;
}

/**
 * Set custom user claims for hierarchical referral system
 */
export async function setCustomUserClaims(
  uid: string, 
  claims: HierarchicalReferralClaims
): Promise<void> {
  try {
    const auth = getAuth();
    await auth.setCustomUserClaims(uid, claims);
  } catch (error) {
    console.error('Error setting custom user claims:', error);
    throw error;
  }
}

/**
 * Get custom user claims for a user
 */
export async function getCustomUserClaims(uid: string): Promise<HierarchicalReferralClaims | null> {
  try {
    const auth = getAuth();
    const userRecord = await auth.getUser(uid);
    return userRecord.customClaims as HierarchicalReferralClaims || null;
  } catch (error) {
    console.error('Error getting custom user claims:', error);
    return null;
  }
}

/**
 * Verify user has hierarchical referral permissions
 */
export async function verifyHierarchicalReferralAccess(uid: string): Promise<boolean> {
  try {
    const claims = await getCustomUserClaims(uid);
    return claims?.hierarchicalReferral === true;
  } catch (error) {
    console.error('Error verifying hierarchical referral access:', error);
    return false;
  }
}

/**
 * Verify user is a Mother Influencer
 */
export async function verifyMotherInfluencerAccess(uid: string): Promise<boolean> {
  try {
    const claims = await getCustomUserClaims(uid);
    return claims?.hierarchicalReferral === true && claims?.influencerType === 'mother';
  } catch (error) {
    console.error('Error verifying Mother Influencer access:', error);
    return false;
  }
}

/**
 * Verify user is a Mini Influencer
 */
export async function verifyMiniInfluencerAccess(uid: string): Promise<boolean> {
  try {
    const claims = await getCustomUserClaims(uid);
    return claims?.hierarchicalReferral === true && claims?.influencerType === 'mini';
  } catch (error) {
    console.error('Error verifying Mini Influencer access:', error);
    return false;
  }
}

/**
 * Verify user can create sub codes (Mother Influencers only)
 */
export async function verifySubCodeCreationAccess(uid: string): Promise<boolean> {
  try {
    const claims = await getCustomUserClaims(uid);
    return claims?.hierarchicalReferral === true && claims?.canCreateSubCodes === true;
  } catch (error) {
    console.error('Error verifying sub code creation access:', error);
    return false;
  }
}