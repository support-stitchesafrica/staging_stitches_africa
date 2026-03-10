import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");

		// TODO: Add authentication check here
		// Verify that the requesting user is an admin/onboarding team member

		// Use Admin SDK to fetch pre-registrations (bypasses security rules)
		let query = adminDb
			.collection("staging_vendor_pre_registrations")
			.orderBy("createdAt", "desc");

		if (status === "pending") {
			query = query.where("status", "==", "pending") as any;
		}

		const snapshot = await query.get();

		const preRegistrations = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		return NextResponse.json(preRegistrations);
	} catch (error: any) {
		console.error("Error fetching pre-registrations:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to fetch pre-registrations" },
			{ status: 500 }
		);
	}
}

