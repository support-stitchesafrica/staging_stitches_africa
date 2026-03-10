/**
 * Avatar API Endpoint
 * 
 * GET /api/ai-assistant/avatar - Get or create user avatar
 * POST /api/ai-assistant/avatar - Create/update user avatar
 * 
 * Requirements: 4.1-4.5, 16.1-16.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateAvatar, updateAvatar, createAvatarFromDescription } from '@/lib/ai-assistant/avatar-service';
import type { UserProfile } from '@/lib/ai-assistant/avatar-service';

/**
 * GET - Get or create user avatar
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from session/auth
    // For now, use a guest user ID from query params or generate one
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'guest-' + Date.now();

    // Get or create avatar for user
    const { avatar, isNew } = await getOrCreateAvatar(userId);

    return NextResponse.json({
      success: true,
      avatar,
      isNew,
    });
  } catch (error) {
    console.error('[Avatar API] Error getting avatar:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get avatar',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create or update user avatar
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, profile, description, avatarId } = body;

    // If description is provided, create avatar from natural language
    if (description) {
      const avatar = await createAvatarFromDescription(description, userId);
      return NextResponse.json({
        success: true,
        avatar,
        message: 'Avatar created from description',
      });
    }

    // If avatarId is provided, update existing avatar
    if (avatarId && profile) {
      const avatar = await updateAvatar(avatarId, profile);
      return NextResponse.json({
        success: true,
        avatar,
        message: 'Avatar updated successfully',
      });
    }

    // Otherwise, create new avatar with profile
    if (profile) {
      const { avatar, isNew } = await getOrCreateAvatar(
        userId || 'guest-' + Date.now(),
        profile as UserProfile
      );
      return NextResponse.json({
        success: true,
        avatar,
        isNew,
        message: isNew ? 'Avatar created successfully' : 'Avatar already exists',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Missing required parameters',
        message: 'Please provide either description, profile, or avatarId',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Avatar API] Error creating/updating avatar:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create/update avatar',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
