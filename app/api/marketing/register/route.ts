/**
 * Marketing User Registration API
 * Allows existing Firebase users to register in the marketing system
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { UserService, RoleValidator, UserProfileValidator, type CreateUserData } from '@/lib/marketing/user-service';

/**
 * POST /api/marketing/register
 * Register an existing Firebase user in the marketing system
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, phoneNumber, role = 'team_member', teamId, profileImage, password } = body;

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Validate email format and domain
    const emailValidation = UserProfileValidator.validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Check if user already exists in marketing system
    const existingMarketingUser = await UserService.getUserByEmail(email);
    if (existingMarketingUser) {
      return NextResponse.json(
        { error: 'User already registered in marketing system' },
        { status: 409 }
      );
    }

    let firebaseUser;
    let userId;

    // Check if Firebase user exists
    try {
      firebaseUser = await adminAuth.getUserByEmail(email);
      userId = firebaseUser.uid;
    } catch (error) {
      // Firebase user doesn't exist, create one if password is provided
      if (!password) {
        return NextResponse.json(
          { error: 'Firebase user not found. Password required to create new Firebase user.' },
          { status: 400 }
        );
      }

      // Create Firebase user
      try {
        firebaseUser = await adminAuth.createUser({
          email,
          password,
          displayName: name,
        });
        userId = firebaseUser.uid;
      } catch (firebaseError) {
        console.error('Error creating Firebase user:', firebaseError);
        return NextResponse.json(
          { error: 'Failed to create Firebase user' },
          { status: 500 }
        );
      }
    }

    // Validate role (default to team_member for new registrations)
    if (!RoleValidator.isValidRole(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // For security, only allow team_member role for self-registration
    // Other roles must be assigned by admins
    const finalRole = role === 'team_member' ? role : 'team_member';

    // Prepare user data
    const userData: CreateUserData = {
      email,
      name,
      phoneNumber,
      role: finalRole,
      teamId,
      profileImage
    };

    // Validate user data
    const validation = UserProfileValidator.validateUserData(userData);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Create user in marketing system
    const newUser = await UserService.createUser(userData);

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User registered successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}