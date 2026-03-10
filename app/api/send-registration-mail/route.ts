// app/api/send-registration-mail/route.ts
import { registrationTemplate } from "@/lib/emailTemplates/registrationTemplate";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, brandName, email, type, logoUrl } = body;

    // ✅ Token must be passed from client headers
    const token = req.headers.get("authorization");
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 401 });
    }

    const html = registrationTemplate({
      brandName,
      email,
      logoUrl,
      type,
    });

    const response = await fetch(
      "https://stitchesafricamobile-backend.onrender.com/api/Email/Send",
      {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          to,
          subject: `Welcome to Stitches Africa, ${brandName}!`,
          body: html,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
