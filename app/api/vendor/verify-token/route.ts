import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const token = searchParams.get("token");

		if (!token) {
			return NextResponse.json(
				{ valid: false, error: "Token is required" },
				{ status: 400 }
			);
		}

		// Validate token against Firestore using Admin SDK
		const snapshot = await adminDb
			.collection("staging_vendor_pre_registrations")
			.where("approvalToken", "==", token)
			.where("status", "==", "approved")
			.limit(1)
			.get();

		if (snapshot.empty) {
			return NextResponse.json(
				{ valid: false, error: "Invalid or expired token" },
				{ status: 404 }
			);
		}

		const preReg = snapshot.docs[0].data();

		// Return pre-registration data to pre-fill signup form
		return NextResponse.json({
			valid: true,
			email: preReg.email,
			phone: preReg.phone,
			fullName: preReg.fullName,
			businessName: preReg.businessName,
			category: preReg.category,
			brand_logo: preReg.brand_logo,
		});
	} catch (error: any) {
		console.error("Token verification error:", error);
		return NextResponse.json(
			{ valid: false, error: "Verification failed" },
			{ status: 500 }
		);
	}
}

