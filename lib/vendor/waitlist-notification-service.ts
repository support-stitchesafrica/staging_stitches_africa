/**
 * Waitlist Notification Service
 * Handles email notifications for vendor waitlist management
 */

import { BaseVendorService } from './base-service';
import { ServiceResponse } from '@/types/vendor-analytics';

// Notification types for waitlist system
export interface WaitlistNotificationData {
  // Vendor notification data
  vendorNotification?: {
    vendorName: string;
    vendorEmail: string;
    collectionName: string;
    subscriberName: string;
    subscriberEmail: string;
    subscriberPhone: string;
    currentSubscribers: number;
    minSubscribers: number;
    collectionUrl: string;
  };
  
  // Subscriber notification data
  subscriberNotification?: {
    subscriberName: string;
    subscriberEmail: string;
    collectionName: string;
    collectionDescription: string;
    vendorName: string;
    collectionUrl: string;
    loginCredentials?: {
      email: string;
      temporaryPassword: string;
    };
  };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class WaitlistNotificationService extends BaseVendorService {
  constructor() {
    super('WaitlistNotificationService');
  }

  /**
   * Sends vendor notification when someone subscribes to their waitlist
   */
  async sendVendorNotification(
    data: WaitlistNotificationData['vendorNotification']
  ): Promise<ServiceResponse<void>> {
    return this.executeWithErrorHandling(async () => {
      if (!data) {
        throw new Error('Vendor notification data is required');
      }

      this.validateRequired({
        vendorName: data.vendorName,
        vendorEmail: data.vendorEmail,
        collectionName: data.collectionName,
        subscriberName: data.subscriberName,
        subscriberEmail: data.subscriberEmail
      });

      const template = this.generateVendorNotificationTemplate(data);
      
      await this.sendEmail({
        to: data.vendorEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      this.log('info', 'Vendor notification sent', {
        vendorEmail: data.vendorEmail,
        collectionName: data.collectionName,
        subscriberEmail: data.subscriberEmail
      });
    }, 'sendVendorNotification');
  }

  /**
   * Sends subscriber confirmation when they join a waitlist
   */
  async sendSubscriberConfirmation(
    data: WaitlistNotificationData['subscriberNotification']
  ): Promise<ServiceResponse<void>> {
    return this.executeWithErrorHandling(async () => {
      if (!data) {
        throw new Error('Subscriber notification data is required');
      }

      this.validateRequired({
        subscriberName: data.subscriberName,
        subscriberEmail: data.subscriberEmail,
        collectionName: data.collectionName,
        vendorName: data.vendorName
      });

      const template = this.generateSubscriberConfirmationTemplate(data);
      
      await this.sendEmail({
        to: data.subscriberEmail,
        subject: template.subject,
        html: template.html,
        text: template.text
      });

      this.log('info', 'Subscriber confirmation sent', {
        subscriberEmail: data.subscriberEmail,
        collectionName: data.collectionName,
        vendorName: data.vendorName
      });
    }, 'sendSubscriberConfirmation');
  }

  /**
   * Sends both vendor and subscriber notifications
   */
  async sendBothNotifications(
    data: WaitlistNotificationData
  ): Promise<ServiceResponse<{ vendorSent: boolean; subscriberSent: boolean }>> {
    return this.executeWithErrorHandling(async () => {
      const results = {
        vendorSent: false,
        subscriberSent: false
      };

      // Send vendor notification
      if (data.vendorNotification) {
        const vendorResult = await this.sendVendorNotification(data.vendorNotification);
        results.vendorSent = vendorResult.success;
        
        if (!vendorResult.success) {
          this.log('warn', 'Vendor notification failed', {
            error: vendorResult.error,
            vendorEmail: data.vendorNotification.vendorEmail
          });
        }
      }

      // Send subscriber notification
      if (data.subscriberNotification) {
        const subscriberResult = await this.sendSubscriberConfirmation(data.subscriberNotification);
        results.subscriberSent = subscriberResult.success;
        
        if (!subscriberResult.success) {
          this.log('warn', 'Subscriber notification failed', {
            error: subscriberResult.error,
            subscriberEmail: data.subscriberNotification.subscriberEmail
          });
        }
      }

      this.log('info', 'Notification batch completed', results);
      return results;
    }, 'sendBothNotifications');
  }

  // ============================================================================
  // Template Generation Methods
  // ============================================================================

  /**
   * Generates vendor notification email template
   */
  private generateVendorNotificationTemplate(
    data: WaitlistNotificationData['vendorNotification']
  ): EmailTemplate {
    if (!data) throw new Error('Vendor notification data is required');

    const progressPercentage = Math.round((data.currentSubscribers / data.minSubscribers) * 100);
    const remainingSubscribers = Math.max(0, data.minSubscribers - data.currentSubscribers);

    const subject = `New Waitlist Subscriber: ${data.collectionName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Waitlist Subscriber</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .subscriber-info { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .progress-bar { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { background: #28a745; height: 100%; transition: width 0.3s ease; }
        .stats { display: flex; justify-content: space-between; margin: 15px 0; }
        .stat { text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #28a745; }
        .stat-label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; color: #28a745;">🎉 New Waitlist Subscriber!</h1>
            <p style="margin: 10px 0 0 0; color: #6c757d;">Someone just joined your collection waitlist</p>
        </div>
        
        <div class="content">
            <h2>Collection: ${data.collectionName}</h2>
            
            <div class="subscriber-info">
                <h3 style="margin-top: 0;">New Subscriber Details</h3>
                <p><strong>Name:</strong> ${data.subscriberName}</p>
                <p><strong>Email:</strong> ${data.subscriberEmail}</p>
                <p><strong>Phone:</strong> ${data.subscriberPhone}</p>
            </div>
            
            <h3>Waitlist Progress</h3>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercentage}%;"></div>
            </div>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">${data.currentSubscribers}</div>
                    <div class="stat-label">Current Subscribers</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${data.minSubscribers}</div>
                    <div class="stat-label">Target Subscribers</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${remainingSubscribers}</div>
                    <div class="stat-label">Remaining Needed</div>
                </div>
            </div>
            
            ${progressPercentage >= 100 ? 
              '<div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 6px; margin: 15px 0;"><strong>🎯 Target Reached!</strong> Your collection has reached its minimum subscriber goal. Consider launching your collection!</div>' :
              `<p>You need ${remainingSubscribers} more subscriber${remainingSubscribers !== 1 ? 's' : ''} to reach your target of ${data.minSubscribers}.</p>`
            }
            
            <a href="${data.collectionUrl}" class="button">View Collection Details</a>
        </div>
        
        <div class="footer">
            <p>This notification was sent because someone subscribed to your collection waitlist on Stitches Africa.</p>
            <p>© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
New Waitlist Subscriber - ${data.collectionName}

A new subscriber has joined your collection waitlist!

Subscriber Details:
- Name: ${data.subscriberName}
- Email: ${data.subscriberEmail}
- Phone: ${data.subscriberPhone}

Waitlist Progress:
- Current Subscribers: ${data.currentSubscribers}
- Target Subscribers: ${data.minSubscribers}
- Remaining Needed: ${remainingSubscribers}
- Progress: ${progressPercentage}%

${progressPercentage >= 100 ? 
  'Congratulations! Your collection has reached its minimum subscriber goal.' :
  `You need ${remainingSubscribers} more subscriber${remainingSubscribers !== 1 ? 's' : ''} to reach your target.`
}

View your collection: ${data.collectionUrl}

---
Stitches Africa
© ${new Date().getFullYear()} All rights reserved.
`;

    return { subject, html, text };
  }

  /**
   * Generates subscriber confirmation email template
   */
  private generateSubscriberConfirmationTemplate(
    data: WaitlistNotificationData['subscriberNotification']
  ): EmailTemplate {
    if (!data) throw new Error('Subscriber notification data is required');

    const subject = `Welcome to ${data.collectionName} Waitlist!`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waitlist Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
        .content { background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .collection-info { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .credentials-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        .next-steps { background: #e7f3ff; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
        .highlight { background: #fff3cd; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🎉 You're on the waitlist!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for joining our exclusive collection</p>
        </div>
        
        <div class="content">
            <h2>Hi ${data.subscriberName}!</h2>
            <p>Welcome to the waitlist for <strong>${data.collectionName}</strong> by ${data.vendorName}. You're now part of an exclusive group who will get first access when this collection launches!</p>
            
            <div class="collection-info">
                <h3 style="margin-top: 0;">About This Collection</h3>
                <p>${data.collectionDescription}</p>
                <p><strong>Created by:</strong> ${data.vendorName}</p>
            </div>
            
            ${data.loginCredentials ? `
            <div class="credentials-box">
                <h3 style="margin-top: 0;">🔐 Your Account Details</h3>
                <p>We've created a Stitches Africa account for you! Use these credentials to log in and track your waitlist status:</p>
                <p><strong>Email:</strong> <span class="highlight">${data.loginCredentials.email}</span></p>
                <p><strong>Temporary Password:</strong> <span class="highlight">${data.loginCredentials.temporaryPassword}</span></p>
                <p><small>⚠️ Please change your password after your first login for security.</small></p>
            </div>
            ` : ''}
            
            <div class="next-steps">
                <h3 style="margin-top: 0;">What happens next?</h3>
                <ul>
                    <li><strong>Stay tuned:</strong> We'll notify you as soon as the collection launches</li>
                    <li><strong>Early access:</strong> You'll get priority access before the general public</li>
                    <li><strong>Exclusive updates:</strong> Receive behind-the-scenes content and updates</li>
                    ${data.loginCredentials ? '<li><strong>Track progress:</strong> Log in to your account to see waitlist updates</li>' : ''}
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="${data.collectionUrl}" class="button">View Collection Details</a>
            </div>
        </div>
        
        <div class="footer">
            <p>You're receiving this email because you subscribed to a collection waitlist on Stitches Africa.</p>
            <p>Questions? Reply to this email or contact our support team.</p>
            <p>© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Welcome to ${data.collectionName} Waitlist!

Hi ${data.subscriberName}!

Thank you for joining the waitlist for "${data.collectionName}" by ${data.vendorName}. You're now part of an exclusive group who will get first access when this collection launches!

About This Collection:
${data.collectionDescription}
Created by: ${data.vendorName}

${data.loginCredentials ? `
Your Account Details:
We've created a Stitches Africa account for you!

Email: ${data.loginCredentials.email}
Temporary Password: ${data.loginCredentials.temporaryPassword}

Please change your password after your first login for security.
` : ''}

What happens next?
- Stay tuned: We'll notify you as soon as the collection launches
- Early access: You'll get priority access before the general public
- Exclusive updates: Receive behind-the-scenes content and updates
${data.loginCredentials ? '- Track progress: Log in to your account to see waitlist updates' : ''}

View collection details: ${data.collectionUrl}

---
Questions? Reply to this email or contact our support team.
Stitches Africa
© ${new Date().getFullYear()} All rights reserved.
`;

    return { subject, html, text };
  }

  // ============================================================================
  // Email Sending Methods
  // ============================================================================

  /**
   * Sends email using the appropriate method based on environment
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        // Client-side: use fetch to API endpoint
        const response = await fetch('/api/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: params.to,
            subject: params.subject,
            html: params.html,
            text: params.text
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Email API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(`Email sending failed: ${result.error || 'Unknown error'}`);
        }
      } else {
        // Server-side: use direct email service or log for now
        this.log('info', 'Email would be sent (server-side)', {
          to: params.to,
          subject: params.subject,
          htmlLength: params.html.length,
          textLength: params.text.length
        });

        // TODO: Implement direct server-side email sending
        // For now, we'll simulate success for development
        // In production, this should integrate with:
        // - SendGrid
        // - AWS SES
        // - Mailgun
        // - Resend
        // - Or existing Zoho Mail service

        // Example with existing Zoho service:
        // const { sendLoginNotification } = await import('@/lib/zohoMailer');
        // await sendLoginNotification({
        //   to: params.to,
        //   adminName: 'Stitches Africa',
        //   logoUrl: 'https://stitchesafrica.com/logo.png'
        // });
      }
    } catch (error) {
      this.log('error', 'Failed to send email', {
        to: params.to,
        subject: params.subject,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Validates email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitizes text content for email
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim();
  }

  /**
   * Generates a safe collection URL
   */
  private generateCollectionUrl(collectionSlug: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://stitchesafrica.com';
    return `${baseUrl}/waitlists/${encodeURIComponent(collectionSlug)}`;
  }
}