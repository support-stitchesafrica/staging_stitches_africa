/**
 * Email Sending API Route
 * Simple email service for waitlist notifications
 * Integrates with Zoho ZeptoMail
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/email/send - Send email
 */
export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text } = await request.json();

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: to, subject, html'
        },
        { status: 400 }
      );
    }

    // Send email via Zoho ZeptoMail
    const response = await fetch(
      "https://api.zeptomail.com/v1.1/email",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Zoho-enczapikey ${process.env.ZEPTO_API_KEY}`,
        },
        body: JSON.stringify({
          from: { 
            address: "noreply@stitchesafrica.com",
            name: "Stitches Africa"
          },
          to: [{ 
            email_address: { 
              address: to 
            } 
          }],
          subject,
          htmlbody: html,
          textbody: text || subject
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('ZeptoMail API error:', data);
      throw new Error(`ZeptoMail API error: ${response.status} - ${data.message || 'Unknown error'}`);
    }

    console.log('✅ Email sent successfully via ZeptoMail:', {
      to,
      subject
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data
    });
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send email'
      },
      { status: 500 }
    );
  }
}