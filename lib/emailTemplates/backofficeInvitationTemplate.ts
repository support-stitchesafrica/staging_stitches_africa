/**
 * Back Office Invitation Email Template
 * 
 * Email template for inviting users to join the unified back office system
 * with role-based access to departments
 */

export function backofficeInvitationTemplate({
  fullName,
  email,
  role,
  departments,
  invitationLink,
  invitedByName,
  expiresAt,
  logoUrl = "https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
}: {
  fullName: string;
  email: string;
  role: string;
  departments: string[];
  invitationLink: string;
  invitedByName: string;
  expiresAt: Date;
  logoUrl?: string;
}) {
  // Format role for display
  const roleDisplay = role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Format departments for display
  const departmentsDisplay = departments
    .map(dept => dept.charAt(0).toUpperCase() + dept.slice(1))
    .join(', ');

  // Format expiration date
  const expirationDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate days until expiration
  const daysUntilExpiration = Math.ceil(
    (new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Role descriptions
  const roleDescriptions: Record<string, string> = {
    superadmin: 'Full access to all departments and system administration',
    founder: 'Read-only access to analytics and business insights',
    bdm: 'Manage sales analytics, vendors, and business development',
    brand_lead: 'Manage product analytics and brand performance',
    logistics_lead: 'Manage logistics analytics and delivery operations',
    marketing_manager: 'Full access to marketing department and team management',
    marketing_member: 'Access to assigned marketing tasks and interactions',
    admin: 'Manage promotions, collections, and system settings',
    editor: 'Create and edit promotional events and collections',
    viewer: 'Read-only access to collections and analytics',
  };

  const roleDescription = roleDescriptions[role] || 'Access to assigned departments';

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>You're Invited to Stitches Africa Back Office</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif; color:#102a43; }
    .button { background:#000000; color:#fff !important; padding:14px 28px; border-radius:8px; font-weight:600; display:inline-block; margin-top:24px; text-decoration:none; }
    .button:hover { background:#333333; }
    .badge { display:inline-block; background:#667eea; color:#fff; padding:6px 12px; border-radius:16px; font-size:13px; font-weight:600; margin:4px; }
    @media only screen and (max-width:600px) { .container { width:100% !important; } }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:24px 0;">
    <tr>
      <td align="center">
        <table class="container" width="640" style="max-width:640px; background:#ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(22,28,37,0.08);">
          <tr>
            <td align="center" style="padding:20px 28px; border-bottom:1px solid #eef2f6;">
              <img src="${logoUrl}" alt="Stitches Africa" width="140" style="display:block; max-width:140px; height:auto; margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">
              <div style="text-align:center; margin-bottom:24px;">
                <div style="display:inline-block; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; padding:8px 16px; border-radius:20px; font-size:14px; font-weight:600;">
                  🎉 Back Office Invitation
                </div>
              </div>

              <h1 style="margin:0 0 16px 0; font-size:24px; color:#102a43; text-align:center;">Welcome to the Team!</h1>
              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                Hi ${fullName},
              </p>
              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                ${invitedByName} has invited you to join the <strong>Stitches Africa Unified Back Office</strong>. This platform provides centralized access to all administrative tools and departments you need to manage your work.
              </p>
              
              <div style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 20%); padding:20px; margin:24px 0; border-radius:8px; color:#fff;">
                <p style="margin:0 0 12px 0; font-size:15px; font-weight:600;">Your Role & Access</p>
                <table style="width:100%; border-collapse:collapse;">
                  <tr>
                    <td style="padding:8px 0; font-size:15px; opacity:0.9;">Email:</td>
                    <td style="padding:8px 0; font-size:15px; font-weight:600; text-align:right;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:15px; opacity:0.9;">Role:</td>
                    <td style="padding:8px 0; font-size:15px; font-weight:600; text-align:right;">${roleDisplay}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; font-size:15px; opacity:0.9; vertical-align:top;">Departments:</td>
                    <td style="padding:8px 0; font-size:15px; font-weight:600; text-align:right;">${departmentsDisplay}</td>
                  </tr>
                </table>
              </div>

              <div style="background:#f9fafb; border-left:4px solid #667eea; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0; font-size:15px; color:#374151; line-height:1.6;">
                  <strong>What you can do:</strong><br />
                  ${roleDescription}
                </p>
              </div>

              <h2 style="margin:24px 0 16px 0; font-size:18px; color:#102a43;">Getting Started</h2>
              
              <div style="margin:24px 0;">
                <div style="display:flex; align-items:start; margin-bottom:16px;">
                  <div style="background:#667eea; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; margin-right:12px; flex-shrink:0;">1</div>
                  <div>
                    <p style="margin:0 0 4px 0; font-size:15px; color:#102a43; font-weight:600;">Accept Your Invitation</p>
                    <p style="margin:0; font-size:14px; color:#6b7280; line-height:1.6;">Click the button below to accept and set up your account</p>
                  </div>
                </div>
                
                <div style="display:flex; align-items:start; margin-bottom:16px;">
                  <div style="background:#3b82f6; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; margin-right:12px; flex-shrink:0;">2</div>
                  <div>
                    <p style="margin:0 0 4px 0; font-size:15px; color:#102a43; font-weight:600;">Create Your Password</p>
                    <p style="margin:0; font-size:14px; color:#6b7280; line-height:1.6;">Set up a secure password for your account</p>
                  </div>
                </div>
                
                <div style="display:flex; align-items:start;">
                  <div style="background:#10b981; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; margin-right:12px; flex-shrink:0;">3</div>
                  <div>
                    <p style="margin:0 0 4px 0; font-size:15px; color:#102a43; font-weight:600;">Start Working</p>
                    <p style="margin:0; font-size:14px; color:#6b7280; line-height:1.6;">Access your departments and begin managing your work</p>
                  </div>
                </div>
              </div>

              <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#92400e; font-weight:600;">⏰ Time Sensitive</p>
                <p style="margin:0; font-size:14px; color:#b45309; line-height:1.6;">
                  This invitation expires in <strong>${daysUntilExpiration} days</strong> on <strong>${expirationDate}</strong>. Please accept it before then to maintain access.
                </p>
              </div>

              <div style="text-align:center;">
                <a href="${invitationLink}" class="button" target="_blank" rel="noopener noreferrer">
                  Accept Invitation & Set Up Account
                </a>
              </div>

              <div style="background:#dbeafe; border-left:4px solid #3b82f6; padding:16px; margin:32px 0 24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#1e40af; font-weight:600;">🔒 Security & Privacy</p>
                <p style="margin:0; font-size:14px; color:#1e3a8a; line-height:1.6;">
                  Your account will have role-based access controls. You'll only see and access the departments and features relevant to your role. All actions are logged for security purposes.
                </p>
              </div>

              <p style="margin-top:32px; font-size:14px; color:#6b7280; line-height:1.6;">
                If you have any questions or need assistance, please contact our support team at <a href="mailto:support@stitchesafrica.com" style="color:#000000;">support@stitchesafrica.com</a>
              </p>

              <p style="margin-top:16px; font-size:13px; color:#9aa6b2; line-height:1.6;">
                If you didn't expect this invitation or believe it was sent in error, please ignore this email or contact support immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px; background:#f9fafb; border-top:1px solid #eef2f6;">
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center;">
                This is an automated message from Stitches Africa Back Office System
              </p>
            </td>
          </tr>
        </table>
        <table width="640" style="max-width:640px; margin-top:12px;">
          <tr>
            <td align="center" style="font-size:12px; color:#9aa6b2;">
              © ${new Date().getFullYear()} Stitches Africa. All rights reserved.
              <br />
              <a href="https://staging-stitches-africa.vercel.app/privacy-policy" style="color:#9aa6b2; text-decoration:none;">Privacy Policy</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
