import { NextRequest, NextResponse } from "next/server";

// Email configuration - in production, use environment variables
const EMAIL_API_URL = process.env.EMAIL_API_URL || "https://api.sendgrid.com/v3/mail/send";
const EMAIL_API_KEY = process.env.SENDGRID_API_KEY || process.env.EMAIL_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@stitchesafrica.com";

interface EmailPayload {
	to: string;
	subject: string;
	html: string;
	from: string;
}

async function sendEmailWithProvider(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
	try {
		// Check if we have an email service configured
		if (!EMAIL_API_KEY) {
			console.warn("⚠️ No email API key configured. Email would have been sent:");
			console.log("To:", payload.to);
			console.log("Subject:", payload.subject);
			console.log("From:", payload.from);
			// Return success in development to not block the flow
			return { success: true };
		}

		// For SendGrid
		const response = await fetch(EMAIL_API_URL, {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${EMAIL_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				personalizations: [{ to: [{ email: payload.to }] }],
				from: { email: payload.from },
				subject: payload.subject,
				content: [{ type: "text/html", value: payload.html }],
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Email API error: ${error}`);
		}

		return { success: true };
	} catch (error) {
		console.error("Error sending email:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { sessionId, productId, productName, userInfo, message } = body;

		if (!sessionId || !productId || !userInfo?.email) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Email content
		const emailSubject = `New Consultation Request - ${productName}`;
		const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Consultation Request</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        .header h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .header p {
            color: #666;
            margin: 0;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .info-grid {
            background-color: #f9fafb;
            border-radius: 6px;
            padding: 15px;
        }
        .info-row {
            display: flex;
            margin-bottom: 10px;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .info-label {
            font-weight: 500;
            color: #6b7280;
            width: 120px;
            flex-shrink: 0;
        }
        .info-value {
            color: #111827;
        }
        .message-box {
            background-color: #f3f4f6;
            border-left: 4px solid #2563eb;
            padding: 15px;
            border-radius: 0 6px 6px 0;
            margin-top: 10px;
        }
        .message-box p {
            margin: 0;
            color: #374151;
            font-style: italic;
        }
        .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            margin-top: 20px;
            font-weight: 500;
        }
        .cta-button:hover {
            background-color: #1d4ed8;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 New Consultation Request</h1>
            <p>A customer is requesting to speak with an agent</p>
        </div>

        <div class="section">
            <div class="section-title">📦 Product Information</div>
            <div class="info-grid">
                <div class="info-row">
                    <span class="info-label">Product Name:</span>
                    <span class="info-value">${productName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Product ID:</span>
                    <span class="info-value">${productId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Session ID:</span>
                    <span class="info-value">${sessionId}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">👤 Customer Information</div>
            <div class="info-grid">
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${userInfo.name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${userInfo.email}</span>
                </div>
                ${userInfo.phone ? `
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${userInfo.phone}</span>
                </div>
                ` : ""}
            </div>
        </div>

        <div class="section">
            <div class="section-title">💬 Customer Message</div>
            <div class="message-box">
                <p>${message || "No initial message provided"}</p>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/marketing/agent-chat" class="cta-button">
                View Chat in Dashboard
            </a>
        </div>

        <div class="footer">
            <p>This consultation request was submitted through the Stitches Africa product page.</p>
            <p>Please respond promptly to provide excellent customer service.</p>
        </div>
    </div>
</body>
</html>
		`;

		// Send email to support
		const result = await sendEmailWithProvider({
			to: "support@stitchesafrica.com",
			subject: emailSubject,
			html: emailHtml,
			from: FROM_EMAIL,
		});

		if (!result.success) {
			console.error("Failed to send email:", result.error);
			// Don't fail the request if email fails, just log it
		}

		return NextResponse.json({
			success: true,
			message: "Consultation request processed successfully",
		});
	} catch (error) {
		console.error("Error sending consultation email:", error);
		return NextResponse.json(
			{ error: "Failed to send consultation email" },
			{ status: 500 }
		);
	}
}
