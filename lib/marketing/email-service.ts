// lib/marketing/email-service.ts
import { marketingInvitationTemplate } from "@/lib/emailTemplates/marketingInvitationTemplate";
import { marketingVendorAssignmentTemplate } from "@/lib/emailTemplates/marketingVendorAssignmentTemplate";
import { marketingVendorUnassignmentTemplate } from "@/lib/emailTemplates/marketingVendorUnassignmentTemplate";
import { marketingSystemAlertTemplate } from "@/lib/emailTemplates/marketingSystemAlertTemplate";
import type { MarketingRole } from "./types";

/**
 * Email service for Marketing Dashboard
 * Handles sending invitation, vendor assignment, and system alert emails
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
      console.log(`📩 Marketing Email API Response (Attempt ${attempt}):`, raw);

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

export class MarketingEmailService {
  /**
   * Send invitation email to new team member
   * @param email - Recipient email address
   * @param fullName - Recipient full name
   * @param role - Assigned marketing role
   * @param invitationLink - Invitation acceptance link with token
   * @param invitedByName - Name of the person who sent the invitation
   * @returns Promise with success status and optional error message
   */
  static async sendInvitationEmail(
    email: string,
    fullName: string,
    role: MarketingRole,
    invitationLink: string,
    invitedByName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending marketing invitation email to ${email} (${role})`);

      const html = marketingInvitationTemplate({
        fullName,
        email,
        role,
        invitationLink,
        invitedByName,
      });

      const payload: EmailPayload = {
        body: html,
        subject: "You're Invited to Join Stitches Africa Marketing Dashboard",
        emails: [{
          emailAddress: email,
          name: fullName,
        }],
        from: "marketing@stitchesafrica.com",
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
   * Send vendor assignment notification
   * @param recipientEmail - Email of the team member receiving the assignment
   * @param recipientName - Name of the team member
   * @param vendorName - Name of the assigned vendor
   * @param vendorId - ID of the vendor
   * @param assignedByName - Name of the person who made the assignment
   * @returns Promise with success status and optional error message
   */
  static async sendVendorAssignmentEmail(
    recipientEmail: string,
    recipientName: string,
    vendorName: string,
    vendorId: string,
    assignedByName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending vendor assignment email to ${recipientEmail}`);

      const html = marketingVendorAssignmentTemplate({
        recipientName,
        vendorName,
        vendorId,
        assignedByName,
      });

      const payload: EmailPayload = {
        body: html,
        subject: `New Vendor Assigned: ${vendorName}`,
        emails: [{
          emailAddress: recipientEmail,
          name: recipientName,
        }],
        from: "marketing@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      };

      return await sendEmailWithRetry(payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to send vendor assignment email:", error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send vendor reassignment notification
   * @param recipientEmail - Email of the new assignee
   * @param recipientName - Name of the new assignee
   * @param vendorName - Name of the reassigned vendor
   * @param vendorId - ID of the vendor
   * @param reassignedByName - Name of the person who made the reassignment
   * @param previousAssigneeName - Name of the previous assignee (optional)
   * @returns Promise with success status and optional error message
   */
  static async sendVendorReassignmentEmail(
    recipientEmail: string,
    recipientName: string,
    vendorName: string,
    vendorId: string,
    reassignedByName: string,
    previousAssigneeName?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending vendor reassignment email to ${recipientEmail}`);

      const html = marketingVendorAssignmentTemplate({
        recipientName,
        vendorName,
        vendorId,
        assignedByName: reassignedByName,
      });

      const payload: EmailPayload = {
        body: html,
        subject: `Vendor Reassigned to You: ${vendorName}`,
        emails: [{
          emailAddress: recipientEmail,
          name: recipientName,
        }],
        from: "marketing@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      };

      return await sendEmailWithRetry(payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to send vendor reassignment email:", error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send vendor unassignment notification
   * @param recipientEmail - Email of the user whose assignment was removed
   * @param recipientName - Name of the user
   * @param vendorName - Name of the unassigned vendor
   * @param vendorId - ID of the vendor
   * @param unassignedByName - Name of the person who removed the assignment
   * @param reason - Optional reason for unassignment
   * @returns Promise with success status and optional error message
   */
  static async sendUnassignmentEmail(
    recipientEmail: string,
    recipientName: string,
    vendorName: string,
    vendorId: string,
    unassignedByName: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending vendor unassignment email to ${recipientEmail}`);

      const html = marketingVendorUnassignmentTemplate({
        recipientName,
        vendorName,
        vendorId,
        unassignedByName,
        reason,
      });

      const payload: EmailPayload = {
        body: html,
        subject: `Vendor Assignment Removed: ${vendorName}`,
        emails: [{
          emailAddress: recipientEmail,
          name: recipientName,
        }],
        from: "marketing@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      };

      return await sendEmailWithRetry(payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to send vendor unassignment email:", error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send system alert notification to Super Admins
   * @param recipientEmail - Email of the Super Admin
   * @param recipientName - Name of the Super Admin
   * @param alertTitle - Title of the alert
   * @param alertMessage - Detailed alert message
   * @param alertType - Type of alert (info, warning, error, success)
   * @param actionLink - Optional link for action button
   * @param actionText - Optional text for action button
   * @returns Promise with success status and optional error message
   */
  static async sendSystemAlertEmail(
    recipientEmail: string,
    recipientName: string,
    alertTitle: string,
    alertMessage: string,
    alertType: 'info' | 'warning' | 'error' | 'success' = 'info',
    actionLink?: string,
    actionText?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending system alert email to ${recipientEmail} (${alertType})`);

      const html = marketingSystemAlertTemplate({
        recipientName,
        alertTitle,
        alertMessage,
        alertType,
        actionLink,
        actionText,
      });

      const payload: EmailPayload = {
        body: html,
        subject: `Marketing Dashboard Alert: ${alertTitle}`,
        emails: [{
          emailAddress: recipientEmail,
          name: recipientName,
        }],
        from: "marketing@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      };

      return await sendEmailWithRetry(payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to send system alert email:", error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send bulk assignment summary notification
   * @param recipientEmail - Email of the person who made the assignments
   * @param recipientName - Name of the person
   * @param successCount - Number of successful assignments
   * @param failedCount - Number of failed assignments
   * @param totalCount - Total number of assignments attempted
   * @returns Promise with success status and optional error message
   */
  static async sendBulkAssignmentSummaryEmail(
    recipientEmail: string,
    recipientName: string,
    successCount: number,
    failedCount: number,
    totalCount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending bulk assignment summary email to ${recipientEmail}`);

      const alertType = failedCount === 0 ? 'success' : failedCount < totalCount ? 'warning' : 'error';
      const alertTitle = "Bulk Vendor Assignment Complete";
      const alertMessage = `
        Your bulk vendor assignment operation has completed.
        <br><br>
        <strong>Results:</strong><br>
        • Successful: ${successCount} of ${totalCount}<br>
        • Failed: ${failedCount} of ${totalCount}
        ${failedCount > 0 ? '<br><br>Please review the failed assignments and try again.' : ''}
      `;

      const html = marketingSystemAlertTemplate({
        recipientName,
        alertTitle,
        alertMessage,
        alertType,
        actionLink: "https://staging-stitches-africa.vercel.app/marketing/vendors",
        actionText: "View Vendors",
      });

      const payload: EmailPayload = {
        body: html,
        subject: "Bulk Vendor Assignment Summary",
        emails: [{
          emailAddress: recipientEmail,
          name: recipientName,
        }],
        from: "marketing@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      };

      return await sendEmailWithRetry(payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to send bulk assignment summary email:", error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send task update notification
   * @param recipientEmail - Email of the team member receiving the update
   * @param recipientName - Name of the team member
   * @param taskTitle - Title of the updated task
   * @param vendorName - Name of the vendor associated with the task
   * @param updatedByName - Name of the person who made the update
   * @param status - New status of the task (optional)
   * @param priority - New priority of the task (optional)
   * @returns Promise with success status and optional error message
   */
  static async sendTaskUpdateEmail(
    recipientEmail: string,
    recipientName: string,
    taskTitle: string,
    vendorName: string,
    updatedByName: string,
    status?: string,
    priority?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending task update email to ${recipientEmail}`);

      const updates = [];
      if (status) updates.push(`Status: ${status}`);
      if (priority) updates.push(`Priority: ${priority}`);

      const alertType = "info";
      const alertTitle = "Task Updated";
      const alertMessage = `
        ${updatedByName} has updated task "${taskTitle}" for vendor "${vendorName}".
        <br><br>
        <strong>Updates:</strong><br>
        ${updates.length > 0 ? updates.map(u => `• ${u}<br>`).join('') : 'Task details have been modified.'}
      `;

      // Using system alert template for task updates
      const html = marketingSystemAlertTemplate({
        recipientName,
        alertTitle,
        alertMessage,
        alertType,
        actionLink: "https://staging-stitches-africa.vercel.app/marketing/tasks",
        actionText: "View Task",
      });

      const payload: EmailPayload = {
        body: html,
        subject: `Task Updated: ${taskTitle}`,
        emails: [{
          emailAddress: recipientEmail,
          name: recipientName,
        }],
        from: "marketing@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      };

      return await sendEmailWithRetry(payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to send task update email:", error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send task assignment notification
   * @param recipientEmail - Email of the team member receiving the assignment
   * @param recipientName - Name of the team member
   * @param taskTitle - Title of the assigned task
   * @param vendorName - Name of the vendor associated with the task
   * @param assignedByName - Name of the person who made the assignment
   * @param dueDate - Due date of the task
   * @returns Promise with success status and optional error message
   */
  static async sendTaskAssignmentEmail(
    recipientEmail: string,
    recipientName: string,
    taskTitle: string,
    vendorName: string,
    assignedByName: string,
    dueDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending task assignment email to ${recipientEmail}`);

      const alertType = "success";
      const alertTitle = "New Task Assigned";
      const alertMessage = `
        ${assignedByName} has assigned task "${taskTitle}" for vendor "${vendorName}" to you.
        <br><br>
        <strong>Due Date:</strong> ${dueDate.toLocaleDateString()}
      `;

      // Using system alert template for task assignments
      const html = marketingSystemAlertTemplate({
        recipientName,
        alertTitle,
        alertMessage,
        alertType,
        actionLink: "https://staging-stitches-africa.vercel.app/marketing/tasks",
        actionText: "View Task",
      });

      const payload: EmailPayload = {
        body: html,
        subject: `New Task Assigned: ${taskTitle}`,
        emails: [{
          emailAddress: recipientEmail,
          name: recipientName,
        }],
        from: "marketing@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      };

      return await sendEmailWithRetry(payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to send task assignment email:", error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send task reminder notification
   * @param recipientEmail - Email of the team member receiving the reminder
   * @param recipientName - Name of the team member
   * @param taskTitle - Title of the task
   * @param vendorName - Name of the vendor associated with the task
   * @param dueDate - Due date of the task
   * @returns Promise with success status and optional error message
   */
  static async sendTaskReminderEmail(
    recipientEmail: string,
    recipientName: string,
    taskTitle: string,
    vendorName: string,
    dueDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📧 Sending task reminder email to ${recipientEmail}`);

      const alertType = "warning";
      const alertTitle = "Task Reminder";
      const alertMessage = `
        Reminder: Task "${taskTitle}" for vendor "${vendorName}" is due soon.
        <br><br>
        <strong>Due Date:</strong> ${dueDate.toLocaleDateString()}
      `;

      // Using system alert template for task reminders
      const html = marketingSystemAlertTemplate({
        recipientName,
        alertTitle,
        alertMessage,
        alertType,
        actionLink: "https://staging-stitches-africa.vercel.app/marketing/tasks",
        actionText: "View Task",
      });

      const payload: EmailPayload = {
        body: html,
        subject: `Task Reminder: ${taskTitle}`,
        emails: [{
          emailAddress: recipientEmail,
          name: recipientName,
        }],
        from: "marketing@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      };

      return await sendEmailWithRetry(payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Failed to send task reminder email:", error);
      return { success: false, error: errorMessage };
    }
  }
}
