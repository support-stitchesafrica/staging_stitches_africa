// lib/atlas/email-service.ts
import { atlasInvitationTemplate } from "@/lib/emailTemplates/atlasInvitationTemplate";
import { atlasRoleChangeTemplate } from "@/lib/emailTemplates/atlasRoleChangeTemplate";
import { atlasDeactivationTemplate } from "@/lib/emailTemplates/atlasDeactivationTemplate";
import type { AtlasRole } from "./types";

/**
 * Email service for Atlas team management
 * Handles sending invitation, role change, and deactivation emails
 */

interface EmailRecipient {
  emailAddress: string;
  name: string;
}

interface EmailPayload {
  body: string;
  subject: string;
  emails: EmailRecipient[];
  from: string;
  replyTo: string;
}

const EMAIL_API_URL = "https://stitchesafricamobile-backend.onrender.com/api/Email/Send";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second base delay

/**
 * Utility function to delay execution
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Send email with retry logic
 */
async function sendEmailWithRetry(
  payload: EmailPayload,
  retries = MAX_RETRIES
): Promise<{ success: boolean; error?: string }> {
  let lastError: string = "";

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(EMAIL_API_URL, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      console.log(`📩 Atlas Email API Response (Attempt ${attempt}):`, raw);

      if (!response.ok) {
        lastError = `HTTP ${response.status}: ${raw}`;
        
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          console.error("❌ Client error, not retrying:", lastError);
          return { success: false, error: lastError };
        }

        // Retry on server errors (5xx)
        if (attempt < retries) {
          const delayTime = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ Retrying in ${delayTime}ms...`);
          await delay(delayTime);
          continue;
        }
      } else {
        console.log("✅ Email sent successfully");
        return { success: true };
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Email sending error (Attempt ${attempt}):`, error);

      if (attempt < retries) {
        const delayTime = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying in ${delayTime}ms...`);
        await delay(delayTime);
        continue;
      }
    }
  }

  return { success: false, error: lastError };
}

export class AtlasEmailService {
  /**
   * Send invitation email to new team member
   * @param email - Recipient email address
   * @param fullName - Recipient full name
   * @param role - Assigned Atlas role
   * @param invitationLink - Password setup link with token
   * @returns Promise with success status and optional error message
   */
  static async sendInvitationEmail(
    email: string,
    fullName: string,
    role: AtlasRole,
    invitationLink: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending invitation email to ${email} (${role})`);

      const html = atlasInvitationTemplate({
        fullName,
        email,
        role,
        invitationLink,
      });

      const payload: EmailPayload = {
        body: html,
        subject: "You're Invited to Join Stitches Africa Atlas",
        emails: [{
          emailAddress: email,
          name: fullName,
        }],
        from: "atlas@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      };

      return await sendEmailWithRetry(payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to send invitation email:", error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send notification when user role is changed
   * @param email - User email address
   * @param fullName - User full name
   * @param oldRole - Previous role
   * @param newRole - New role
   * @returns Promise with success status and optional error message
   */
  static async sendRoleChangeNotification(
    email: string,
    fullName: string,
    oldRole: AtlasRole,
    newRole: AtlasRole
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending role change notification to ${email} (${oldRole} → ${newRole})`);

      const html = atlasRoleChangeTemplate({
        fullName,
        email,
        oldRole,
        newRole,
      });

      const payload: EmailPayload = {
        body: html,
        subject: "Your Atlas Role Has Been Updated",
        emails: [{
          emailAddress: email,
          name: fullName,
        }],
        from: "atlas@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      };

      return await sendEmailWithRetry(payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to send role change notification:", error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send notification when user is deactivated
   * @param email - User email address
   * @param fullName - User full name
   * @returns Promise with success status and optional error message
   */
  static async sendDeactivationNotification(
    email: string,
    fullName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending deactivation notification to ${email}`);

      const html = atlasDeactivationTemplate({
        fullName,
        email,
      });

      const payload: EmailPayload = {
        body: html,
        subject: "Your Atlas Access Has Been Deactivated",
        emails: [{
          emailAddress: email,
          name: fullName,
        }],
        from: "atlas@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      };

      return await sendEmailWithRetry(payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to send deactivation notification:", error);
      return { success: false, error: errorMessage };
    }
  }
}
