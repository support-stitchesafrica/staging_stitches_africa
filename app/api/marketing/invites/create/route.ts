/**
 * Marketing Dashboard - Create Invitation API
 * POST /api/marketing/invites/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  InvitationService, 
  InvitationError, 
  InvitationErrorCodes,
  type CreateInvitationData 
} from '@/lib/marketing';
import { InvitationServiceServer } from '@/lib/marketing/invitation-service-server';
import { authenticateRequest, hasRole } from '@/lib/marketing';

export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize user
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Check if user has permission to create invitations (Super Admin only)
    if (!hasRole(authResult.user, 'super_admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only Super Admin can create invitations.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, email, role } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, role' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['super_admin', 'team_lead', 'bdm', 'team_member'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: ' + validRoles.join(', ') },
        { status: 400 }
      );
    }

    // Create invitation data
    const invitationData: CreateInvitationData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      invitedByUserId: authResult.user.uid
    };

    // Create invitation
    const invitation = await InvitationServiceServer.createInvitation(invitationData);

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://www.stitchesafrica.com');
    
    const invitationLink = InvitationServiceServer.generateInvitationLink(
      invitation.token,
      baseUrl
    );

    // Send invitation email using MarketingEmailService
    let emailSent = false;
    let emailError: string | undefined;
    
    try {
      const { MarketingEmailService } = await import('@/lib/marketing/email-service');
      const { ActivityLogService } = await import('@/lib/marketing/activity-log-service');
      
      // Get inviter's name
      const inviterName = authResult.user.name || authResult.user.email?.split('@')[0] || 'A team member';

      // Send email via MarketingEmailService (includes retry logic)
      const emailResult = await MarketingEmailService.sendInvitationEmail(
        email.toLowerCase().trim(),
        name.trim(),
        role,
        invitationLink,
        inviterName
      );

      emailSent = emailResult.success;
      emailError = emailResult.error;

      if (emailResult.success) {
        console.log("✅ Invitation email sent successfully to:", email);
        
        // Log successful email sending (using Admin SDK)
        const { ActivityLogServiceAdmin } = await import('@/lib/marketing/activity-log-service-admin');
        await ActivityLogServiceAdmin.createLog({
          userId: authResult.user.uid,
          userName: inviterName,
          userEmail: authResult.user.email || '',
          userRole: 'super_admin',
          action: 'invite_sent',
          entityType: 'invitation',
          entityId: invitation.id,
          entityName: email,
          details: {
            inviteeEmail: email,
            inviteeName: name,
            inviteeRole: role,
            emailSent: true,
            invitationLink
          }
        }).catch(err => console.error('Failed to log email success:', err));
      } else {
        console.error("❌ Failed to send invitation email:", emailResult.error);
        
        // Log email failure to Firestore (using Admin SDK)
        const { ActivityLogServiceAdmin } = await import('@/lib/marketing/activity-log-service-admin');
        await ActivityLogServiceAdmin.createLog({
          userId: authResult.user.uid,
          userName: inviterName,
          userEmail: authResult.user.email || '',
          userRole: 'super_admin',
          action: 'invite_sent',
          entityType: 'invitation',
          entityId: invitation.id,
          entityName: email,
          details: {
            inviteeEmail: email,
            inviteeName: name,
            inviteeRole: role,
            emailSent: false,
            emailError: emailResult.error,
            invitationLink
          }
        }).catch(err => console.error('Failed to log email failure:', err));
      }
    } catch (emailException) {
      console.error("❌ Exception sending invitation email:", emailException);
      emailError = emailException instanceof Error ? emailException.message : 'Unknown error';
      
      // Log the exception (using Admin SDK)
      try {
        const { ActivityLogServiceAdmin } = await import('@/lib/marketing/activity-log-service-admin');
        const inviterName = authResult.user.displayName || authResult.user.email?.split('@')[0] || 'A team member';
        
        await ActivityLogServiceAdmin.createLog({
          userId: authResult.user.uid,
          userName: inviterName,
          userEmail: authResult.user.email || '',
          userRole: 'super_admin',
          action: 'invite_sent',
          entityType: 'invitation',
          entityId: invitation.id,
          entityName: email,
          details: {
            inviteeEmail: email,
            inviteeName: name,
            inviteeRole: role,
            emailSent: false,
            emailError,
            exception: true
          }
        }).catch(err => console.error('Failed to log email exception:', err));
      } catch (logError) {
        console.error('Failed to log email exception:', logError);
      }
    }

    // Return success response with email status
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        invitationLink
      },
      emailSent,
      emailError,
      message: emailSent 
        ? "Invitation created and email sent successfully" 
        : `Invitation created but email failed to send: ${emailError || 'Unknown error'}. Please share the invitation link manually.`,
      warning: !emailSent ? 'Email notification failed. The invitation is still valid and can be shared manually.' : undefined
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Create invitation error:', error);
    console.error('❌ Error type:', error?.constructor?.name);
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error code:', (error as any)?.code);
    console.error('❌ Error details:', (error as any)?.details);
    console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    // Handle specific invitation errors
    if (error instanceof InvitationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    // Handle domain validation errors
    if (error instanceof Error && error.message.includes('company emails')) {
      return NextResponse.json(
        { 
          error: 'Only company emails (@stitchesafrica.com, @stitchesafrica.pro) are allowed',
          code: InvitationErrorCodes.INVALID_DOMAIN
        },
        { status: 400 }
      );
    }

    // Handle existing invitation errors
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { 
          error: error.message,
          code: InvitationErrorCodes.INVITATION_EXISTS
        },
        { status: 409 }
      );
    }

    // Generic error response with more details in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to create invitation',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}