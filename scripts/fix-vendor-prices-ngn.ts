/**
 * Fix script for the 6 products that were missed or incorrectly matched (NGN version).
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

if (getApps().length === 0) {
	const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
	if (!base64Key) { console.error("❌ Missing key"); process.exit(1); }
	const sa = JSON.parse(Buffer.from(base64Key, "base64").toString("utf8"));
	initializeApp({ credential: cert(sa) });
	console.log("✅ Firebase Admin initialized.\n");
}

const db = getFirestore();

// Products to fix by document ID (from previous script output)
const FIXES: { id: string; title: string; correctPrice: number }[] = [
	// Map of Africa jalabia → ₦360,000
	{ id: "kV1XvOXuSeDV5jDwmKRf", title: "Map of Africa Hand Painted Jalabiya", correctPrice: 360000 },
	// white T shirt x fringe pant → ₦600,000
	{ id: "nz7aYVnwdbx2xgn2gGAI", title: "White T-Shirt with Aso Oke Pockets x Wide Leg Fringe Pant", correctPrice: 600000 },
	// 5 pocket with akwete → ₦720,000
	{ id: "RwJbR8cuC6biCNnybslC", title: "5 pocket Dungarees with Akwete", correctPrice: 720000 },
	// wide leg in mixed leg pant → ₦324,000
	{ id: "NMeQ1zLWLwg4Zvdfcc2u", title: "Wide-leg trousers in mixed Aso Oke", correctPrice: 324000 },
];

// Products to fix by title (incorrectly matched to "baskirt" price)
const FIXES_BY_TITLE: { titleContains: string; correctPrice: number }[] = [
	// Sleeveless aso oke jacket and baskirt → ₦630,000 (not ₦180,000)
	{ titleContains: "Sleeveless asooke jacket Top and Baskirt", correctPrice: 630000 },
	// Bardot Top x Baskirt → ₦900,000 (not ₦180,000)
	{ titleContains: "Orange Bardot Top x Baskirt", correctPrice: 900000 },
];

async function fixPricesNGN() {
	console.log("🔧 Fixing 6 products with NGN prices...\n");

	let success = 0;

	// Fix by ID
	for (const fix of FIXES) {
		try {
			await db.collection("tailor_works").doc(fix.id).update({
				price: { base: fix.correctPrice, currency: "NGN" },
				updated_at: new Date(),
			});
			console.log(`✅ "${fix.title}" → ₦${fix.correctPrice.toLocaleString()}`);
			success++;
		} catch (e: any) {
			console.error(`❌ Failed "${fix.title}":`, e.message);
		}
	}

	// Fix by title
	const vendorId = "VYFc7odcixWaOeqckExMRUPvNxQ2";
	const snapshot = await db.collection("tailor_works").where("tailor_id", "==", vendorId).get();

	for (const fix of FIXES_BY_TITLE) {
		const doc = snapshot.docs.find((d) => (d.data().title || "").toLowerCase().includes(fix.titleContains.toLowerCase()));
		if (doc) {
			try {
				await doc.ref.update({
					price: { base: fix.correctPrice, currency: "NGN" },
					updated_at: new Date(),
				});
				console.log(`✅ "${doc.data().title}" → ₦${fix.correctPrice.toLocaleString()}`);
				success++;
			} catch (e: any) {
				console.error(`❌ Failed "${fix.titleContains}":`, e.message);
			}
		} else {
			console.warn(`⚠️  Not found: "${fix.titleContains}"`);
		}
	}

	console.log(`\n🎉 Fixed ${success} products.`);
}

fixPricesNGN().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
