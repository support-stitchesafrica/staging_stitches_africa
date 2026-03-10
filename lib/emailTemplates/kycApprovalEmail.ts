// lib/emailTemplates/kycApprovalEmail.ts

/**
 * TODO: Implement email notification service for KYC approval/decline
 * 
 * This service should:
 * 1. Send email when KYC request is approved
 * 2. Send email when KYC request is declined
 * 3. Include vendor's email, name, and relevant details
 * 4. Use your existing email service (nodemailer or similar)
 * 
 * Integration: Uncomment the email call in admin-services/kycApproval.ts
 */

import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

interface KycEmailData {
  vendorEmail: string;
  vendorName: string;
  approved: boolean;
  adminNote?: string;
}

/**
 * Email template for KYC approval
 */
const getApprovalEmailTemplate = (vendorName: string, adminNote?: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ KYC Update Request Approved</h1>
        </div>
        <div class="content">
          <h2>Hello ${vendorName},</h2>
          <p>Great news! Your KYC update request has been approved by our admin team.</p>
          <p>You can now proceed to update your KYC documents through your vendor dashboard.</p>
          ${adminNote ? `<p><strong>Admin Note:</strong> ${adminNote}</p>` : ''}
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/settings" class="button">Update KYC Documents</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Email template for KYC decline
 */
const getDeclineEmailTemplate = (vendorName: string, reason: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
        .reason-box { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>❌ KYC Update Request Declined</h1>
        </div>
        <div class="content">
          <h2>Hello ${vendorName},</h2>
          <p>We regret to inform you that your KYC update request has been declined.</p>
          <div class="reason-box">
            <strong>Reason:</strong><br/>
            ${reason}
          </div>
          <p>If you have any questions or would like to discuss this decision, please contact our support team or submit a new request with the necessary corrections.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/settings" class="button">Contact Support</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send KYC approval/decline email notification
 * TODO: Integrate with your existing email service (e.g., nodemailer, sendgrid, etc.)
 */
export const sendKycApprovalEmail = async (
  tailorId: string,
  approved: boolean,
  adminNote?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Fetch vendor details
    const tailorRef = doc(db, "staging_tailors", tailorId);
    const tailorSnap = await getDoc(tailorRef);
    
    if (!tailorSnap.exists()) {
      throw new Error("Vendor not found");
    }

    const tailorData = tailorSnap.data();
    const vendorEmail = tailorData.tailor_registered_info?.email || tailorData.email;
    const vendorName = tailorData.brand_name || tailorData.brandName || "Vendor";

    if (!vendorEmail) {
      throw new Error("Vendor email not found");
    }

    // TODO: Replace this with your actual email sending logic
    // Example using nodemailer:
    /*
    const transporter = nodemailer.createTransport({
      // your email config
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: vendorEmail,
      subject: approved 
        ? "KYC Update Request Approved - Stitches Africa"
        : "KYC Update Request Declined - Stitches Africa",
      html: approved 
        ? getApprovalEmailTemplate(vendorName, adminNote)
        : getDeclineEmailTemplate(vendorName, adminNote || "No reason provided"),
    });
    */

    // For now, just log it
    console.log("📧 Email would be sent to:", vendorEmail);
    console.log("Status:", approved ? "APPROVED" : "DECLINED");
    console.log("Admin Note:", adminNote);
    console.log("Template:", approved 
      ? getApprovalEmailTemplate(vendorName, adminNote)
      : getDeclineEmailTemplate(vendorName, adminNote || "No reason provided")
    );

    return {
      success: true,
      message: `Email notification prepared for ${vendorEmail}`,
    };
  } catch (error: any) {
    console.error("Error sending KYC approval email:", error);
    return {
      success: false,
      message: error.message || "Failed to send email notification",
    };
  }
};

/**
 * Instructions to complete email integration:
 * 
 * 1. Install email service if not already installed:
 *    npm install nodemailer
 *    npm install --save-dev @types/nodemailer
 * 
 * 2. Set up environment variables in .env.local:
 *    EMAIL_HOST=smtp.gmail.com
 *    EMAIL_PORT=587
 *    EMAIL_USER=your-email@gmail.com
 *    EMAIL_PASSWORD=your-app-password
 *    EMAIL_FROM="Stitches Africa <noreply@stitchesafrica.com>"
 *    NEXT_PUBLIC_APP_URL=https://your-domain.com
 * 
 * 3. Import and use in admin-services/kycApproval.ts:
 *    import { sendKycApprovalEmail } from "@/lib/emailTemplates/kycApprovalEmail";
 *    
 *    // After successful approval/decline:
 *    await sendKycApprovalEmail(tailorId, approved, adminNote);
 * 
 * 4. Test email sending thoroughly before deploying to production
 */

