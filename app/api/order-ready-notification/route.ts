import { orderReadyTemplate } from "@/lib/emailTemplates/orderReadyTemplate";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { customerName, orderId, item, quantity, price, pickupDate, token } = await req.json();

    if (!customerName || !orderId || !item || !quantity || !price || !pickupDate || !token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const htmlBody = orderReadyTemplate({
      customerName,
      orderId,
      item,
      quantity,
      price,
      pickupDate,
      logoUrl: "https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
    });

    const response = await fetch("https://stitchesafricamobile-backend.onrender.com/api/Email/Send", {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        body: htmlBody,
        subject: `Order #${orderId} Ready for Pickup`,
        emails: [
          {
            emailAddress: "support@stitchesafrica.com", // ✅ Send to orders team
            name: "Orders Team",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Email API error:", errText);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
