import { db } from "@/firebase"
import { doc, updateDoc, collectionGroup, query, where, getDocs } from "firebase/firestore"

export const updateOrderStatus = async (
  orderStatus: string,
  userId: string,
  orderId: string
) => {
  try {
    // Check for VVIP Order ID format (contains underscore and valid index suffix)
    if (orderId.includes('_')) {
        const parts = orderId.split('_');
        const itemIndex = parseInt(parts[parts.length - 1]);
        const realOrderId = parts.slice(0, parts.length - 1).join('_');
        
        if (!isNaN(itemIndex)) {
          const vvipOrderRef = doc(db, "staging_orders", realOrderId);
          const vvipOrderSnap = await getDocs(query(collectionGroup(db, "orders"), where("__name__", "==", realOrderId))); // Actually direct doc ref is better but let's stick to simple getDoc
          // Wait, getDoc is better.
          const directOrderSnap = await import("firebase/firestore").then(m => m.getDoc(vvipOrderRef));
          
          if (directOrderSnap.exists()) {
              const orderData = directOrderSnap.data();
              if (orderData.items && orderData.items[itemIndex]) {
                  const items = [...orderData.items];
                  // Update the specific item's status
                  items[itemIndex] = {
                      ...items[itemIndex],
                      order_status: orderStatus,
                      status: orderStatus // Update both to be safe
                  };

                  await updateDoc(vvipOrderRef, { items });
                  console.log(`VVIP Order status updated for item ${itemIndex} in order ${realOrderId}`);
                  return { success: true };
              }
          }
        }
    }

    // Reference to the user's order
    const userOrderRef = doc(db, "staging_users_orders", userId, "user_orders", orderId)
    
    // Query for the order in the all_orders collection group
    // This handles cases where the doc ID might be different (e.g. {order_id}_{doc.id})
    const allOrdersQuery = query(
      collectionGroup(db, "all_orders"), 
      where("order_id", "==", orderId)
    )
    
    const allOrdersSnapshot = await getDocs(allOrdersQuery)
    const updatePromises = [
      updateDoc(userOrderRef, { order_status: orderStatus })
    ]

    allOrdersSnapshot.forEach((doc) => {
      updatePromises.push(updateDoc(doc.ref, { order_status: orderStatus }))
    })

    // Update all documents
    await Promise.all(updatePromises)

    console.log(`Order status updated successfully. specific user doc + ${allOrdersSnapshot.size} all_orders docs.`)
    return { success: true }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { success: false, message: (error as Error).message }
  }
}
