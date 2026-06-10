/**
 * Update Referral Code API Route
 * Allows users to update their referral code to a custom one
 * Requirements: User customization, code uniqueness validation
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

interface UpdateCodeRequest {
	idToken: string;
	newCode: string;
}

/**
 * Update referral code
 * POST /api/referral/update-code
 */
export async function POST(request: NextRequest) {
	try {
		const body: UpdateCodeRequest = await request.json();
		const { idToken, newCode } = body;

		// Validate input
		if (!idToken || !newCode) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "INVALID_INPUT",
						message: "ID token and new code are required",
					},
				},
				{ status: 400 }
			);
		}

		// Validate new code format
		const codeRegex = /^[A-Z0-9]{3,12}$/;
		if (!codeRegex.test(newCode)) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "INVALID_CODE_FORMAT",
						message: "Code must be 3-12 characters, uppercase letters and numbers only",
					},
				},
				{ status: 400 }
			);
		}

		// Reserved codes that cannot be used
		const reservedCodes = [
			"ADMIN", "TEST", "DEMO", "NULL", "VOID", "TEMP", 
			"SYSTEM", "DEFAULT", "SAMPLE", "EXAMPLE", "PROMO"
		];
		
		if (reservedCodes.includes(newCode)) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "RESERVED_CODE",
						message: "This code is reserved and cannot be used",
					},
				},
				{ status: 400 }
			);
		}

		// Verify Firebase ID token
		let decodedToken;
		try {
			decodedToken = await adminAuth.verifyIdToken(idToken);
		} catch (error) {
			console.error("Token verification failed:", error);
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "UNAUTHORIZED",
						message: "Invalid authentication token",
					},
				},
				{ status: 401 }
			);
		}

		const userId = decodedToken.uid;

		// Check if user exists in referralUsers collection
		const userRef = adminDb.collection("referralUsers").doc(userId);
		const userDoc = await userRef.get();

		if (!userDoc.exists) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "USER_NOT_FOUND",
						message: "Referral user not found",
					},
				},
				{ status: 404 }
			);
		}

		const userData = userDoc.data();
		const currentCode = userData?.referralCode;

		// Check if the new code is the same as current
		if (currentCode === newCode) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "SAME_CODE",
						message: "New code is the same as current code",
					},
				},
				{ status: 400 }
			);
		}

		// Check if the new code is already taken by another user
		const existingCodeQuery = await adminDb
			.collection("referralUsers")
			.where("referralCode", "==", newCode)
			.limit(1)
			.get();

		if (!existingCodeQuery.empty) {
			const existingUser = existingCodeQuery.docs[0];
			// Make sure it's not the same user (edge case)
			if (existingUser.id !== userId) {
				return NextResponse.json(
					{
						success: false,
						error: {
							code: "CODE_ALREADY_EXISTS",
							message: "This referral code is already taken",
						},
					},
					{ status: 409 }
				);
			}
		}

		// Update the user's referral code
		await userRef.update({
			referralCode: newCode,
			updatedAt: FieldValue.serverTimestamp(),
		});

		// Update any existing referrals that use the old code
		const referralsQuery = await adminDb
			.collection("referrals")
			.where("referralCode", "==", currentCode)
			.get();

		const batch = adminDb.batch();
		referralsQuery.docs.forEach((doc) => {
			batch.update(doc.ref, {
				referralCode: newCode,
				updatedAt: FieldValue.serverTimestamp(),
			});
		});

		// Update any existing transactions that reference the old code
		const transactionsQuery = await adminDb
			.collection("referralTransactions")
			.where("referrerId", "==", userId)
			.get();

		transactionsQuery.docs.forEach((doc) => {
			const data = doc.data();
			if (data.metadata && data.metadata.referralCode === currentCode) {
				batch.update(doc.ref, {
					"metadata.referralCode": newCode,
					updatedAt: FieldValue.serverTimestamp(),
				});
			}
		});

		// Update any existing events that reference the old code
		const eventsQuery = await adminDb
			.collection("referralEvents")
			.where("referralCode", "==", currentCode)
			.get();

		eventsQuery.docs.forEach((doc) => {
			batch.update(doc.ref, {
				referralCode: newCode,
				updatedAt: FieldValue.serverTimestamp(),
			});
		});

		// Update users collection referralCode (used by my-purchases and checkout)
		const usersRef = adminDb.collection("users").doc(userId);
		const usersDoc = await usersRef.get();
		if (usersDoc.exists) {
			batch.update(usersRef, {
				referralCode: newCode,
				updatedAt: FieldValue.serverTimestamp(),
			});
		}

		// Update referralDiscounts collection if a discount doc exists for this user
		const discountRef = adminDb.collection("referralDiscounts").doc(userId);
		const discountDoc = await discountRef.get();
		if (discountDoc.exists) {
			batch.update(discountRef, {
				referralCode: newCode,
				updatedAt: FieldValue.serverTimestamp(),
			});
		}

		// Commit all updates
		await batch.commit();

		console.log(`Referral code updated for user ${userId}: ${currentCode} -> ${newCode}`);

		return NextResponse.json({
			success: true,
			data: {
				oldCode: currentCode,
				newCode: newCode,
				message: "Referral code updated successfully",
			},
		});

	} catch (error) {
		console.error("Update referral code error:", error);
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message: "An unexpected error occurred",
				},
			},
			{ status: 500 }
		);
	}
}