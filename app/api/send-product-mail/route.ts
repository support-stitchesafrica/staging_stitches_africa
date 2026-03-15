// app/api/send-product-mail/route.ts
import { productCreatedTemplate } from "@/lib/emailTemplates/productCreatedTemplate";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      to,
      productName,
      productImage,
      price,
      category,
      creatorName,
      creatorRole,
    } = body;

    // 🔑 Read token from request header
    const token = req.headers.get("authorization");
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 401 });
    }

    const html = productCreatedTemplate({
      vendorName: creatorName,
      vendorEmail: to,
      productName,
      category,
      price: Number(price),
      productImage,
      logoUrl: "https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png", // update with your real logo
    });

    // Forward email request to Stitches Africa Email API
    const response = await fetch(
      "https://stitchesafricamobile-backend.onrender.com/api/Email/Send",
      {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
          Authorization: token, // ✅ forward token here
        },
        body: JSON.stringify({
          to,
          subject: `New Product Created — ${productName}`,
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
