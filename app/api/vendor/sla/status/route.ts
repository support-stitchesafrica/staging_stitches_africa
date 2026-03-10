import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		
		console.log(`[SLA Status API] Received request for userId: ${userId}`);

		if (!userId) {
			console.log(`[SLA Status API] Missing userId parameter`);
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Get the tailor document
		const tailorRef = adminDb.collection("staging_tailors").doc(userId);
		const tailorDoc = await tailorRef.get();
		
		console.log(`[SLA Status API] Tailor document exists: ${tailorDoc.exists}`);

		if (!tailorDoc.exists) {
			console.log(`[SLA Status API] Vendor not found for userId: ${userId}`);
			return NextResponse.json(
				{ 
					hasSLA: false,
					slaAcceptedAt: null,
					slaVersion: null,
					brandName: null,
					businessAddress: null
				},
				{ status: 200 }
			);
		}

		const data = tailorDoc.data();
		console.log(`[SLA Status API] Vendor data keys:`, Object.keys(data || {}));

		return NextResponse.json({
			hasSLA: data?.isSLA === true,
			slaAcceptedAt: data?.slaAcceptedAt || null,
			slaVersion: data?.slaVersion || null,
			brandName: data?.brandName || null,
			businessAddress: data?.businessAddress || null,
		});
	} catch (error: any) {
		console.error("[SLA Status API] Error fetching SLA status:", error);
		
		// Handle quota exceeded error specifically
		if (error.code === 8 && error.details?.includes('Quota exceeded')) {
			console.log("[SLA Status API] Quota exceeded - returning default response");
			return NextResponse.json({
				hasSLA: false,
				slaAcceptedAt: null,
				slaVersion: null,
				brandName: null,
				businessAddress: null,
				quotaExceeded: true
			}, { status: 200 });
		}
		
		return NextResponse.json(
			{ error: "Failed to fetch SLA status" },
			{ status: 500 }
		);
	}
}
