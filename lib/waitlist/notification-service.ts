/**
 * Waitlist Notification Service
 * Handles email and WhatsApp notifications for waitlist signups
 */

import { Waitlist, WaitlistSignup, WaitlistProduct, WaitlistNotificationData, NotificationTemplate } from '@/types/waitlist';

// Email service (using existing email infrastructure)
interface EmailService {
  sendEmail(to: string, subject: string, html: string): Promise<void>;
}

// WhatsApp service interface
interface WhatsAppService {
  sendMessage(to: string, message: string): Promise<void>;
}

/**
 * Notification Service for Waitlist System
 */
export class WaitlistNotificationService {
  private static emailService: EmailService | null = null;
  private static whatsappService: WhatsAppService | null = null;

  /**
   * Initialize services
   */
  static initialize(emailService?: EmailService, whatsappService?: WhatsAppService) {
    this.emailService = emailService || null;
    this.whatsappService = whatsappService || null;
  }

  /**
   * Send signup confirmation notifications
   */
  static async sendSignupConfirmation(
    waitlist: Waitlist,
    signup: WaitlistSignup,
    products: WaitlistProduct[]
  ): Promise<void> {
    const notificationData: WaitlistNotificationData = {
      waitlist,
      signup,
      products
    };

    const promises: Promise<void>[] = [];

    // Send email notification if enabled
    if (waitlist.notificationChannels.includes('EMAIL') || waitlist.notificationChannels.includes('BOTH')) {
      promises.push(this.sendEmailNotification(notificationData));
    }

    // Send WhatsApp notification if enabled
    if (waitlist.notificationChannels.includes('WHATSAPP') || waitlist.notificationChannels.includes('BOTH')) {
      promises.push(this.sendWhatsAppNotification(notificationData));
    }

    // Execute all notifications
    await Promise.allSettled(promises);
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(data: WaitlistNotificationData): Promise<void> {
    if (!this.emailService) {
      console.warn('Email service not initialized');
      return;
    }

    try {
      const template = this.generateEmailTemplate(data);
      await this.emailService.sendEmail(
        data.signup.email,
        template.subject,
        template.message
      );
      console.log(`Email sent to ${data.signup.email} for waitlist ${data.waitlist.title}`);
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp notification
   */
  private static async sendWhatsAppNotification(data: WaitlistNotificationData): Promise<void> {
    if (!this.whatsappService) {
      console.warn('WhatsApp service not initialized');
      return;
    }

    try {
      const template = this.generateWhatsAppTemplate(data);
      await this.whatsappService.sendMessage(
        data.signup.whatsapp,
        template.message
      );
      console.log(`WhatsApp sent to ${data.signup.whatsapp} for waitlist ${data.waitlist.title}`);
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
      throw error;
    }
  }

  /**
   * Generate email template
   */
  private static generateEmailTemplate(data: WaitlistNotificationData): NotificationTemplate {
    const { waitlist, signup, products } = data;
    
    const countdownDate = waitlist.countdownEndAt.toDate();
    const formattedDate = countdownDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const productList = products.map(p => `• ${p.name}`).join('\n');

    const subject = `🎉 You're on the ${waitlist.title} waitlist!`;

    const message = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waitlist Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .countdown { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border-left: 4px solid #667eea; }
        .products { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .emoji { font-size: 24px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="emoji">🎉</div>
        <h1>Welcome to the Waitlist!</h1>
        <p>Hi ${signup.fullName}, you're all set!</p>
    </div>
    
    <div class="content">
        <h2>Thanks for joining the ${waitlist.title} waitlist!</h2>
        <p>${waitlist.description}</p>
        
        <div class="countdown">
            <h3>⏰ Launch Date</h3>
            <p><strong>${formattedDate}</strong></p>
            <p>Mark your calendar! We'll notify you when it's time.</p>
        </div>
        
        ${products.length > 0 ? `
        <div class="products">
            <h3>🛍️ What's Coming</h3>
            <p>Here's what you can expect:</p>
            <div style="margin: 15px 0; font-family: monospace; white-space: pre-line;">${productList}</div>
        </div>
        ` : ''}
        
        <p>We'll keep you updated with exclusive news and launch details. Get ready for something amazing!</p>
        
        ${waitlist.launchUrl ? `
        <div style="text-align: center; margin: 30px 0;">
            <a href="${waitlist.launchUrl}" class="button">Learn More</a>
        </div>
        ` : ''}
    </div>
    
    <div class="footer">
        <p>This email was sent to ${signup.email}</p>
        <p>© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
        <p>Follow us for updates and behind-the-scenes content!</p>
    </div>
</body>
</html>
    `.trim();

    return {
      subject,
      message,
      variables: {
        waitlistTitle: waitlist.title,
        userName: signup.fullName,
        launchDate: formattedDate,
        productCount: products.length.toString()
      }
    };
  }

  /**
   * Generate WhatsApp template
   */
  private static generateWhatsAppTemplate(data: WaitlistNotificationData): NotificationTemplate {
    const { waitlist, signup, products } = data;
    
    const countdownDate = waitlist.countdownEndAt.toDate();
    const formattedDate = countdownDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const productNames = products.slice(0, 3).map(p => p.name).join(', ');
    const moreProducts = products.length > 3 ? ` and ${products.length - 3} more` : '';

    const message = `
🎉 *Welcome to the ${waitlist.title} Waitlist!*

Hi ${signup.fullName}! Thanks for signing up on Stitches Africa.

📅 *Launch Date:* ${formattedDate}

${waitlist.shortDescription || waitlist.description}

${products.length > 0 ? `🛍️ *Coming Soon:* ${productNames}${moreProducts}` : ''}

We'll keep you updated with exclusive news and launch details. Get ready for something amazing!

${waitlist.launchUrl ? `🔗 Learn more: ${waitlist.launchUrl}` : ''}

---
Stitches Africa Team
    `.trim();

    return {
      subject: `${waitlist.title} Waitlist Confirmation`,
      message,
      variables: {
        waitlistTitle: waitlist.title,
        userName: signup.fullName,
        launchDate: formattedDate
      }
    };
  }

  /**
   * Send launch notification to all waitlist signups
   */
  static async sendLaunchNotification(
    waitlist: Waitlist,
    signups: WaitlistSignup[],
    products: WaitlistProduct[]
  ): Promise<void> {
    const batchSize = 10; // Process in batches to avoid rate limits
    
    for (let i = 0; i < signups.length; i += batchSize) {
      const batch = signups.slice(i, i + batchSize);
      
      const promises = batch.map(signup => 
        this.sendLaunchNotificationToUser(waitlist, signup, products)
      );
      
      await Promise.allSettled(promises);
      
      // Add delay between batches
      if (i + batchSize < signups.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Send launch notification to individual user
   */
  private static async sendLaunchNotificationToUser(
    waitlist: Waitlist,
    signup: WaitlistSignup,
    products: WaitlistProduct[]
  ): Promise<void> {
    const notificationData: WaitlistNotificationData = {
      waitlist,
      signup,
      products
    };

    const promises: Promise<void>[] = [];

    // Send email notification if enabled
    if (waitlist.notificationChannels.includes('EMAIL') || waitlist.notificationChannels.includes('BOTH')) {
      promises.push(this.sendLaunchEmailNotification(notificationData));
    }

    // Send WhatsApp notification if enabled
    if (waitlist.notificationChannels.includes('WHATSAPP') || waitlist.notificationChannels.includes('BOTH')) {
      promises.push(this.sendLaunchWhatsAppNotification(notificationData));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send launch email notification
   */
  private static async sendLaunchEmailNotification(data: WaitlistNotificationData): Promise<void> {
    if (!this.emailService) return;

    try {
      const template = this.generateLaunchEmailTemplate(data);
      await this.emailService.sendEmail(
        data.signup.email,
        template.subject,
        template.message
      );
    } catch (error) {
      console.error('Failed to send launch email:', error);
    }
  }

  /**
   * Send launch WhatsApp notification
   */
  private static async sendLaunchWhatsAppNotification(data: WaitlistNotificationData): Promise<void> {
    if (!this.whatsappService) return;

    try {
      const template = this.generateLaunchWhatsAppTemplate(data);
      await this.whatsappService.sendMessage(
        data.signup.whatsapp,
        template.message
      );
    } catch (error) {
      console.error('Failed to send launch WhatsApp:', error);
    }
  }

  /**
   * Generate launch email template
   */
  private static generateLaunchEmailTemplate(data: WaitlistNotificationData): NotificationTemplate {
    const { waitlist, signup, products } = data;
    
    const subject = `🚀 ${waitlist.title} is now LIVE!`;
    
    const productList = products.map(p => 
      `• ${p.name}${p.price ? ` - ₦${p.price.toLocaleString()}` : ''}`
    ).join('\n');

    const message = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Launch Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .cta { background: #fff; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .products { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; font-size: 16px; }
        .emoji { font-size: 32px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="emoji">🚀</div>
        <h1>IT'S LIVE!</h1>
        <p>Hi ${signup.fullName}, the wait is over!</p>
    </div>
    
    <div class="content">
        <h2>${waitlist.title} is now available!</h2>
        <p>Thank you for your patience. The collection you've been waiting for is finally here!</p>
        
        <div class="cta">
            <h3>🛍️ Shop Now - Limited Time!</h3>
            <p>Be among the first to get your hands on these exclusive pieces.</p>
            ${waitlist.launchUrl ? `
            <a href="${waitlist.launchUrl}" class="button">SHOP NOW</a>
            ` : ''}
        </div>
        
        ${products.length > 0 ? `
        <div class="products">
            <h3>✨ What's Available</h3>
            <div style="margin: 15px 0; font-family: monospace; white-space: pre-line;">${productList}</div>
        </div>
        ` : ''}
        
        <p>Don't wait too long - these pieces are expected to sell out quickly!</p>
    </div>
</body>
</html>
    `.trim();

    return { subject, message, variables: {} };
  }

  /**
   * Generate launch WhatsApp template
   */
  private static generateLaunchWhatsAppTemplate(data: WaitlistNotificationData): NotificationTemplate {
    const { waitlist, signup } = data;
    
    const message = `
🚀 *${waitlist.title} is LIVE!*

Hi ${signup.fullName}! The wait is over!

The collection you've been waiting for is finally available on Stitches Africa.

🛍️ *Shop now before it sells out!*

${waitlist.launchUrl ? `🔗 Shop here: ${waitlist.launchUrl}` : ''}

Thank you for your patience. Happy shopping! 🎉

---
Stitches Africa Team
    `.trim();

    return {
      subject: `${waitlist.title} Launch`,
      message,
      variables: {}
    };
  }
}

/**
 * Simple email service implementation using existing infrastructure
 */
export class SimpleEmailService implements EmailService {
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      // Use existing email service or implement with your preferred provider
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          html
        })
      });

      if (!response.ok) {
        throw new Error(`Email service responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }
}

/**
 * Simple WhatsApp service implementation
 */
export class SimpleWhatsAppService implements WhatsAppService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.WHATSAPP_API_KEY || '';
    this.baseUrl = baseUrl || process.env.WHATSAPP_API_URL || '';
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.apiKey || !this.baseUrl) {
      console.warn('WhatsApp service not configured');
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          to: to.replace(/\D/g, ''), // Remove non-digits
          message
        })
      });

      if (!response.ok) {
        throw new Error(`WhatsApp service responded with ${response.status}`);
      }
    } catch (error) {
      console.error('WhatsApp sending failed:', error);
      throw error;
    }
  }
}