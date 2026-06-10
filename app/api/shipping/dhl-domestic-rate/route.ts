import { NextRequest, NextResponse } from "next/server";

const DHL_BACKEND_URL =
  "https://stitchesafricamobile-backend.onrender.com/api/delivery/Dhl/Rate/Domestic";

function buildShippingDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T10:00:00 GMT+01:00`;
}

// DHL Nigeria only accepts specific postal codes in their service network
// Use 100001 (Lagos Island) as the canonical fallback for rate calculation
function safePostalCode(_code: string | undefined): string {
  return "100001";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { receiverDetails, packages, accessToken } = body;

    if (!receiverDetails || !Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: receiverDetails, packages" },
        { status: 400 }
      );
    }

    const totalWeight = packages.reduce(
      (sum: number, pkg: any) => sum + Math.max(0.1, pkg.weight || 1),
      0
    );
    const safeWeight = Number(Math.max(0.1, totalWeight).toFixed(2));

    const payload = {
      plannedShippingDateAndTime: buildShippingDate(),
      description: "Fashion items shipment",
      packagingId: "YP",
      customerDetails: {
        shipperDetails: {
          addressLine1: "10 Olubunmi Owa Street",
          addressLine2: "Lekki Phase 1",
          addressLine3: "Lekki",
          cityName: "Lagos",
          countyName: "Lagos",
          postalCode: "100001",
          countryCode: "NG",
        },
        receiverDetails: {
          addressLine1: receiverDetails.addressLine1 || "Lagos",
          addressLine2: receiverDetails.addressLine2 || receiverDetails.cityName || "Lagos",
          addressLine3: "N/A",
          postalCode: safePostalCode(receiverDetails.postalCode),
          cityName: receiverDetails.cityName || "Lagos",
          countyName: receiverDetails.countyName || receiverDetails.cityName || "Lagos",
          countryCode: "NG",
        },
      },
      packages: packages.map((pkg: any) => ({
        weight: Number(Math.max(0.1, pkg.weight || 1).toFixed(2)),
        dimensions: {
          length: Math.max(1, Math.round(pkg.dimensions?.length || 10)),
          width: Math.max(1, Math.round(pkg.dimensions?.width || 10)),
          height: Math.max(1, Math.round(pkg.dimensions?.height || 5)),
        },
      })),
      items: [
        {
          description: "Fashion items",
          quantity: 1,
          weight: safeWeight,
        },
      ],
    };

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    console.log("[DHL Proxy] Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(DHL_BACKEND_URL, { method: "POST", headers, body: JSON.stringify(payload) });

    const text = await response.text();
    console.log("[DHL Proxy] Status:", response.status, "| Body:", text.slice(0, 800));

    let json: any;
    try { json = JSON.parse(text); } catch {
      return NextResponse.json({ error: `Non-JSON (${response.status}): ${text.slice(0, 300)}` }, { status: 502 });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: json?.detail || json?.message || JSON.stringify(json) },
        { status: response.status }
      );
    }

    return NextResponse.json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[DHL Proxy] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
