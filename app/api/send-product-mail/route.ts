// app/api/send-product-mail/route.ts
import { productCreatedTemplate } from "@/lib/emailTemplates/productCreatedTemplate";
import { NextResponse } from "next/server";

function parsePrice(body: Record<string, unknown>): {
  amount: number;
  currency: string;
} {
  const p = body.price;
  if (p && typeof p === "object" && p !== null && "base" in p) {
    const o = p as { base?: unknown; currency?: unknown };
    return {
      amount: Number(o.base) || 0,
      currency:
        typeof o.currency === "string" && o.currency.trim()
          ? o.currency.trim()
          : "USD",
    };
  }
  const n = Number(p);
  const c =
    typeof body.currency === "string" && body.currency.trim()
      ? body.currency.trim()
      : "USD";
  return { amount: Number.isFinite(n) ? n : 0, currency: c };
}

function parseWearCategory(body: Record<string, unknown>): string {
  const w = body.wear_category;
  if (typeof w === "string") return w.trim();
  const s = body.subCategory;
  if (typeof s === "string") return s.trim();
  return "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const {
      to,
      productName,
      productImage,
      category,
      creatorName,
    } = body;

    const { amount: priceAmount, currency: priceCurrency } = parsePrice(body);
    const wear_category = parseWearCategory(body);

    // 🔑 Read token from request header
    const token = req.headers.get("authorization");
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 401 });
    }

    const html = productCreatedTemplate({
      vendorName: typeof creatorName === "string" ? creatorName : "Vendor",
      vendorEmail: typeof to === "string" ? to : "",
      productName: typeof productName === "string" ? productName : "",
      category: typeof category === "string" ? category : "",
      wear_category: wear_category || undefined,
      price: priceAmount,
      priceCurrency,
      productImage: typeof productImage === "string" ? productImage : "",
      logoUrl:
        "https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png",
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
