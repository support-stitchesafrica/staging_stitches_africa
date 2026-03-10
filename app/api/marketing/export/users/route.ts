import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/marketing/user-service';

/**
 * GET /api/marketing/export/users
 * Export user data for compliance
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');

    // Get all users
    let users = await UserService.getUsers();

    // Filter by team if specified
    if (teamId) {
      users = users.filter(u => u.teamId === teamId);
    }

    // Filter by role if specified
    if (role) {
      users = users.filter(u => u.role === role);
    }

    // Filter by active status if specified
    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      users = users.filter(u => u.isActive === activeFilter);
    }

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}
