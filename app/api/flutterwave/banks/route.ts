import { NextResponse } from "next/server";
import axios from "axios";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "NG"; // Default to Nigeria
    
    // Map country codes to Flutterwave country codes
    const countryMap: Record<string, string> = {
      "NG": "NG",
      "GH": "GH",
      "KE": "KE",
      "UG": "UG",
    };
    
    const flutterwaveCountry = countryMap[country.toUpperCase()] || "NG";
    
    const res = await axios.get(`https://api.flutterwave.com/v3/banks/${flutterwaveCountry}`, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    });

    const banks = res.data?.data || [];
    return NextResponse.json({ success: true, banks });
  } catch (error: any) {
    console.error("Error fetching banks:", error.message);
    return NextResponse.json(
      { success: false, message: "Failed to fetch banks" },
      { status: 500 }
    );
  }
}
