import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userInfo, timestamp } = await request.json();

    // Extract user info
    const userName = userInfo.name || 'Unknown User';
    const userEmail = userInfo.email || 'no-email@provided.com';
    const userPhone = userInfo.phone || 'N/A';
    const userLocation = userInfo.location || 'N/A';
    const initialMessage = userInfo.message || '';

    // Construct email HTML (matching Flutter template)
    const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/stitches-africa-limited.appspot.com/o/branding%2Fstitches_africa_logo.png?alt=media';
    
    const emailContent = `
      <h2>🎯 New Live Chat Request</h2>

      <p>A customer has requested to chat with a human agent.</p>

      <h3>Customer Details:</h3>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${userName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${userEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${userPhone}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Location</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${userLocation}</td>
        </tr>
      </table>

      ${initialMessage ? `
      <h3>Initial Message:</h3>
      <p style="background: #f5f5f5; padding: 12px; border-radius: 8px; font-style: italic;">
        "${initialMessage}"
      </p>
      ` : ''}

      <p style="margin-top: 20px;">
        <strong>Session ID:</strong> ${sessionId}
      </p>

      <p style="margin-top: 10px; color: #666;">
        <em>Submitted from Stitches Africa Web/Mobile</em>
      </p>
    `;

    // Wrapper HTML for consistent styling
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>New Live Chat Request</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            img { max-width: 150px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <img src="${logoUrl}" alt="Stitches Africa Logo" />
            ${emailContent}
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
               <a href="https://staging-stitches-africa.vercel.app/atlas/agent-chat" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold;">Open in Atlas Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `;

    // Recipient list
    const recipients = [
      'support@stitchesafrica.com',
      'stitchesafrica1m@gmail.com',
      'stitchesafrica2m@gmail.com',
      'stitchesafrica3m@gmail.com',
      'stitchesafrica4m@gmail.com',
      'stitchesafrica5m@gmail.com',
      'stitchesafrica6m@gmail.com',
      'stitchesafrica7m@gmail.com',
      'stitchesafrica8m@gmail.com',
    ];

    // Send via External API
    try {
      const response = await fetch("https://stitchesafricamobile-backend.onrender.com/api/Email/Send", {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: fullHtml,
          subject: `🎯 New Live Chat Request - ${userName}`,
          emails: recipients.map(email => ({
            emailAddress: email,
            name: email.split("@")[0], // Simple name extraction
          })),
          from: "newsletter@stitchesafrica.com", 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to send email:', errorText);
        // We log but don't fail the request since this is a notification
      } else {
        console.log('Support notification email sent successfully');
      }

    } catch (emailError) {
      console.error('Network error sending email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Support team notified successfully'
    });

  } catch (error) {
    console.error('Error in notify-support endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to notify support team' 
      },
      { status: 500 }
    );
  }
}