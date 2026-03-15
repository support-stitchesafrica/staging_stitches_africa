/**
 * Send Order Confirmation Email API
 * POST: Send order confirmation emails to customer and vendors
 */

import { NextResponse } from 'next/server';

const EMAIL_API_URL = 'https://stitchesafricamobile-backend.onrender.com/api/Email/Send';

// Admin emails to receive all order notifications
const ADMIN_EMAILS = [
  'stitchesafrica1m@gmail.com',
  'stitchesafrica8m@gmail.com',
  'support@stitchesafrica.com'
];

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  image?: string;
  type?: string;
}

interface VendorEmail {
  vendorName: string;
  email: string;
  items: OrderItem[];
  subtotal: number;
}

interface CouponInfo {
  code: string;
  discountAmount: number;
  currency: string;
}

/**
 * POST /api/shops/send-order-confirmation
 * Send order confirmation emails
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerEmail,
      customerName,
      orderId,
      orderDate,
      items,
      subtotal,
      shippingCost,
      total,
      currency,
      shippingAddress,
      vendorEmails,
      measurements,
      coupon
    }: {
      customerEmail: string;
      customerName: string;
      orderId: string;
      orderDate: string;
      items: OrderItem[];
      subtotal: number;
      shippingCost: number;
      total: number;
      currency: string;
      shippingAddress: string;
      vendorEmails: VendorEmail[];
      measurements?: any;
      coupon?: CouponInfo;
    } = body;

    // Validate required fields
    if (!customerEmail || !orderId || !items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields'
        },
        { status: 400 }
      );
    }

    const emailsSent: string[] = [];
    const emailsFailed: string[] = [];

    // Format currency
    const formatPrice = (amount: number, curr: string = currency) => {
      if (curr === 'NGN') {
        return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return `$${amount.toFixed(2)}`;
    };

    // 1. Send customer confirmation email
    try {
      const customerEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Stitches Africa</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #000;">Thank You for Your Order!</h2>
            <p>Hi ${customerName},</p>
            <p>We've received your order and will process it shortly. Here are your order details:</p>
            
            <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Order Details</h3>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Order Date:</strong> ${orderDate}</p>
              <p><strong>Shipping Address:</strong><br>${shippingAddress.replace(/\n/g, '<br>')}</p>
            </div>

            <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Items Ordered</h3>
              ${items.map(item => `
                <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                  <p style="margin: 5px 0;"><strong>${item.title}</strong></p>
                  <p style="margin: 5px 0; color: #666;">Quantity: ${item.quantity} × ${formatPrice(item.price)}</p>
                  ${item.type === 'bespoke' ? '<p style="margin: 5px 0; color: #9333ea;"><em>Bespoke Item - Custom Made</em></p>' : ''}
                </div>
              `).join('')}
            </div>

            <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0;">Subtotal:</td>
                  <td style="text-align: right; padding: 8px 0;">${formatPrice(subtotal)}</td>
                </tr>
                ${coupon ? `
                <tr style="color: #16a34a;">
                  <td style="padding: 8px 0;">Coupon (${coupon.code}):</td>
                  <td style="text-align: right; padding: 8px 0;">-${formatPrice(coupon.discountAmount, coupon.currency)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0;">Shipping:</td>
                  <td style="text-align: right; padding: 8px 0;">${formatPrice(shippingCost)}</td>
                </tr>
                <tr style="border-top: 2px solid #000; font-weight: bold; font-size: 1.1em;">
                  <td style="padding: 12px 0;">Total:</td>
                  <td style="text-align: right; padding: 12px 0;">${formatPrice(total)}</td>
                </tr>
              </table>
            </div>

            ${measurements ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #92400e;">Bespoke Items - Measurements Included</h3>
              <p style="color: #92400e;">Your custom measurements have been included with this order for bespoke items.</p>
            </div>
            ` : ''}

            <p style="margin-top: 30px;">We'll send you another email when your order ships.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Stitches Africa Team</strong></p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 0.9em; color: #666;">
            <p>© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </body>
        </html>
      `;

      const customerEmailResponse = await fetch(EMAIL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: customerEmail,
          subject: `Order Confirmation - ${orderId}`,
          body: customerEmailHtml,
          isHtml: true
        })
      });

      if (!customerEmailResponse.ok) {
        throw new Error(`Email API returned ${customerEmailResponse.status}`);
      }

      emailsSent.push(customerEmail);
      console.log(`✅ Customer confirmation email sent to ${customerEmail}`);
    } catch (error) {
      console.error(`❌ Failed to send customer email to ${customerEmail}:`, error);
      emailsFailed.push(customerEmail);
    }

    // 2. Send vendor notification emails
    if (vendorEmails && vendorEmails.length > 0) {
      for (const vendor of vendorEmails) {
        try {
          const vendorEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Order Notification</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">New Order Received</h1>
              </div>
              
              <div style="padding: 20px; background-color: #f9f9f9;">
                <h2 style="color: #000;">Hello ${vendor.vendorName},</h2>
                <p>You have received a new order on Stitches Africa!</p>
                
                <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Order Information</h3>
                  <p><strong>Order ID:</strong> ${orderId}</p>
                  <p><strong>Order Date:</strong> ${orderDate}</p>
                  <p><strong>Customer:</strong> ${customerName}</p>
                  <p><strong>Shipping Address:</strong><br>${shippingAddress.replace(/\n/g, '<br>')}</p>
                </div>

                <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Your Items</h3>
                  ${vendor.items.map(item => `
                    <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                      <p style="margin: 5px 0;"><strong>${item.title}</strong></p>
                      <p style="margin: 5px 0; color: #666;">Quantity: ${item.quantity} × ${formatPrice(item.price)}</p>
                      ${item.type === 'bespoke' ? '<p style="margin: 5px 0; color: #9333ea;"><em>Bespoke Item - Measurements Included</em></p>' : ''}
                    </div>
                  `).join('')}
                  
                  <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #000;">
                    <p style="font-weight: bold; font-size: 1.1em;">Your Subtotal: ${formatPrice(vendor.subtotal)}</p>
                  </div>
                </div>

                ${measurements && vendor.items.some((item: OrderItem) => item.type === 'bespoke') ? `
                <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <h3 style="margin-top: 0; color: #92400e;">Customer Measurements Included</h3>
                  <p style="color: #92400e;">This order contains bespoke items. Customer measurements are available in your vendor dashboard.</p>
                </div>
                ` : ''}

                <p style="margin-top: 30px;">Please log in to your vendor dashboard to view full order details and begin processing.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://https://staging-stitches-africa.vercel.app/vendor/orders/${orderId}" 
                     style="background-color: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    View Order Details
                  </a>
                </div>
                
                <p style="margin-top: 30px;">Best regards,<br><strong>Stitches Africa Team</strong></p>
              </div>
              
              <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 0.9em; color: #666;">
                <p>© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
              </div>
            </body>
            </html>
          `;

          const vendorEmailResponse = await fetch(EMAIL_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: vendor.email,
              subject: `New Order - ${orderId}`,
              body: vendorEmailHtml,
              isHtml: true
            })
          });

          if (!vendorEmailResponse.ok) {
            throw new Error(`Email API returned ${vendorEmailResponse.status}`);
          }

          emailsSent.push(vendor.email);
          console.log(`✅ Vendor notification email sent to ${vendor.email}`);
        } catch (error) {
          console.error(`❌ Failed to send vendor email to ${vendor.email}:`, error);
          emailsFailed.push(vendor.email);
        }
      }
    }

    // 3. Send admin notification emails
    for (const adminEmail of ADMIN_EMAILS) {
      try {
        const adminEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Order - Admin Notification</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #7c3aed; color: #fff; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">🎉 New Order Placed!</h1>
            </div>
            
            <div style="padding: 20px; background-color: #f9f9f9;">
              <h2 style="color: #000;">Admin Notification</h2>
              <p>A new order has been placed on Stitches Africa.</p>
              
              <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Order Details</h3>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Order Date:</strong> ${orderDate}</p>
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Customer Email:</strong> ${customerEmail}</p>
                <p><strong>Shipping Address:</strong><br>${shippingAddress.replace(/\n/g, '<br>')}</p>
              </div>

              <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Order Items (${items.length})</h3>
                ${items.map(item => `
                  <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                    <p style="margin: 5px 0;"><strong>${item.title}</strong></p>
                    <p style="margin: 5px 0; color: #666;">Quantity: ${item.quantity} × ${formatPrice(item.price)}</p>
                    ${item.type === 'bespoke' ? '<p style="margin: 5px 0; color: #9333ea;"><em>⭐ Bespoke Item</em></p>' : ''}
                  </div>
                `).join('')}
              </div>

              <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Order Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0;">Subtotal:</td>
                    <td style="text-align: right; padding: 8px 0;">${formatPrice(subtotal)}</td>
                  </tr>
                  ${coupon ? `
                  <tr style="color: #16a34a;">
                    <td style="padding: 8px 0;">Coupon (${coupon.code}):</td>
                    <td style="text-align: right; padding: 8px 0;">-${formatPrice(coupon.discountAmount, coupon.currency)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0;">Shipping:</td>
                    <td style="text-align: right; padding: 8px 0;">${formatPrice(shippingCost)}</td>
                  </tr>
                  <tr style="border-top: 2px solid #000; font-weight: bold; font-size: 1.1em;">
                    <td style="padding: 12px 0;">Total:</td>
                    <td style="text-align: right; padding: 12px 0;">${formatPrice(total)}</td>
                  </tr>
                </table>
              </div>

              ${measurements ? `
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h3 style="margin-top: 0; color: #92400e;">⭐ Bespoke Order</h3>
                <p style="color: #92400e;">This order includes bespoke items with customer measurements.</p>
              </div>
              ` : ''}

              ${vendorEmails && vendorEmails.length > 0 ? `
              <div style="background-color: #e0e7ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6366f1;">
                <h3 style="margin-top: 0; color: #3730a3;">Vendors Notified (${vendorEmails.length})</h3>
                ${vendorEmails.map(v => `<p style="margin: 5px 0; color: #4338ca;">• ${v.vendorName} (${v.email})</p>`).join('')}
              </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://https://staging-stitches-africa.vercel.app/atlas" 
                   style="background-color: #7c3aed; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View in Admin Dashboard
                </a>
              </div>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 0.9em; color: #666;">
              <p>© ${new Date().getFullYear()} Stitches Africa. All rights reserved.</p>
              <p>This is an automated admin notification.</p>
            </div>
          </body>
          </html>
        `;

        const adminEmailResponse = await fetch(EMAIL_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: adminEmail,
            subject: `🎉 New Order ${orderId} - ${customerName}`,
            body: adminEmailHtml,
            isHtml: true
          })
        });

        if (!adminEmailResponse.ok) {
          throw new Error(`Email API returned ${adminEmailResponse.status}`);
        }

        emailsSent.push(adminEmail);
        console.log(`✅ Admin notification email sent to ${adminEmail}`);
      } catch (error) {
        console.error(`❌ Failed to send admin email to ${adminEmail}:`, error);
        emailsFailed.push(adminEmail);
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      emailsFailed,
      message: `Successfully sent ${emailsSent.length} emails${emailsFailed.length > 0 ? `, ${emailsFailed.length} failed` : ''}`
    });
  } catch (error: any) {
    console.error('Error sending order confirmation emails:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send order confirmation emails'
      },
      { status: 500 }
    );
  }
}
