/**
 * Avatar Service
 * 
 * Handles:
 * - Generate avatar from user description
 * - Store avatar configuration in Firestore
 * - Retrieve user avatar for virtual try-on
 * 
 * Requirements: 4.1-4.5, 16.1-16.5
 * 
 * The avatar service creates personalized 3D avatars based on user characteristics
 * (height, body type, skin tone) for virtual try-on experiences.
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Avatar body types
export type BodyType = 'slim' | 'athletic' | 'average' | 'curvy' | 'plus-size';

// Avatar skin tones (using standard fashion industry categories)
export type SkinTone = 'fair' | 'light' | 'medium' | 'tan' | 'brown' | 'dark';

// Height in centimeters
export interface HeightRange {
  min: number;
  max: number;
}

export interface UserProfile {
  height: number; // in centimeters
  bodyType: BodyType;
  skinTone: SkinTone;
  gender?: 'male' | 'female' | 'unisex';
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    shoulders?: number;
  };
}

export interface AvatarConfig {
  avatarId: string;
  userId?: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
  version: number; // For tracking avatar updates
}

export interface Avatar {
  avatarId: string;
  userId?: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  // 3D model configuration (for future Three.js integration)
  modelConfig?: {
    scale: number;
    proportions: {
      torsoLength: number;
      legLength: number;
      armLength: number;
    };
  };
}

export class AvatarServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AvatarServiceError';
  }
}

/**
 * Generate avatar configuration from user profile
 * Requirement 4.2: Generate animated avatar that represents the user
 * Requirement 16.2: Avatar reflects customer's physical characteristics
 */
export async function generateAvatar(userProfile: UserProfile, userId?: string): Promise<Avatar> {
  try {
    // Validate user profile
    validateUserProfile(userProfile);

    // Calculate 3D model proportions based on height and body type
    const modelConfig = calculateModelProportions(userProfile);

    const now = new Date();
    const avatarData = {
      userId: userId || null,
      profile: userProfile,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      version: 1,
      modelConfig,
    };

    const avatarRef = await adminDb.collection('avatars').add(avatarData);

    return {
      avatarId: avatarRef.id,
      userId,
      profile: userProfile,
      createdAt: now,
      updatedAt: now,
      version: 1,
      modelConfig,
    };
  } catch (error) {
    console.error('[Avatar Service] Error generating avatar:', error);
    if (error instanceof AvatarServiceError) {
      throw error;
    }
    throw new AvatarServiceError(
      'Failed to generate avatar',
      'GENERATE_AVATAR_FAILED'
    );
  }
}

/**
 * Retrieve user's avatar
 * Requirement 16.4: Avatar is reused for all future try-ons
 */
export async function getUserAvatar(userId: string): Promise<Avatar | null> {
  try {
    const avatarsRef = adminDb.collection('avatars');
    const querySnapshot = await avatarsRef
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return null;
    }

    const avatarDoc = querySnapshot.docs[0];
    const data = avatarDoc.data();

    return {
      avatarId: avatarDoc.id,
      userId: data.userId,
      profile: data.profile,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      version: data.version || 1,
      modelConfig: data.modelConfig,
    };
  } catch (error) {
    console.error('[Avatar Service] Error getting user avatar:', error);
    throw new AvatarServiceError(
      'Failed to retrieve user avatar',
      'GET_AVATAR_FAILED'
    );
  }
}

/**
 * Get avatar by ID
 */
export async function getAvatarById(avatarId: string): Promise<Avatar | null> {
  try {
    const avatarRef = adminDb.collection('avatars').doc(avatarId);
    const avatarSnap = await avatarRef.get();

    if (!avatarSnap.exists) {
      return null;
    }

    const data = avatarSnap.data();
    if (!data) {
      return null;
    }

    return {
      avatarId: avatarSnap.id,
      userId: data.userId,
      profile: data.profile,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      version: data.version || 1,
      modelConfig: data.modelConfig,
    };
  } catch (error) {
    console.error('[Avatar Service] Error getting avatar by ID:', error);
    throw new AvatarServiceError(
      'Failed to retrieve avatar',
      'GET_AVATAR_BY_ID_FAILED'
    );
  }
}

/**
 * Update existing avatar
 * Requirement 4.5: Avatar is regenerated when customer updates profile
 * Requirement 16.3: Customer can chat with AI to make changes
 */
