/**
 * API Route: Send Guest Credentials Email
 * Sends welcome email with auto-generated login credentials to guest users
 */

import { NextRequest, NextResponse } from 'next/server';
import { guestCredentialsTemplate } from '@/lib/emailTemplates/guestCredentialsTemplate';

interface GuestCredentialsEmailRequest {
  email: string;
  customerName: string;
  password: string;
  orderId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GuestCredentialsEmailRequest = await request.json();
    const { email, customerName, password, orderId } = body;

    // Validate required fields
    if (!email || !customerName || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[GuestCredentials] Preparing to send email to:', email);

    // Generate email HTML using template
    const emailHTML = guestCredentialsTemplate({
      customerName,
      email,
      password,
      orderId,
    });

    // Send via Stitches Africa staging email API (same as other emails)
    const response = await fetch("https://stitchesafricamobile-backend.onrender.com/api/Email/Send", {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: emailHTML,
        subject: 'Your Stitches Africa Account - Login Credentials',
        emails: [{
          emailAddress: email,
          name: customerName,
        }],
        from: "support@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      }),
    });

    const raw = await response.text();
    console.log('📩 Guest Credentials Email API Response:', raw);

    if (!response.ok) {
      console.error('[GuestCredentials] Failed to send email:', raw);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send guest credentials email', 
          details: raw 
        },
        { status: response.status }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { message: raw };
    }

    console.log(`[GuestCredentials] Email sent successfully to: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Guest credentials email sent successfully',
      data: parsed
    });
  } catch (error: any) {
    console.error('[GuestCredentials] Error sending email:', error);

    return NextResponse.json(
      {
        error: 'Failed to send guest credentials email',
        details: error.message
      },
      { status: 500 }
    );
  }
}