/**
 * Script to update vendor product prices to NGN.
 * Uses the "# Adjusted Prices" column (NGN values).
 * 
 * Usage: npx ts-node scripts/update-vendor-prices-ngn.ts
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

// Target vendor ID
const VENDOR_ID = "VYFc7odcixWaOeqckExMRUPvNxQ2";

// Price data - NGN Adjusted Prices (from "# Adjusted Prices" column)
const PRICE_DATA_NGN: { [key: string]: number } = {
	"hand - painted barrel aso oke pant": 360000,
	"hand painted barrel aso oke pant": 360000,
	"splatted cargo pants": 360000,
	"wide fringe pants": 420000,
	"5 pocket dungress": 720000,
	"baskirt": 180000,
	"linen with aso oke pocket": 324000,
	"hand painted jalabia": 360000,
	"map of africa jalabia": 360000,
	"aso oke cap": 44400,
	"white t shirt x fringe pant": 600000,
	"patch aso oke jacket and jort": 480600,
	"5 pocket with akwete": 720000,
	"sleeveless aso oke jacket and baskirt": 630000,
	"unpainted relaxed t-shirt x wide leg pant": 584400,
	"bardot top x baskirt": 900000,
	"t shirt": 180000,
	"kimono shawl": 208800,
	"aso oke skirt": 270000,
	"line art jalabia": 360000,
	"sleeveless cowries jackets x splatted pants": 630000,
	"white t shirt x wide leg fringe aso oke pant": 504000,
	"wide leg in mixed leg pant": 324000,
	"eco fringe aso oke biker pant x pant": 900000,
};

// Normalize product name
function normalizeProductName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

// Calculate similarity
function calculateSimilarity(str1: string, str2: string): number {
	const s1 = normalizeProductName(str1);
	const s2 = normalizeProductName(str2);

	if (s1 === s2) return 1;
	if (s1.includes(s2) || s2.includes(s1)) return 0.9;

	const len1 = s1.length;
	const len2 = s2.length;
	const matrix: number[][] = [];

	for (let i = 0; i <= len1; i++) matrix[i] = [i];
	for (let j = 0; j <= len2; j++) matrix[0][j] = j;

	for (let i = 1; i <= len1; i++) {
		for (let j = 1; j <= len2; j++) {
			const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1,
				matrix[i][j - 1] + 1,
				matrix[i - 1][j - 1] + cost
			);
		}
	}

	const distance = matrix[len1][len2];
	return 1 - distance / Math.max(len1, len2);
}

// Find best match
function findBestMatch(productTitle: string): { name: string; price: number; score: number } | null {
	let bestMatch: { name: string; price: number; score: number } | null = null;

	for (const [priceName, price] of Object.entries(PRICE_DATA_NGN)) {
		const score = calculateSimilarity(productTitle, priceName);
		if (score >= 0.7 && (!bestMatch || score > bestMatch.score)) {
			bestMatch = { name: priceName, price, score };
		}
	}

	return bestMatch;
}

async function updateToNGN() {
	console.log("🚀 Updating vendor products to NGN prices...");
	console.log(`📦 Vendor ID: ${VENDOR_ID}\n`);

	const productsRef = db.collection("tailor_works");
	const snapshot = await productsRef.where("tailor_id", "==", VENDOR_ID).get();

	if (snapshot.empty) {
		console.log("❌ No products found.");
		return;
	}

	console.log(`✅ Found ${snapshot.size} products.\n`);

	const updates: { id: string; title: string; oldPrice: number; newPrice: number; matchedName: string }[] = [];
	const noMatch: { id: string; title: string }[] = [];

	for (const doc of snapshot.docs) {
		const product = doc.data();
		const productTitle = product.title || "";
		const currentPrice = product.price?.base || 0;

		const match = findBestMatch(productTitle);

		if (match) {
			updates.push({
				id: doc.id,
				title: productTitle,
				oldPrice: currentPrice,
				newPrice: match.price,
				matchedName: match.name,
			});
		} else {
			noMatch.push({ id: doc.id, title: productTitle });
		}
	}

	// Show what will be updated
	console.log("=== UPDATES ===\n");
	for (const u of updates) {
		console.log(`📝 "${u.title}"`);
		console.log(`   ₦${u.oldPrice.toLocaleString()} → ₦${u.newPrice.toLocaleString()}`);
	}

	if (noMatch.length > 0) {
		console.log("\n=== NO MATCH ===\n");
		for (const item of noMatch) {
			console.log(`⚠️  "${item.title}"`);
		}
	}

	console.log(`\n=== SUMMARY ===`);
	console.log(`✅ To update: ${updates.length}`);
	console.log(`⚠️  No match: ${noMatch.length}\n`);

	// Perform updates
	console.log("🔄 Updating...\n");

	let successCount = 0;

	for (const u of updates) {
		try {
			await db.collection("tailor_works").doc(u.id).update({
				price: { base: u.newPrice, currency: "NGN" },
				updated_at: new Date(),
			});
			console.log(`✅ "${u.title}" → ₦${u.newPrice.toLocaleString()}`);
			successCount++;
		} catch (error: any) {
			console.error(`❌ Failed: "${u.title}":`, error.message);
		}
	}

	console.log(`\n🎉 Updated ${successCount} products to NGN.`);
}

updateToNGN()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
