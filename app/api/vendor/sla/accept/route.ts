import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
	try {
		const { userId } = await request.json();

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Update the tailors collection
		const tailorRef = adminDb.collection("staging_tailors").doc(userId);
		const tailorDoc = await tailorRef.get();

		if (!tailorDoc.exists) {
			return NextResponse.json(
				{ error: "Vendor not found" },
				{ status: 404 }
			);
		}

		// Update with SLA acceptance
		await tailorRef.update({
			isSLA: true,
			slaAcceptedAt: new Date().toISOString(),
			slaVersion: "1.0", // Track version for future updates
		});

		// Also update tailors_local if it exists
		try {
			const localTailorRef = adminDb.collection("staging_tailors_local").doc(userId);
			const localDoc = await localTailorRef.get();
			
			if (localDoc.exists) {
				await localTailorRef.update({
					isSLA: true,
					slaAcceptedAt: new Date().toISOString(),
					slaVersion: "1.0",
				});
			}
		} catch (localError) {
			console.error("Error updating tailors_local:", localError);
			// Don't fail the request if local update fails
		}

		return NextResponse.json({
			success: true,
			message: "SLA accepted successfully",
		});
	} catch (error) {
		console.error("Error accepting SLA:", error);
		return NextResponse.json(
			{ error: "Failed to accept SLA" },
			{ status: 500 }
		);
	}
}
