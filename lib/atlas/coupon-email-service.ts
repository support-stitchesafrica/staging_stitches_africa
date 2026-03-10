/**
 * Coupon Email Service
 * Handles sending coupon notification emails
 */

import { Coupon } from '@/types/coupon';
import { couponEmailTemplate, CouponEmailData } from '@/lib/emailTemplates/couponTemplate';
import { CouponService } from './coupon-service';

/**
 * Coupon Email Service
 */
export class CouponEmailService {
  /**
   * Send email via Stitches Africa staging API
   */
  private static async sendViaStagingAPI(
    to: string,
    subject: string,
    htmlContent: string
  ): Promise<void> {
    const response = await fetch('https://stitchesafricamobile-backend.onrender.com/api/Email/Send', {
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: htmlContent,
        subject,
        emails: [{
          emailAddress: to,
          name: to.split('@')[0],
        }],
        from: 'noreply@stitchesafrica.com',
        replyTo: 'support@stitchesafrica.com',
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      throw new Error(`Email API error: ${response.status} - ${raw}`);
    }

    console.log(`Coupon email sent successfully to ${to}`);
  }

  /**
   * Render coupon email HTML
   */
  static renderCouponEmail(coupon: Coupon): string {
    const emailData: CouponEmailData = {
      couponCode: coupon.couponCode,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      expiryDate: coupon.expiryDate?.toDate(),
      minOrderAmount: coupon.minOrderAmount,
      recipientName: undefined, // Could be enhanced to fetch user name
    };

    return couponEmailTemplate(emailData);
  }

  /**
   * Send coupon email to assigned user
   */
  static async sendCouponEmail(coupon: Coupon): Promise<void> {
    try {
      // Render email HTML
      const htmlContent = this.renderCouponEmail(coupon);

      // Create subject line
      const discountDisplay = coupon.discountType === 'PERCENTAGE'
        ? `${coupon.discountValue}% OFF`
        : `₦${coupon.discountValue.toLocaleString()} OFF`;
      
      const subject = `🎉 Your Exclusive Coupon: ${discountDisplay} - Stitches Africa`;

      // Send email
      await this.sendViaStagingAPI(
        coupon.assignedEmail,
        subject,
        htmlContent
      );

      // Update coupon email status
      await CouponService.updateEmailStatus(coupon.id, true);

      console.log(`Coupon email sent successfully to ${coupon.assignedEmail}`);
    } catch (error: any) {
      console.error('Failed to send coupon email:', error);

      // Update coupon with error
      await CouponService.updateEmailStatus(
        coupon.id,
        false,
        error.message || 'Failed to send email'
      );

      throw error;
    }
  }

  /**
   * Resend coupon email
   */
  static async resendCouponEmail(couponId: string): Promise<void> {
    // Get coupon
    const coupon = await CouponService.getCoupon(couponId);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Check if coupon is active
    if (coupon.status !== 'ACTIVE') {
      throw new Error('Cannot send email for inactive coupon');
    }

    // Send email
    await this.sendCouponEmail(coupon);
  }

  /**
   * Send bulk coupon emails (for batch operations)
   */
  static async sendBulkCouponEmails(couponIds: string[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ couponId: string; error: string }>;
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ couponId: string; error: string }>
    };

    for (const couponId of couponIds) {
      try {
        await this.resendCouponEmail(couponId);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          couponId,
          error: error.message || 'Unknown error'
        });
      }
    }

    return results;
  }
}
