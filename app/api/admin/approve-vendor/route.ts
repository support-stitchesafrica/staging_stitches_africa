import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(request: Request) {
	try {
		const { preRegId, notes } = await request.json();

		if (!preRegId) {
			return NextResponse.json(
				{ error: "Pre-registration ID is required" },
				{ status: 400 }
			);
		}

		// TODO: Add authentication check here
		// Verify that the requesting user is an admin/onboarding team member

		// Get pre-registration details using Admin SDK
		const preRegDoc = await adminDb
			.collection("staging_vendor_pre_registrations")
			.doc(preRegId)
			.get();

		if (!preRegDoc.exists) {
			return NextResponse.json(
				{ error: "Pre-registration not found" },
				{ status: 404 }
			);
		}

		const preReg = preRegDoc.data() as any;

		if (preReg.status !== "pending") {
			return NextResponse.json(
				{ error: "This application has already been processed" },
				{ status: 400 }
			);
		}

		// Generate token and approve using Admin SDK
		const approvalToken = uuidv4();

		await adminDb
			.collection("staging_vendor_pre_registrations")
			.doc(preRegId)
			.update({
				status: "approved",
				approvalToken,
				approvedAt: Timestamp.now(),
				approvedBy: "admin-user-id", // TODO: Replace with actual admin user ID
				...(notes && { notes }),
			});

		// Generate signup link
		const baseUrl =
			process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
		const signupLink = `${baseUrl}/vendor/signup?token=${approvalToken}`;

		// ======================================================================
		// Send Approval Email to Vendor (europe-west1 region)
		// ======================================================================
		try {
			// Generate custom token for system service account
			const customToken = await adminAuth.createCustomToken(
				"system-email-service"
			);

			// Exchange custom token for ID token (this simulates a client login)
			const idTokenResponse = await fetch(
				`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						token: customToken,
						returnSecureToken: true,
					}),
				}
			);

			const { idToken } = await idTokenResponse.json();

			const functionUrl = `https://europe-west1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/sendVendorApprovalEmail`;

			await fetch(functionUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					data: {
						to: preReg.email,
						fullName: preReg.fullName,
						businessName: preReg.businessName || "Your Business",
						signupLink: signupLink,
						brand_logo:
							preReg.brand_logo ||
							"https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
						logoUrl:
							"https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
						approvedAt: new Date().toISOString(),
						accessToken: idToken, // Pass Firebase ID token for email API
					},
				}),
			});

			console.log(
				`✅ Approval email sent successfully to ${preReg.email} (europe-west1)`
			);
		} catch (emailError) {
			console.error("❌ Failed to send approval email:", emailError);
			// Don't fail the entire request if email fails
			// Admin can manually send the link from the dashboard
		}
		// ======================================================================
		// END Approval Email
		// ======================================================================

		return NextResponse.json({
			success: true,
			token: approvalToken,
			signupLink: signupLink,
			message: "Vendor approved successfully",
		});
	} catch (error: any) {
		console.error("Vendor approval error:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to approve vendor" },
			{ status: 500 }
		);
	}
}