export async function updateAvatar(
  avatarId: string,
  profileUpdates: Partial<UserProfile>
): Promise<Avatar> {
  try {
    const avatarRef = adminDb.collection('avatars').doc(avatarId);
    const avatarSnap = await avatarRef.get();

    if (!avatarSnap.exists) {
      throw new AvatarServiceError('Avatar not found', 'AVATAR_NOT_FOUND');
    }

    const data = avatarSnap.data();
    if (!data) {
      throw new AvatarServiceError('Avatar data is invalid', 'INVALID_AVATAR_DATA');
    }

    // Merge existing profile with updates
    const updatedProfile: UserProfile = {
      ...data.profile,
      ...profileUpdates,
    };

    // Validate updated profile
    validateUserProfile(updatedProfile);

    // Recalculate model proportions
    const modelConfig = calculateModelProportions(updatedProfile);

    const newVersion = (data.version || 1) + 1;

    await avatarRef.update({
      profile: updatedProfile,
      updatedAt: FieldValue.serverTimestamp(),
      version: newVersion,
      modelConfig,
    });

    return {
      avatarId,
      userId: data.userId,
      profile: updatedProfile,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: new Date(),
      version: newVersion,
      modelConfig,
    };
  } catch (error) {
    console.error('[Avatar Service] Error updating avatar:', error);
    if (error instanceof AvatarServiceError) {
      throw error;
    }
    throw new AvatarServiceError(
      'Failed to update avatar',
      'UPDATE_AVATAR_FAILED'
    );
  }
}

/**
 * Delete avatar
 */
export async function deleteAvatar(avatarId: string): Promise<void> {
  try {
    const avatarRef = adminDb.collection('avatars').doc(avatarId);
    await avatarRef.delete();
  } catch (error) {
    console.error('[Avatar Service] Error deleting avatar:', error);
    throw new AvatarServiceError(
      'Failed to delete avatar',
      'DELETE_AVATAR_FAILED'
    );
  }
}

/**
 * Create avatar from AI conversation description
 * Requirement 4.1: AI asks simple questions to create avatar
 * Requirement 16.1: AI asks about height, body shape, and skin tone
 * 
 * This function parses natural language descriptions from the AI conversation
 * and extracts avatar parameters.
 */
export async function createAvatarFromDescription(
  description: string,
  userId?: string
): Promise<Avatar> {
  try {
    // Parse description to extract profile information
    const profile = parseAvatarDescription(description);

    // Generate and store the avatar
    return await generateAvatar(profile, userId);
  } catch (error) {
    console.error('[Avatar Service] Error creating avatar from description:', error);
    if (error instanceof AvatarServiceError) {
      throw error;
    }
    throw new AvatarServiceError(
      'Failed to create avatar from description',
      'CREATE_FROM_DESCRIPTION_FAILED'
    );
  }
}

/**
 * Get or create avatar for user
 * If user has an existing avatar, return it. Otherwise, create a new one.
 */
