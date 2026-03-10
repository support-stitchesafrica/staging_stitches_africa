// app/api/send-subtailor-mail/route.ts
import { subTailorCreatedTemplate } from "@/lib/emailTemplates/subTailorCreatedTemplate";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, parentBrand, subFirstName, subLastName, subEmail, role, logoUrl } =
      body;

    // ✅ Token must come from client (localStorage → header)
    const token = req.headers.get("authorization");
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 401 });
    }

    const html = subTailorCreatedTemplate({
      subFirstName,
      subLastName,
      subEmail,
      role,
      logoUrl,
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
          subject: `New Sub-Tailor Added — ${subFirstName} ${subLastName}`,
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
