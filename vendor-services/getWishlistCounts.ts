import { db } from "@/firebase";
import { collection, getDocs, query, where, collectionGroup } from "firebase/firestore";

/**
 * Get wishlist count for a specific product
 */
export async function getProductWishlistCount(
	productId: string,
	tailorId: string
): Promise<number> {
	try {
		console.log("🔍 Getting wishlist count for:", { productId, tailorId });

		// Use collectionGroup to query ALL user_wishlist_items subcollections at once
		// First try with tailor_id
		const wishlistItemsQuery = query(
			collectionGroup(db, "user_wishlist_items"),
			where("product_id", "==", productId)
		);

		const itemsSnapshot = await getDocs(wishlistItemsQuery);
		console.log(`📦 Found ${itemsSnapshot.size} items with product_id ${productId}`);
		
		// Filter by tailor_id (handles case where tailor_id might not exist or doesn't match)
		let count = 0;
		itemsSnapshot.forEach((doc) => {
			const data = doc.data();
			console.log(`   Checking item:`, {
				product_id: data.product_id,
				tailor_id: data.tailor_id,
				tailor: data.tailor,
				matches: data.tailor_id === tailorId
			});
			
			if (data.tailor_id === tailorId) {
				count++;
			}
		});
		
		console.log(`✅ Found ${count} users who wishlisted this product for this tailor`);
		console.log(`📊 Total wishlist count for ${productId}: ${count}`);
		
		return count;
	} catch (error) {
		console.error("❌ Error getting wishlist count:", error);
		console.error("Error details:", { productId, tailorId, error });
		return 0;
	}
}

/**
 * Get wishlist counts for multiple products (batch operation)
 */
export async function getBatchProductWishlistCounts(
	products: Array<{ product_id: string; tailor_id: string }>
): Promise<Map<string, number>> {
	try {
		console.log(`🔍 Getting batch wishlist counts for ${products.length} products`);
		const wishlistCounts = new Map<string, number>();

		// Initialize all counts to 0
		products.forEach((product) => {
			wishlistCounts.set(product.product_id, 0);
		});

		// Use collectionGroup to query ALL user_wishlist_items subcollections at once
		const allWishlistItems = await getDocs(
			collectionGroup(db, "user_wishlist_items")
		);
		
		console.log(`📦 Found ${allWishlistItems.size} total wishlist items across all users`);

		// Count items for our products
		allWishlistItems.forEach((itemDoc) => {
			const data = itemDoc.data();
			const productId = data.product_id;
			const tailorId = data.tailor_id;

			if (!productId) {
				console.warn("⚠️ Wishlist item missing product_id:", itemDoc.id);
				return;
			}

			// Check if this item belongs to one of our products
			const matchingProduct = products.find(
				(p) => p.product_id === productId && p.tailor_id === tailorId
			);

			if (matchingProduct) {
				const currentCount = wishlistCounts.get(productId) || 0;
				wishlistCounts.set(productId, currentCount + 1);
				console.log(`✅ Match found! Product ${productId} count: ${currentCount + 1}`);
			}
		});

		console.log("📊 Final counts:", Object.fromEntries(wishlistCounts));
		return wishlistCounts;
	} catch (error) {
		console.error("❌ Error getting batch wishlist counts:", error);
		console.error("Error details:", error);
		return new Map();
	}
}

/**
 * Get total wishlist count for all products of a tailor
 */
export async function getTailorTotalWishlistCount(
	tailorId: string
): Promise<number> {
	try {
		console.log("🔍 Getting total wishlist count for tailor:", tailorId);

		// Use collectionGroup to query ALL user_wishlist_items subcollections
		const wishlistItemsQuery = query(
			collectionGroup(db, "user_wishlist_items"),
			where("tailor_id", "==", tailorId)
		);

		const itemsSnapshot = await getDocs(wishlistItemsQuery);
		
		console.log(`✅ Found ${itemsSnapshot.size} total items wishlisted for this tailor`);
		console.log(`📊 Total wishlist count for tailor ${tailorId}: ${itemsSnapshot.size}`);
		
		return itemsSnapshot.size;
	} catch (error) {
		console.error("❌ Error getting tailor total wishlist count:", error);
		console.error("Error details:", { tailorId, error });
		return 0;
	}
}

