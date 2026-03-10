/**
 * Script to update vendor product prices based on a provided price sheet.
 * Vendor ID: VYFc7odcixWaOeqckExMRUPvNxQ2
 *
 * Usage: npx ts-node -r dotenv/config scripts/update-vendor-prices.ts dotenv_config_path=.env.local
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// Initialize Firebase Admin using base64-encoded service account key
if (getApps().length === 0) {
	const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

	if (!base64Key) {
		console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 not found in .env.local");
		process.exit(1);
	}

	try {
		const serviceAccountJson = Buffer.from(base64Key, "base64").toString("utf8");
		const serviceAccount = JSON.parse(serviceAccountJson);

		initializeApp({
			credential: cert(serviceAccount),
		});
		console.log("✅ Firebase Admin initialized successfully.\n");
	} catch (error: any) {
		console.error("❌ Failed to parse service account key:", error.message);
		process.exit(1);
	}
}

const db = getFirestore();

// Target vendor ID
const VENDOR_ID = "VYFc7odcixWaOeqckExMRUPvNxQ2";

// Price data from the document
// Format: { productName: newPriceUSD }
// Using the "Adjusted Prices" (USD) column where available, otherwise "Old prices" (USD)
const PRICE_DATA: { [key: string]: number } = {
	// Products with Adjusted Prices (USD)
	"baskirt": 124.8,
	"linen with aso oke pocket": 228,
	"hand painted jalabia": 240,
	"map of africa jalabia": 240,
	"white t shirt x fringe pant": 370,
	"patch aso oke jacket and jort": 337,
	"5 pocket with akwete": 500,
	"sleeveless aso oke jacket and baskirt": 436,
	"unpainted relaxed t-shirt x wide leg pant": 410,
	"bardot top x baskirt": 632,
	"t shirt": 120,
	"kimono shawl": 146,
	"aso oke skirt": 189,
	"line art jalabia": 240,
	"sleeveless cowries jackets x splatted pants": 442,
	"white t shirt x wide leg fringe aso oke pant": 354,
	"wide leg in mixed leg pant": 228,
	"eco fringe aso oke biker pant x pant": 632,
	// Products without "Adjusted Prices" column - using "Old prices" (USD)
	"hand - painted barrel aso oke pant": 240,
	"hand painted barrel aso oke pant": 240,
	"splatted cargo pants": 240,
	"wide fringe pants": 296,
	"5 pocket dungress": 500,
	"aso oke cap": 30,
};

// Normalize product name for matching
function normalizeProductName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, "") // Remove special characters
		.replace(/\s+/g, " ") // Normalize whitespace
		.trim();
}

// Calculate similarity score between two strings (Levenshtein distance based)
function calculateSimilarity(str1: string, str2: string): number {
	const s1 = normalizeProductName(str1);
	const s2 = normalizeProductName(str2);

	// Quick check for exact match
	if (s1 === s2) return 1;

	// Check if one contains the other
	if (s1.includes(s2) || s2.includes(s1)) {
		return 0.9;
	}

	// Calculate Levenshtein distance
	const len1 = s1.length;
	const len2 = s2.length;
	const matrix: number[][] = [];

	for (let i = 0; i <= len1; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= len2; j++) {
		matrix[0][j] = j;
	}

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
	const maxLen = Math.max(len1, len2);
	return 1 - distance / maxLen;
}

// Find best matching price entry for a product title
function findBestMatch(
	productTitle: string
): { name: string; price: number; score: number } | null {
	let bestMatch: { name: string; price: number; score: number } | null = null;

	for (const [priceName, price] of Object.entries(PRICE_DATA)) {
		const score = calculateSimilarity(productTitle, priceName);

		// Threshold for matching (0.7 = 70% similar)
		if (score >= 0.7 && (!bestMatch || score > bestMatch.score)) {
			bestMatch = { name: priceName, price, score };
		}
	}

	return bestMatch;
}

async function updateVendorPrices() {
	console.log("🚀 Starting vendor price update...");
	console.log(`📦 Target Vendor ID: ${VENDOR_ID}\n`);

	try {
		// Query all products for this vendor
		const productsRef = db.collection("tailor_works");
		const query = productsRef.where("tailor_id", "==", VENDOR_ID);
		const snapshot = await query.get();

		if (snapshot.empty) {
			console.log("❌ No products found for this vendor.");
			return;
		}

		console.log(`✅ Found ${snapshot.size} products for this vendor.\n`);

		const updates: {
			id: string;
			title: string;
			oldPrice: number;
			newPrice: number;
			matchedName: string;
			score: number;
		}[] = [];
		const noMatch: { id: string; title: string }[] = [];

		// Process each product
		for (const doc of snapshot.docs) {
			const product = doc.data();
			const productId = doc.id;
			const productTitle = product.title || "";
			const currentPrice = product.price?.base || 0;

			const match = findBestMatch(productTitle);

			if (match) {
				updates.push({
					id: productId,
					title: productTitle,
					oldPrice: currentPrice,
					newPrice: match.price,
					matchedName: match.name,
					score: match.score,
				});
			} else {
				noMatch.push({ id: productId, title: productTitle });
			}
		}

		// Display matches
		console.log("=== MATCHED PRODUCTS ===\n");
		for (const update of updates) {
			console.log(`📝 "${update.title}"`);
			console.log(`   Matched to: "${update.matchedName}" (${(update.score * 100).toFixed(1)}% match)`);
			console.log(`   Price: $${update.oldPrice} → $${update.newPrice}`);
			console.log("");
		}

		// Display non-matches
		if (noMatch.length > 0) {
			console.log("=== NO MATCH FOUND ===\n");
			for (const item of noMatch) {
				console.log(`⚠️  "${item.title}" (ID: ${item.id})`);
			}
			console.log("");
		}

		// Confirm before updating
		console.log("=== SUMMARY ===");
		console.log(`✅ Products to update: ${updates.length}`);
		console.log(`⚠️  Products without match: ${noMatch.length}`);
		console.log("");

		// Perform updates
		console.log("🔄 Performing updates...\n");

		let successCount = 0;
		let errorCount = 0;

		for (const update of updates) {
			try {
				await db.collection("tailor_works").doc(update.id).update({
					price: {
						base: update.newPrice,
						currency: "USD",
					},
					updated_at: new Date(),
				});
				console.log(`✅ Updated: "${update.title}" to $${update.newPrice}`);
				successCount++;
			} catch (error: any) {
				console.error(`❌ Failed to update "${update.title}":`, error.message);
				errorCount++;
			}
		}

		console.log("\n=== COMPLETE ===");
		console.log(`✅ Successfully updated: ${successCount}`);
		console.log(`❌ Errors: ${errorCount}`);
		console.log(`⚠️  Skipped (no match): ${noMatch.length}`);
	} catch (error: any) {
		console.error("❌ Error:", error.message);
		process.exit(1);
	}
}

// Run the script
updateVendorPrices()
	.then(() => {
		console.log("\n🎉 Script completed.");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
