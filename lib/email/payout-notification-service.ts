/**
 * Enhanced Payout Email Notification Service
 * Handles sending comprehensive payout notifications to vendors
 */

interface PayoutEmailData {
  to: string;
  vendorName: string;
  amount: number;
  orderId: string;
  transferId: string;
  currency?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://https://staging-stitches-africa.vercel.app';

/**
 * Send enhanced payout notification email to vendor
 */
export async function sendPayoutNotificationEmail(data: PayoutEmailData): Promise<EmailResponse> {
  try {
    // Validate email parameters
    if (!data.to || !data.vendorName || !data.amount || !data.orderId || !data.transferId) {
      throw new Error('Missing required email parameters');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.to)) {
      throw new Error('Invalid email address format');
    }

    const html = generatePayoutEmailTemplate(data);
    const subject = `Payout Received - $${data.amount.toLocaleString()} | Stitches Africa`;

    const response = await fetch('https://stitchesafricamobile-backend.onrender.com/api/Email/Send', {
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: html,
        subject,
        emails: [{
          emailAddress: data.to,
          name: data.vendorName,
        }],
        from: 'noreply@stitchesafrica.com',
        replyTo: 'support@stitchesafrica.com',
      }),
    });

    if (!response.ok) {
      throw new Error(`Email API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('[Payout Email Service] Email sent successfully:', {
      to: data.to,
      orderId: data.orderId,
      transferId: data.transferId,
      amount: data.amount
    });

    return {
      success: true,
      messageId: result.messageId || 'unknown'
    };

  } catch (error) {
    console.error('[Payout Email Service] Failed to send email:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: data.to,
      orderId: data.orderId,
      transferId: data.transferId
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate enhanced HTML email template for payout notifications
 */
function generatePayoutEmailTemplate(data: PayoutEmailData): string {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const currency = data.currency || 'USD';
  const currencySymbol = currency === 'USD' ? '$' : currency;

  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payout Received - Stitches Africa</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; margin: 0; padding: 20px; line-height: 1.6;">
      <table style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 30px; text-align: center;">
            <img src="https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png" width="140" alt="Stitches Africa" style="margin-bottom: 10px;" />
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Payout Received!</h1>
          </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
          <td style="padding: 40px 30px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">Hello ${data.vendorName},</h2>
            
            <p style="color: #374151; margin: 0 0 25px 0; font-size: 16px;">
              Excellent news! Your order <strong>#${data.orderId}</strong> has been successfully delivered, and we've processed your payout to your Stripe account.
            </p>
            
            <!-- Payout Amount Highlight -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
              <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">PAYOUT AMOUNT</p>
              <p style="margin: 8px 0 0 0; color: white; font-size: 32px; font-weight: bold;">${currencySymbol}${data.amount.toLocaleString()}</p>
            </div>
            
            <!-- Transaction Details -->
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Transaction Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Order ID:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">#${data.orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Transfer ID:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${data.transferId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Date Processed:</td>
                  <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${currentDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Status:</td>
                  <td style="padding: 8px 0; color: #059669; font-size: 14px; font-weight: 600;">✓ Completed</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #374151; margin: 25px 0; font-size: 15px;">
              The funds will be available in your Stripe account according to your payout schedule. Typically, this takes 2-7 business days depending on your bank and location.
            </p>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${BASE_URL}/vendor/settings?tab=account-details" 
                 style="display: inline-block; background: #1f2937; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 0 10px 10px 0;">
                View Account Details
              </a>
              <a href="${BASE_URL}/vendor/dashboard" 
                 style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 0 10px 10px 0;">
                Go to Dashboard
              </a>
            </div>
            
            <!-- Support Information -->
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">Need Help?</h4>
              <p style="color: #92400e; margin: 0; font-size: 13px;">
                If you have any questions about this payout or need assistance, our support team is here to help.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
              Thank you for being a valued partner of the Stitches Africa marketplace. We appreciate your continued collaboration in bringing quality fashion to our customers.
            </p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <div style="margin-bottom: 20px;">
              <h4 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Contact Information</h4>
              <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">
                📧 <a href="mailto:support@stitchesafrica.com" style="color: #3b82f6; text-decoration: none;">support@stitchesafrica.com</a>
              </p>
              <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">
                🌐 <a href="https://https://staging-stitches-africa.vercel.app" style="color: #3b82f6; text-decoration: none;">https://staging-stitches-africa.vercel.app</a>
              </p>
              <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">
                📱 Follow us on social media for updates and fashion inspiration
              </p>
            </div>
            
            <div style="border-top: 1px solid #d1d5db; padding-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Stitches Africa. All rights reserved.
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 5px 0 0 0;">
                This email was sent to ${data.to} regarding your vendor payout. If you believe this was sent in error, please contact our support team.
              </p>
            </div>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

/**
 * Send payout failure notification email to vendor
 */
export async function sendPayoutFailureNotificationEmail(data: {
  to: string;
  vendorName: string;
  orderId: string;
  errorMessage: string;
  amount: number;
}): Promise<EmailResponse> {
  try {
    const html = generatePayoutFailureEmailTemplate(data);
    const subject = `Payout Issue - Order #${data.orderId} | Stitches Africa`;

    const response = await fetch('https://stitchesafricamobile-backend.onrender.com/api/Email/Send', {
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: html,
        subject,
        emails: [{
          emailAddress: data.to,
          name: data.vendorName,
        }],
        from: 'noreply@stitchesafrica.com',
        replyTo: 'support@stitchesafrica.com',
      }),
    });

    if (!response.ok) {
      throw new Error(`Email API returned ${response.status}: ${response.statusText}`);
    }

    return { success: true };

  } catch (error) {
    console.error('[Payout Email Service] Failed to send failure notification:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: data.to,
      orderId: data.orderId
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate HTML template for payout failure notifications
 */
function generatePayoutFailureEmailTemplate(data: {
  to: string;
  vendorName: string;
  orderId: string;
  errorMessage: string;
  amount: number;
}): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payout Issue - Stitches Africa</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; margin: 0; padding: 20px; line-height: 1.6;">
      <table style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
            <img src="https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png" width="140" alt="Stitches Africa" style="margin-bottom: 10px;" />
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Payout Issue</h1>
          </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
          <td style="padding: 40px 30px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 20px;">Hello ${data.vendorName},</h2>
            
            <p style="color: #374151; margin: 0 0 25px 0; font-size: 16px;"></p>     We encountered an issue while processing your payout for order <strong>#${data.orderId}</strong>. Don't worry - we're working to resolve this quickly.
            </p>
            
            <!-- Issue Details -->
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 16px;">Issue Details</h3>
              <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
                <strong>Order ID:</strong> #${data.orderId}<br/>
                <strong>Amount:</strong> $${data.amount.toLocaleString()}<br/>
                <strong>Issue:</strong> ${data.errorMessage}
              </p>
            </div>
            
            <p style="color: #374151; margin: 25px 0; font-size: 15px;">
              Our team has been automatically notified and will work to resolve this issue. You can expect to receive your payout within 24-48 hours once the issue is resolved.
            </p>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${BASE_URL}/vendor/settings?tab=account-details" 
                 style="display: inline-block; background: #1f2937; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 0 10px 10px 0;">
                Check Account Status
              </a>
              <a href="mailto:support@stitchesafrica.com?subject=Payout Issue - Order ${data.orderId}" 
                 style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 0 10px 10px 0;">
                Contact Support
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
              We apologize for any inconvenience and appreciate your patience as we resolve this matter.
            </p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">
              📧 <a href="mailto:support@stitchesafrica.com" style="color: #3b82f6; text-decoration: none;">support@stitchesafrica.com</a>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
              © ${new Date().getFullYear()} Stitches Africa. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}