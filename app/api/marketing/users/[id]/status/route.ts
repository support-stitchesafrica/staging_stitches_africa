/**
 * User Status Management API Route
 * Handles user activation/deactivation
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/marketing/user-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const { isActive } = await request.json();

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'isActive must be a boolean value' 
        },
        { status: 400 }
      );
    }

    // Update user status
    const updatedUser = await UserService.setUserActiveStatus(userId, isActive);

    return NextResponse.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      }
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('User not found')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User not found' 
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update user status' 
      },
      { status: 500 }
    );
  }
}