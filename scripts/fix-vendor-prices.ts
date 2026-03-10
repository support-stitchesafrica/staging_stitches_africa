/**
 * Quick fix script to correct the 6 products that were missed or incorrectly priced.
 * 
 * Usage: npx ts-node scripts/fix-vendor-prices.ts
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// Initialize Firebase Admin
if (getApps().length === 0) {
	const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
	if (!base64Key) {
		console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 not found");
		process.exit(1);
	}
	const serviceAccount = JSON.parse(Buffer.from(base64Key, "base64").toString("utf8"));
	initializeApp({ credential: cert(serviceAccount) });
	console.log("✅ Firebase Admin initialized.\n");
}

const db = getFirestore();

// Products to fix - using document IDs from the script output
const FIXES: { id: string; title: string; correctPrice: number }[] = [
	// Missed products (no match found)
	{ id: "kV1XvOXuSeDV5jDwmKRf", title: "Map of Africa Hand Painted Jalabiya", correctPrice: 240 },
	{ id: "nz7aYVnwdbx2xgn2gGAI", title: "White T-Shirt with Aso Oke Pockets x Wide Leg Fringe Pant", correctPrice: 370 },
	{ id: "RwJbR8cuC6biCNnybslC", title: "5 pocket Dungarees with Akwete", correctPrice: 500 },
	{ id: "NMeQ1zLWLwg4Zvdfcc2u", title: "Wide-leg trousers in mixed Aso Oke", correctPrice: 228 },
	// Incorrectly matched products (got $124.8 instead of correct price)
	// Need to find their IDs - will query by title
];

// Products to fix by title (need to look up IDs)
const FIXES_BY_TITLE: { titleContains: string; correctPrice: number }[] = [
	{ titleContains: "Sleeveless asooke jacket Top and Baskirt", correctPrice: 436 },
	{ titleContains: "Orange Bardot Top x Baskirt", correctPrice: 632 },
];

async function fixPrices() {
	console.log("🔧 Fixing 6 products with incorrect/missing prices...\n");

	let successCount = 0;
	let errorCount = 0;

	// Fix by document ID
	for (const fix of FIXES) {
		try {
			await db.collection("tailor_works").doc(fix.id).update({
				price: { base: fix.correctPrice, currency: "USD" },
				updated_at: new Date(),
			});
			console.log(`✅ Fixed: "${fix.title}" → $${fix.correctPrice}`);
			successCount++;
		} catch (error: any) {
			console.error(`❌ Failed to fix "${fix.title}":`, error.message);
			errorCount++;
		}
	}

	// Fix by title lookup
	const vendorId = "VYFc7odcixWaOeqckExMRUPvNxQ2";
	const productsRef = db.collection("tailor_works");
	const snapshot = await productsRef.where("tailor_id", "==", vendorId).get();

	for (const fix of FIXES_BY_TITLE) {
		const matchingDoc = snapshot.docs.find((doc) => {
			const title = doc.data().title || "";
			return title.toLowerCase().includes(fix.titleContains.toLowerCase());
		});

		if (matchingDoc) {
			try {
				await matchingDoc.ref.update({
					price: { base: fix.correctPrice, currency: "USD" },
					updated_at: new Date(),
				});
				console.log(`✅ Fixed: "${matchingDoc.data().title}" → $${fix.correctPrice}`);
				successCount++;
			} catch (error: any) {
				console.error(`❌ Failed to fix "${fix.titleContains}":`, error.message);
				errorCount++;
			}
		} else {
			console.warn(`⚠️  Could not find product matching: "${fix.titleContains}"`);
		}
	}

	console.log("\n=== COMPLETE ===");
	console.log(`✅ Fixed: ${successCount}`);
	console.log(`❌ Errors: ${errorCount}`);
}

fixPrices()
	.then(() => {
		console.log("\n🎉 Fix script completed.");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
