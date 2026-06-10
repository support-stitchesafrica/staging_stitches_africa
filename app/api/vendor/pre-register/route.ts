import { NextResponse, after } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

/** Limits how long outbound email notification calls can stall the response. */
const NOTIFY_FETCH_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(
	url: string,
	init: RequestInit,
	timeoutMs: number
): Promise<Response> {
	return fetch(url, {
		...init,
		signal: AbortSignal.timeout(timeoutMs),
	});
}

export const maxDuration = 30;

export async function POST(request: Request) {
	try {
		const data = await request.json();
		const { fullName, email, phone, businessName, category, brand_logo } =
			data;

		if (!fullName || !email || !phone) {
			return NextResponse.json(
				{ error: "Full name, email, and phone are required" },
				{ status: 400 }
			);
		}

		const logoUrl =
			typeof brand_logo === "string" && brand_logo.length > 0
				? brand_logo
				: "https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png";

		const docRef = await adminDb.collection("vendor_pre_registrations").add({
			fullName,
			email,
			phone,
			businessName: businessName || "",
			category: category || "",
			brand_logo: logoUrl,
			status: "pending",
			createdAt: Timestamp.now(),
		});

		const preRegId = docRef.id;

		after(() =>
			sendPreRegistrationEmailNotification({
				preRegId,
				fullName,
				email,
				phone,
				businessName: businessName || "",
				category: category || "",
				brand_logo: logoUrl,
			}).catch((err) =>
				console.error("❌ Pre-registration notification (after):", err)
			)
		);

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

async function sendPreRegistrationEmailNotification(payload: {
	preRegId: string;
	fullName: string;
	email: string;
	phone: string;
	businessName: string;
	category: string;
	brand_logo: string;
}): Promise<void> {
	try {
		const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
		const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

		if (!apiKey || !projectId) {
			console.warn(
				"⚠️ Skipping pre-registration email: missing NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID"
			);
			return;
		}

		const customToken = await adminAuth.createCustomToken(
			"system-email-service"
		);

		const idTokenResponse = await fetchWithTimeout(
			`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token: customToken,
					returnSecureToken: true,
				}),
			},
			NOTIFY_FETCH_TIMEOUT_MS
		);

		const tokenBody = await idTokenResponse.json();
		if (!idTokenResponse.ok || !tokenBody.idToken) {
			console.error(
				"❌ signInWithCustomToken failed:",
				tokenBody?.error?.message || idTokenResponse.status
			);
			return;
		}

		const functionUrl = `https://europe-west1-${projectId}.cloudfunctions.net/sendPreRegistrationNotificationEmail`;

		const res = await fetchWithTimeout(
			functionUrl,
			{
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
							"stitchesafrica9m@gmail.com",
							"support@stitchesafrica.com",
						],
						preRegId: payload.preRegId,
						fullName: payload.fullName,
						email: payload.email,
						phone: payload.phone,
						businessName: payload.businessName || "Not provided",
						category: payload.category || "Not provided",
						brand_logo: payload.brand_logo,
						submittedAt: new Date().toISOString(),
						logoUrl:
							"https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png",
						accessToken: tokenBody.idToken,
					},
				}),
			},
			NOTIFY_FETCH_TIMEOUT_MS
		);

		if (!res.ok) {
			const text = await res.text().catch(() => "");
			console.error(
				"❌ sendPreRegistrationNotificationEmail HTTP",
				res.status,
				text.slice(0, 500)
			);
			return;
		}

		console.log(
			"✅ Pre-registration notification email request completed (europe-west1)"
		);
	} catch (emailError: any) {
		const name = emailError?.name;
		if (name === "TimeoutError" || name === "AbortError") {
			console.error(
				"❌ Pre-registration email notification timed out or was aborted"
			);
			return;
		}
		console.error("❌ Failed to send notification email:", emailError);
	}
}
