import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

const AUTHORIZED_ROLES = ['super_admin', 'team_lead', 'bdm'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json(
      { success: false, error: 'userId is required' },
      { status: 400 }
    );
  }

  // Parse request body
  let body: { percentage?: unknown; isActive?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { percentage, isActive } = body;

  // Must provide at least one field to update
  if (percentage === undefined && isActive === undefined) {
    return NextResponse.json(
      { success: false, error: 'Provide percentage or isActive to update' },
      { status: 400 }
    );
  }

  // Validate percentage if provided
  if (
    percentage !== undefined &&
    (typeof percentage !== 'number' ||
      !Number.isInteger(percentage) ||
      percentage < 1 ||
      percentage > 100)
  ) {
    return NextResponse.json(
      { success: false, error: 'percentage must be an integer between 1 and 100' },
      { status: 400 }
    );
  }

  // Validate isActive if provided
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return NextResponse.json(
      { success: false, error: 'isActive must be a boolean' },
      { status: 400 }
    );
  }

  // Authenticate marketing user
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // Role check
  if (!AUTHORIZED_ROLES.includes(user.role as typeof AUTHORIZED_ROLES[number])) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Verify the discount document exists
  const docRef = adminDb.collection('referralDiscounts').doc(userId);
  const existing = await docRef.get();

  if (!existing.exists) {
    return NextResponse.json(
      { success: false, error: 'Referral discount not found for this user' },
      { status: 404 }
    );
  }

  // Build update payload — only include provided fields
  const update: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (percentage !== undefined) update.percentage = percentage;
  if (isActive !== undefined) update.isActive = isActive;

  try {
    await docRef.update(update);
  } catch (error) {
    console.error('[referral-discounts/[userId]] Firestore update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update discount' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
