import { NextResponse } from "next/server";
import { createPreRegistration } from "@/vendor-services/preRegistrationService";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
	try {
		const data = await request.json();
		const { fullName, email, phone, businessName, category, brand_logo } = data;

		// Validation
		if (!fullName || !email || !phone) {
			return NextResponse.json(
				{ error: "Full name, email, and phone are required" },
				{ status: 400 }
			);
		}

		// Note: Email duplicate checking removed due to Firestore security rules
		// Duplicates will be handled by admin during approval process

		// Save pre-registration to Firestore
		const preRegId = await createPreRegistration({
			fullName,
			email,
			phone,
			businessName: businessName || "",
			category: category || "",
			brand_logo: brand_logo || "https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
		});

		// ======================================================================
		// Send Email Notification to Onboarding Team (europe-west1 region)
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

			const functionUrl = `https://europe-west1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/sendPreRegistrationNotificationEmail`;

			await fetch(functionUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					data: {
						to: [
							"mntishorkara@stitchesafrica.com",
							"stitchesafrica1m@gmail.com",
							"stitchesafrica2m@gmail.com",
							"stitchesafrica3m@gmail.com",
							"stitchesafrica4m@gmail.com",
							"stitchesafrica5m@gmail.com",
							"stitchesafrica7m@gmail.com",
							"stitchesafrica8m@gmail.com",
							"support@stitchesafrica.com",
						],
						preRegId,
						fullName,
						email,
						phone,
						businessName: businessName || "Not provided",
						category: category || "Not provided",
						brand_logo:
							brand_logo ||
							"https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
						submittedAt: new Date().toISOString(),
						logoUrl:
							"https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
						accessToken: idToken, // Pass Firebase ID token for email API
					},
				}),
			});

			console.log(
				"✅ Pre-registration notification email sent successfully (europe-west1)"
			);
		} catch (emailError) {
			console.error("❌ Failed to send notification email:", emailError);
			// Don't fail the entire request if email fails
			// Admin can still see the application in the dashboard
		}
		// ======================================================================
		// END Email Notification
		// ======================================================================

		return NextResponse.json({
			success: true,
			id: preRegId,
			message: "Pre-registration submitted successfully",
		});
	} catch (error: any) {
		console.error("Pre-registration API error:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to submit pre-registration" },
			{ status: 500 }
		);
	}
}

