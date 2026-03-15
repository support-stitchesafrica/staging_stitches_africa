interface BlogInvitationEmailData {
  firstName: string
  invitedByName: string
  role: string
  invitationUrl: string
  expiryHours: number
}

export const blogInvitationTemplate = (data: BlogInvitationEmailData): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog Admin Invitation - Stitches Africa</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 60px;
            height: 60px;
            background: #6366f1;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        .logo svg {
            width: 30px;
            height: 30px;
            fill: white;
        }
        h1 {
            color: #1f2937;
            margin: 0 0 10px 0;
            font-size: 24px;
            font-weight: 600;
        }
        .subtitle {
            color: #6b7280;
            margin: 0 0 30px 0;
            font-size: 16px;
        }
        .invitation-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
        }
        .role-badge {
            display: inline-block;
            background: #dbeafe;
            color: #1e40af;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            text-transform: capitalize;
        }
        .cta-button {
            display: inline-block;
            background: #1f2937;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
            transition: background-color 0.2s;
        }
        .cta-button:hover {
            background: #374151;
        }
        .info-section {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
        }
        .info-section h3 {
            color: #92400e;
            margin: 0 0 8px 0;
            font-size: 16px;
        }
        .info-section p {
            color: #92400e;
            margin: 0;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .footer a {
            color: #6366f1;
            text-decoration: none;
        }
        .expiry-notice {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 12px;
            margin: 16px 0;
            font-size: 14px;
            color: #991b1b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 9H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 15H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <h1>You're Invited to Join Our Blog Team!</h1>
            <p class="subtitle">Stitches Africa Blog Administration</p>
        </div>

        <p>Hi ${data.firstName},</p>
        
        <p>${data.invitedByName} has invited you to join the Stitches Africa blog administration team. We're excited to have you contribute to our content!</p>

        <div class="invitation-card">
            <h3>Invitation Details</h3>
            <p><strong>Role:</strong> <span class="role-badge">${data.role}</span></p>
            <p><strong>Invited by:</strong> ${data.invitedByName}</p>
            <p><strong>Platform:</strong> Stitches Africa Blog Admin</p>
        </div>

        <div style="text-align: center;">
            <a href="${data.invitationUrl}" class="cta-button">Accept Invitation & Set Password</a>
        </div>

        <div class="expiry-notice">
            <strong>⏰ Time Sensitive:</strong> This invitation expires in ${data.expiryHours} hours. Please accept it soon to secure your access.
        </div>

        <div class="info-section">
            <h3>What happens next?</h3>
            <p>Click the button above to accept your invitation and set up your password. You'll then have access to create, edit, and manage blog content based on your assigned role.</p>
        </div>

        <h3>Role Permissions:</h3>
        <ul>
            ${data.role === 'admin' ? `
                <li>✅ Create and publish posts</li>
                <li>✅ Edit any post</li>
                <li>✅ Manage users and send invitations</li>
                <li>✅ View analytics and insights</li>
                <li>✅ Full administrative access</li>
            ` : data.role === 'editor' ? `
                <li>✅ Create and publish posts</li>
                <li>✅ Edit any post</li>
                <li>✅ View analytics and insights</li>
                <li>❌ User management (admin only)</li>
            ` : `
                <li>✅ Create posts (requires approval)</li>
                <li>✅ Edit your own posts</li>
                <li>❌ Edit others' posts</li>
                <li>❌ User management</li>
            `}
        </ul>

        <p>If you have any questions about your invitation or need assistance, please don't hesitate to reach out to ${data.invitedByName} or our support team.</p>

        <p>Welcome to the team!</p>
        
        <p>Best regards,<br>
        The Stitches Africa Team</p>

        <div class="footer">
            <p>This invitation was sent to you by ${data.invitedByName}.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p><a href="https://https://staging-stitches-africa.vercel.app">Visit Stitches Africa</a></p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

export const blogInvitationTextTemplate = (data: BlogInvitationEmailData): string => {
  return `
Blog Admin Invitation - Stitches Africa

Hi ${data.firstName},

${data.invitedByName} has invited you to join the Stitches Africa blog administration team as a ${data.role}.

Invitation Details:
- Role: ${data.role}
- Invited by: ${data.invitedByName}
- Platform: Stitches Africa Blog Admin

Accept your invitation: ${data.invitationUrl}

⏰ IMPORTANT: This invitation expires in ${data.expiryHours} hours.

What happens next?
Click the link above to accept your invitation and set up your password. You'll then have access to create, edit, and manage blog content based on your assigned role.

Role Permissions:
${data.role === 'admin' ? `
- ✅ Create and publish posts
- ✅ Edit any post
- ✅ Manage users and send invitations
- ✅ View analytics and insights
- ✅ Full administrative access
` : data.role === 'editor' ? `
- ✅ Create and publish posts
- ✅ Edit any post
- ✅ View analytics and insights
- ❌ User management (admin only)
` : `
- ✅ Create posts (requires approval)
- ✅ Edit your own posts
- ❌ Edit others' posts
- ❌ User management
`}

If you have any questions, please contact ${data.invitedByName} or our support team.

Welcome to the team!

Best regards,
The Stitches Africa Team

---
This invitation was sent to you by ${data.invitedByName}.
If you didn't expect this invitation, you can safely ignore this email.
Visit: https://https://staging-stitches-africa.vercel.app
  `.trim()
}