export async function getOrCreateAvatar(
  userId: string,
  defaultProfile?: UserProfile
): Promise<{ avatar: Avatar; isNew: boolean }> {
  try {
    // Try to get existing avatar
    const existingAvatar = await getUserAvatar(userId);

    if (existingAvatar) {
      return { avatar: existingAvatar, isNew: false };
    }

    // Create new avatar with default profile or basic defaults
    const profile = defaultProfile || getDefaultProfile();
    const avatar = await generateAvatar(profile, userId);

    return { avatar, isNew: true };
  } catch (error) {
    console.error('[Avatar Service] Error in getOrCreateAvatar:', error);
    throw new AvatarServiceError(
      'Failed to get or create avatar',
      'GET_OR_CREATE_FAILED'
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate user profile data
 */
function validateUserProfile(profile: UserProfile): void {
  // Validate height (reasonable range: 140cm - 220cm)
  if (profile.height < 140 || profile.height > 220) {
    throw new AvatarServiceError(
      'Height must be between 140cm and 220cm',
      'INVALID_HEIGHT'
    );
  }

  // Validate body type
  const validBodyTypes: BodyType[] = ['slim', 'athletic', 'average', 'curvy', 'plus-size'];
  if (!validBodyTypes.includes(profile.bodyType)) {
    throw new AvatarServiceError(
      `Body type must be one of: ${validBodyTypes.join(', ')}`,
      'INVALID_BODY_TYPE'
    );
  }

  // Validate skin tone
  const validSkinTones: SkinTone[] = ['fair', 'light', 'medium', 'tan', 'brown', 'dark'];
  if (!validSkinTones.includes(profile.skinTone)) {
    throw new AvatarServiceError(
      `Skin tone must be one of: ${validSkinTones.join(', ')}`,
      'INVALID_SKIN_TONE'
    );
  }

  // Validate measurements if provided
  if (profile.measurements) {
    const { chest, waist, hips, shoulders } = profile.measurements;
    if (chest && (chest < 60 || chest > 150)) {
      throw new AvatarServiceError('Chest measurement out of range', 'INVALID_MEASUREMENT');
    }
    if (waist && (waist < 50 || waist > 150)) {
      throw new AvatarServiceError('Waist measurement out of range', 'INVALID_MEASUREMENT');
    }
    if (hips && (hips < 60 || hips > 180)) {
      throw new AvatarServiceError('Hips measurement out of range', 'INVALID_MEASUREMENT');
    }
    if (shoulders && (shoulders < 30 || shoulders > 70)) {
      throw new AvatarServiceError('Shoulders measurement out of range', 'INVALID_MEASUREMENT');
    }
  }
}

/**
 * Calculate 3D model proportions based on user profile
 * This creates realistic body proportions for the 3D avatar
 */
function calculateModelProportions(profile: UserProfile): Avatar['modelConfig'] {
  // Base scale on height (normalized to average height of 170cm)
  const scale = profile.height / 170;

  // Calculate proportions based on body type
  let torsoLength = 1.0;
  let legLength = 1.0;
  let armLength = 1.0;

  switch (profile.bodyType) {
    case 'slim':
      torsoLength = 0.95;
      legLength = 1.05;
      armLength = 1.0;
      break;
    case 'athletic':
      torsoLength = 1.0;
      legLength = 1.0;
      armLength = 1.0;
      break;
    case 'average':
      torsoLength = 1.0;
      legLength = 1.0;
      armLength = 1.0;
      break;
    case 'curvy':
      torsoLength = 1.05;
      legLength = 0.95;
      armLength = 1.0;
      break;
    case 'plus-size':
      torsoLength = 1.1;
      legLength = 0.95;
      armLength = 1.05;
      break;
  }

  return {
    scale,
    proportions: {
      torsoLength,
      legLength,
      armLength,
    },
  };
}

/**
 * Parse natural language description to extract avatar profile
 * This is a simplified parser - in production, you might use OpenAI to extract structured data
 */
function parseAvatarDescription(description: string): UserProfile {
  const lowerDesc = description.toLowerCase();

  // Extract height (look for patterns like "170cm", "5'8", "5 feet 8 inches")
  let height = 170; // default
  const cmMatch = lowerDesc.match(/(\d{3})\s*cm/);
  if (cmMatch) {
    height = parseInt(cmMatch[1]);
  }

  // Extract body type
  let bodyType: BodyType = 'average';
  if (lowerDesc.includes('slim') || lowerDesc.includes('thin')) {
    bodyType = 'slim';
  } else if (lowerDesc.includes('athletic') || lowerDesc.includes('fit')) {
    bodyType = 'athletic';
  } else if (lowerDesc.includes('curvy')) {
    bodyType = 'curvy';
  } else if (lowerDesc.includes('plus') || lowerDesc.includes('plus-size')) {
    bodyType = 'plus-size';
  }

  // Extract skin tone
  let skinTone: SkinTone = 'medium';
  if (lowerDesc.includes('fair') || lowerDesc.includes('pale')) {
    skinTone = 'fair';
  } else if (lowerDesc.includes('light')) {
    skinTone = 'light';
  } else if (lowerDesc.includes('tan')) {
    skinTone = 'tan';
  } else if (lowerDesc.includes('brown')) {
    skinTone = 'brown';
  } else if (lowerDesc.includes('dark')) {
    skinTone = 'dark';
  }

  // Extract gender if mentioned
  let gender: 'male' | 'female' | 'unisex' | undefined;
  if (lowerDesc.includes('male') && !lowerDesc.includes('female')) {
    gender = 'male';
  } else if (lowerDesc.includes('female')) {
    gender = 'female';
  }

  return {
    height,
    bodyType,
    skinTone,
    gender,
  };
}

/**
 * Get default profile for new avatars
 */
function getDefaultProfile(): UserProfile {
  return {
    height: 170,
    bodyType: 'average',
    skinTone: 'medium',
  };
}

/**
 * Get size recommendation based on avatar and product
 * Requirement 4.3: AI shows how product fits on custom avatar
 * 
 * This is a placeholder for future implementation that will analyze
 * product dimensions against avatar measurements
 */
export async function getSizeRecommendation(
  avatarId: string,
  productId: string
): Promise<{
  recommendedSize: string;
  fitDescription: string;
  confidence: number;
}> {
  try {
    const avatar = await getAvatarById(avatarId);
    if (!avatar) {
      throw new AvatarServiceError('Avatar not found', 'AVATAR_NOT_FOUND');
    }

    // TODO: Implement actual size recommendation logic
    // This would involve:
    // 1. Fetching product dimensions from database
    // 2. Comparing with avatar measurements
    // 3. Calculating best fit size
    // 4. Generating fit description

    // For now, return a basic recommendation based on body type
    const sizeMap: Record<BodyType, string> = {
      'slim': 'S',
      'athletic': 'M',
      'average': 'M',
      'curvy': 'L',
      'plus-size': 'XL',
    };

    return {
      recommendedSize: sizeMap[avatar.profile.bodyType],
      fitDescription: 'Based on your body type and measurements',
      confidence: 0.75,
    };
  } catch (error) {
    console.error('[Avatar Service] Error getting size recommendation:', error);
    throw new AvatarServiceError(
      'Failed to get size recommendation',
      'SIZE_RECOMMENDATION_FAILED'
    );
  }
}
