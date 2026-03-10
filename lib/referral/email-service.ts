import { sendEmail } from '@/lib/email/send-email';
import { referralWelcomeTemplate } from '@/lib/emailTemplates/referralWelcomeTemplate';

/**
 * ReferralEmailService - Handles all email communications for the referral program
 * Sends welcome emails, notifications, and other referral-related communications
 */
export class ReferralEmailService {
  /**
   * Send welcome email to newly registered referrer
   * @param email - Recipient's email address
   * @param fullName - Recipient's full name
   * @param referralCode - The user's referral code
   * @returns Promise with success status and optional error message
   */
  static async sendWelcomeEmail(
    email: string,
    fullName: string,
    referralCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending referral welcome email to ${email}`);

      const html = referralWelcomeTemplate({
        referrerName: fullName,
        referralCode,
      });

      const result = await sendEmail({
        to: [email],
        subject: "Welcome to the Stitches Africa Referral Program",
        html,
        from: "referrals@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      });

      if (result.success) {
        console.log(`✅ Referral welcome email sent successfully to ${email}`);
      } else {
        console.error(`❌ Failed to send referral welcome email to ${email}:`, result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to send referral welcome email:", error);
      return { success: false, error: errorMessage };
    }
  }
}