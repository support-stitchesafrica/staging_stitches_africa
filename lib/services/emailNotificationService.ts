// lib/services/emailNotificationService.ts
/**
 * Email Notification Service
 * Centralized service for sending email notifications in the shops section
 */

export interface WelcomeEmailData {
  email: string;
  customerName: string;
}

export interface LoginNotificationData {
  email: string;
  customerName: string;
  ipAddress?: string;
  device?: string;
}

export interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface VendorEmailData {
  email: string;
  vendorName: string;
  items: OrderItem[];
  subtotal: number;
}

export interface OrderConfirmationData {
  customerEmail: string;
  customerName: string;
  orderId: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  currency?: string;
  shippingAddress: string;
  vendorEmails?: VendorEmailData[];
}

export class EmailNotificationService {
  /**
   * Send welcome email to new customer
   * @param data Welcome email data
   * @returns Promise<boolean> Success status
   */
  static async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const response = await fetch('/api/shops/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Failed to send welcome email:', await response.text());
        return false;
      }

      console.log('✅ Welcome email sent successfully to:', data.email);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }

  /**
   * Send login notification to customer
   * @param data Login notification data
   * @returns Promise<boolean> Success status
   */
  static async sendLoginNotification(data: LoginNotificationData): Promise<boolean> {
    try {
      const response = await fetch('/api/shops/send-login-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Failed to send login notification:', await response.text());
        return false;
      }

      console.log('✅ Login notification sent successfully to:', data.email);
      return true;
    } catch (error) {
      console.error('Error sending login notification:', error);
      return false;
    }
  }

  /**
   * Send order confirmation to customer and vendors
   * @param data Order confirmation data
   * @returns Promise<boolean> Success status
   */
  static async sendOrderConfirmation(data: OrderConfirmationData): Promise<boolean> {
    try {
      const response = await fetch('/api/shops/send-order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error('Failed to send order confirmation:', await response.text());
        return false;
      }

      const result = await response.json();
      console.log('✅ Order confirmation emails sent:', result);
      return true;
    } catch (error) {
      console.error('Error sending order confirmation:', error);
      return false;
    }
  }

  /**
   * Helper to extract customer name from user object or email
   * @param user User object with displayName and email
   * @returns Customer name
   */
  static getCustomerName(user: { displayName?: string | null; email?: string | null }): string {
    return user.displayName || user.email?.split('@')[0] || 'Customer';
  }

  /**
   * Helper to get device information
   * @returns Device string
   */
  static getDeviceInfo(): string {
    if (typeof navigator === 'undefined') return 'Unknown Device';
    return navigator.userAgent;
  }

  /**
   * Helper to format order date
   * @param date Date object or string
   * @returns Formatted date string
   */
  static formatOrderDate(date?: Date | string): string {
    const dateObj = date ? new Date(date) : new Date();
    return dateObj.toLocaleDateString('en-US', { dateStyle: 'full' });
  }
}
