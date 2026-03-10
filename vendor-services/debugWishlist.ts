import { db } from "@/firebase";
import { collection, getDocs, collectionGroup } from "firebase/firestore";

/**
 * Debug function to inspect the wishlist structure in Firestore
 * Call this from the browser console to see what's actually in your database
 */
export async function debugWishlistStructure() {
	console.log("🔍 Starting Firestore wishlist debug...");
	
	try {
		// Step 1: Check the main collection
		const usersWishlistRef = collection(db, "staging_users_wishlist_items");
		console.log("🔗 Collection reference:", usersWishlistRef.path);
		
		const wishlistDocs = await getDocs(usersWishlistRef);
		
		console.log("📦 Step 1: Main Collection Check");
		console.log(`   Found ${wishlistDocs.size} documents in 'users_wishlist_items'`);
		console.log(`   Query returned: ${wishlistDocs.docs.length} document(s)`);
		console.log(`   Empty: ${wishlistDocs.empty}`);
		
		if (wishlistDocs.size === 0) {
			console.warn("⚠️ No documents found in 'users_wishlist_items' collection!");
			console.log("💡 This could mean:");
			console.log("   1. The collection is empty");
			console.log("   2. The collection name is different");
			console.log("   3. You don't have read permissions");
			return;
		}
		
		// Step 2: List all document IDs
		console.log("\n📋 Step 2: Document IDs found:");
		wishlistDocs.docs.forEach((doc, index) => {
			console.log(`   ${index + 1}. Document ID: ${doc.id}`);
		});
		
		// Step 3: Check subcollections and their contents
		console.log("\n📂 Step 3: Checking subcollections...");
		
		let totalItems = 0;
		let sampleItem: any = null;
		
		for (const doc of wishlistDocs.docs) {
			// Check the document data itself
			const docData = doc.data();
			console.log(`\n   Document '${doc.id}':`);
			console.log(`   └─ Document data:`, docData);
			
			const subcollectionRef = collection(
				db,
				"users_wishlist_items",
				doc.id,
				"user_wishlist_items"
			);
			
			console.log(`   └─ Subcollection path: ${subcollectionRef.path}`);
			
			const subcollectionDocs = await getDocs(subcollectionRef);
			
			console.log(`   └─ Has ${subcollectionDocs.size} items in 'user_wishlist_items' subcollection`);
			
			if (subcollectionDocs.size > 0) {
				totalItems += subcollectionDocs.size;
				
				// Get a sample item to show structure
				if (!sampleItem) {
					const firstItem = subcollectionDocs.docs[0];
					sampleItem = firstItem.data();
					console.log(`\n   📄 Sample Item Structure:`);
					console.log("   ", JSON.stringify(sampleItem, null, 2));
				}
				
				// Show first few items
				subcollectionDocs.docs.slice(0, 3).forEach((item, idx) => {
					const data = item.data();
					console.log(`   ${idx + 1}. Item ID: ${item.id}`);
					console.log(`      - product_id: ${data.product_id || "MISSING"}`);
					console.log(`      - tailor_id: ${data.tailor_id || "MISSING"}`);
					console.log(`      - tailor: ${data.tailor || "MISSING"}`);
					console.log(`      - title: ${data.title || "N/A"}`);
					console.log(`      - All fields:`, Object.keys(data));
				});
				
				if (subcollectionDocs.size > 3) {
					console.log(`   ... and ${subcollectionDocs.size - 3} more items`);
				}
			}
		}
		
		console.log("\n✅ Debug Summary (Old Method):");
		console.log(`   Total wishlist documents: ${wishlistDocs.size}`);
		console.log(`   Total wishlist items: ${totalItems}`);
		
		// NEW: Try collectionGroup approach
		console.log("\n🆕 Step 4: Testing CollectionGroup Method...");
		console.log("   This queries ALL user_wishlist_items subcollections directly!");
		
		const allWishlistItems = await getDocs(
			collectionGroup(db, "user_wishlist_items")
		);
		
		console.log(`📦 Found ${allWishlistItems.size} items using collectionGroup!`);
		
		if (allWishlistItems.size > 0) {
			console.log("\n📄 Sample items from collectionGroup:");
			allWishlistItems.docs.slice(0, 3).forEach((item, idx) => {
				const data = item.data();
				console.log(`   ${idx + 1}. Item ID: ${item.id}`);
				console.log(`      - product_id: ${data.product_id || "MISSING"}`);
				console.log(`      - tailor_id: ${data.tailor_id || "MISSING"}`);
				console.log(`      - tailor: ${data.tailor || "MISSING"}`);
				console.log(`      - title: ${data.title || "N/A"}`);
			});
			
			if (!sampleItem && allWishlistItems.docs.length > 0) {
				sampleItem = allWishlistItems.docs[0].data();
				console.log(`\n📄 Full Sample Item:`, JSON.stringify(sampleItem, null, 2));
			}
		}
		
		if (totalItems === 0 && allWishlistItems.size === 0) {
			console.warn("\n⚠️ No wishlist items found with either method!");
			console.log("💡 This means users haven't added any products to their wishlists yet.");
		} else if (totalItems === 0 && allWishlistItems.size > 0) {
			console.log("\n✅ SOLUTION FOUND!");
			console.log("   The parent documents are empty (no fields), so they don't appear in queries.");
			console.log("   But collectionGroup finds the subcollection items directly!");
			console.log(`   ✓ Using collectionGroup works: ${allWishlistItems.size} items found!`);
		}
		
		return {
			totalDocuments: wishlistDocs.size,
			totalItems,
			collectionGroupItems: allWishlistItems.size,
			sampleItem
		};
		
	} catch (error: any) {
		console.error("❌ Error debugging wishlist:", error);
		console.error("Error message:", error.message);
		console.error("Error code:", error.code);
		
		if (error.code === "permission-denied") {
			console.error("\n🔒 Permission Denied!");
			console.log("💡 Your Firestore security rules may be blocking reads.");
			console.log("   Check your Firestore rules for 'users_wishlist_items'");
		}
		
		return null;
	}
}

// Make it available globally for testing in browser console
if (typeof window !== 'undefined') {
	(window as any).debugWishlistStructure = debugWishlistStructure;
}

