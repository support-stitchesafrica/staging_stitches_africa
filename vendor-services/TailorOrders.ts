// lib/firebase/orders.ts
import { db } from "@/firebase"
import { 
  collection, 
  collectionGroup,
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  Timestamp
} from "firebase/firestore"

export interface DHLShipment {
  carrier?: string;
  createdAt?: any; // timestamp
  documents?: DHLDocument[];
  packages?: DHLPackage[];
  shipmentTrackingNumber?: string;
  status?: string;
  trackingUrl?: string;
  type?: string;
}

export interface DHLDocument {
  gsPath?: string;
  typeCode?: string;
  url?: string;
  content?: string;
  type?: string;
}

export interface DHLPackage {
  referenceNumber?: number;
  trackingNumber?: string;
  trackingUrl?: string;
}

export interface UserAddress {
  city: string;
  country: string;
  country_code: string;
  dial_code: string;
  first_name: string;
  flat_number: string;
  last_name: string;
  phone_number: string;
  post_code: string;
  state: string;
  street_address: string;
  user_email: string;
}

export interface TimelineEvent {
  status?: string;
  description?: string;
  occurred_at?: string;
  location?: string;
}

export interface OrderShipping {
  carrier?: string;
  createdAt?: Timestamp;
  documents?: DHLDocument[];
  packages?: DHLPackage[];
  shipmentTrackingNumber?: string;
  status?: string;
  trackingUrl?: string;
  type?: string;
}

export interface UserOrder {
  order_id: string;
  tailor_id: string;
  user_id: string;
  product_id: string;
  tailor_name: string;
  title: string;
  quantity: number;
  price: number;
  order_status: string;
  delivery_date: string;
  delivery_type: string;
  description?: string;
  color?: string;
  dhl_events_snapshot?: any[];
  last_dhl_event?: any;
  last_update?: string;
  timeline?: TimelineEvent[];
  shipping?: OrderShipping;
  dhl_shipment?: DHLShipment;
  images: string[];
  user_address: UserAddress;
  user_measurement?: Record<string, any> | null;
  timestamp: string;
  size: string | null;
  shipping_fee: number;
  wear_category?: string;
  product_order_ref?: string;

  // Collection-specific fields
  is_collection_order?: boolean;
  collection_id?: string;
  collection_name?: string;
  exempted_products?: string[];

  // Duty charge fields
  original_price?: number;
  duty_charge?: number;

  // BOGO fields
  is_bogo_item?: boolean;
  bogo_type?: string;
  bogo_main_product_id?: string;
}

export interface TailorSalesSummary {
  totalItemsSold: number;
  totalRevenue: number;
  orderCount: number;
}

export async function getVvipOrdersForTailor(tailorId: string): Promise<UserOrder[]> {
  try {
    const ordersRef = collection(db, "staging_orders");
    const q = query(ordersRef, where("isVvip", "==", true));
    const querySnapshot = await getDocs(q);

    const tailorOrders: UserOrder[] = [];

    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      const items = orderData.items || [];

      // Calculate total order value to derive shipping
      // User Logic: Shipping = Amount Paid - (Original Price + Duty)
      let totalOrderValue = 0;
      items.forEach((itm: any) => {
         const itemPrice = (itm.originalPrice || itm.original_price || itm.price || 0) + (itm.dutyCharge || itm.duty_charge || 0);
         totalOrderValue += itemPrice * (itm.quantity || 1);
      });

      // Calculate total shipping pool available (can be negative if logic is off, so max(0, ...))
      // Use amount_paid from order, default to totalOrderValue if missing to avoid weirdness
      const totalAmountPaid = orderData.amount_paid || totalOrderValue; 
      const totalShippingPool = Math.max(0, totalAmountPaid - totalOrderValue);

      // Filter items that belong to this tailor
      // We need to keep track of the original index in the 'items' array for ID reconstruction later
      // so we map first, then filter.
      const compatibleItems = items.map((item: any, index: number) => ({...item, originalIndex: index}))
                                   .filter((item: any) => 
                                      item.tailor_id === tailorId || 
                                      item.vendor?.id === tailorId || 
                                      item.tailor?.id === tailorId
                                   );

      compatibleItems.forEach((item: any) => {
        // Calculate Effective Price (Original + Duty)
        // User requested: "original price is there... duty charge should never be shown... subtraction is shipping"
        const effectivePrice = (item.originalPrice || item.original_price || item.price || 0) + (item.dutyCharge || item.duty_charge || 0);
        
        // Calculate proportional shipping fee for this item
        // Ratio = (ItemValue / TotalOrderValue)
        const itemValue = effectivePrice * (item.quantity || 1);
        const shareRatio = totalOrderValue > 0 ? (itemValue / totalOrderValue) : 0;
        const itemShippingFee = Number((totalShippingPool * shareRatio).toFixed(2));

        // Map VVIP order item to UserOrder format
        tailorOrders.push({
          order_id: `${doc.id}_${item.originalIndex}`, // Unique ID: OrderID + ItemIndex
          tailor_id: tailorId,
          user_id: orderData.userId,
          product_id: item.id || item.productId,
          tailor_name: item.tailor_name || item.vendor?.name || 'Unknown Vendor',
          title: item.name || item.title || 'Untitled Product',
          quantity: item.quantity || 1,
          price: item.originalPrice || item.price || 0, // Display original price only (no duty)
          original_price: item.originalPrice || item.price || 0,
          
          order_status: item.order_status || item.status || (orderData.payment_status === 'pending_verification' ? 'Pending' : (orderData.order_status || 'Pending')),
          delivery_date: orderData.payment_date ? new Date(orderData.payment_date.seconds * 1000).toISOString() : new Date().toISOString(),
          delivery_type: 'Standard', // Default for VVIP manual?
          description: item.description,
          color: item.color,
          size: item.size,
          timestamp: orderData.created_at?.toDate().toISOString() || new Date().toISOString(),
          shipping_fee: itemShippingFee, // Derived shipping fee
          images: item.images || (item.image ? [item.image] : []),
          user_address: {
            city: orderData.shipping_address?.city || '',
            country: orderData.shipping_address?.country || '',
            country_code: '',
            dial_code: '',
            first_name: orderData.user_name?.split(' ')[0] || '',
            flat_number: '',
            last_name: orderData.user_name?.split(' ').slice(1).join(' ') || '',
            phone_number: '',
            post_code: orderData.shipping_address?.post_code || '',
            state: orderData.shipping_address?.state || '',
            street_address: orderData.shipping_address?.street_address || '',
            user_email: orderData.user_email || '',
          },
          wear_category: item.category,
        } as UserOrder);
      });
    });

    return tailorOrders;
  } catch (error) {
    console.error("Error fetching VVIP orders for tailor:", error);
    return [];
  }
}

export async function getAllOrdersForTailor(
	tailorId: string,
): Promise<UserOrder[]> {
	const tailorOrders: UserOrder[] = [];

	try {
		// Fetch standard orders using collectionGroup for efficiency
		const q = query(
			collectionGroup(db, "user_orders"),
			where("tailor_id", "==", tailorId),
		);
		const querySnapshot = await getDocs(q);

		querySnapshot.forEach((orderDoc) => {
			const data = orderDoc.data();
			tailorOrders.push({
				...(data as UserOrder),
				order_id: orderDoc.id,
				timestamp: data.timestamp?.toDate
					? data.timestamp.toDate().toISOString()
					: data.timestamp,
				user_id: orderDoc.ref.parent.parent?.id || data.user_id || "",
				images: data.images || [],
			});
		});
	} catch (error) {
		console.error("Error fetching standard orders for tailor:", error);
	}

	// Fetch and merge VVIP orders
	const vvipOrders = await getVvipOrdersForTailor(tailorId);

	return [...tailorOrders, ...vvipOrders].sort(
		(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
	);
}

export async function getTailorOrderById(tailorId: string, orderId: string): Promise<UserOrder | null> {
  try {
    // 1. Try VVIP (if formatted as VVIP ID)
    if (orderId.includes('_')) {
      const parts = orderId.split('_');
      // Last part is index, rest is ID (handle cases where ID has underscores?)
      // Assuming FireStore IDs don't have underscores usually, but safest to take last part.
      const itemIndex = parseInt(parts[parts.length - 1]);
      const realOrderId = parts.slice(0, parts.length - 1).join('_');
      
      if (!isNaN(itemIndex)) {
        const orderDocRef = doc(db, "staging_orders", realOrderId);
        const orderSnap = await getDoc(orderDocRef);
        
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          if (orderData.isVvip && orderData.items && orderData.items[itemIndex]) {
             const items = orderData.items; // Full items list primarily for calculating totals
             const item = orderData.items[itemIndex];
             
             // Verify tailor ownership (security)
             if (item.tailor_id === tailorId || item.vendor?.id === tailorId || item.tailor?.id === tailorId) {
                
                // --- SHIPPING CALCULATION LOGIC (Matched with getVvipOrdersForTailor) ---
                let totalOrderValue = 0;
                items.forEach((itm: any) => {
                   const itemPrice = (itm.originalPrice || itm.original_price || itm.price || 0) + (itm.dutyCharge || itm.duty_charge || 0);
                   totalOrderValue += itemPrice * (itm.quantity || 1);
                });

                const totalAmountPaid = orderData.amount_paid || totalOrderValue; 
                const totalShippingPool = Math.max(0, totalAmountPaid - totalOrderValue);

                const effectivePrice = (item.originalPrice || item.original_price || item.price || 0) + (item.dutyCharge || item.duty_charge || 0);

                const itemValue = effectivePrice * (item.quantity || 1);
                const shareRatio = totalOrderValue > 0 ? (itemValue / totalOrderValue) : 0;
                const itemShippingFee = Number((totalShippingPool * shareRatio).toFixed(2));
                // ------------------------------------------------------------------------

                // Map to UserOrder
               return {
                  order_id: orderId,
                  tailor_id: tailorId,
                  user_id: orderData.userId,
                  product_id: item.id || item.productId,
                  tailor_name: item.tailor_name || item.vendor?.name || 'Unknown Vendor',
                  title: item.name || item.title || 'Untitled Product',
                  quantity: item.quantity || 1,
                  price: item.originalPrice || item.original_price || item.price || 0,
                  original_price: item.originalPrice || item.original_price || item.price || 0,
                  order_status: item.order_status || item.status || (orderData.payment_status === 'pending_verification' ? 'Pending' : (orderData.order_status || 'Pending')),
                  delivery_date: orderData.payment_date ? new Date(orderData.payment_date.seconds * 1000).toISOString() : new Date().toISOString(),
                  delivery_type: 'Standard',
                  description: item.description,
                  color: item.color,
                  size: item.size,
                  timestamp: orderData.created_at?.toDate().toISOString() || new Date().toISOString(),
                  shipping_fee: itemShippingFee,
                  images: item.images || (item.image ? [item.image] : []),
                  user_address: {
                    city: orderData.shipping_address?.city || '',
                    country: orderData.shipping_address?.country || '',
                    country_code: '',
                    dial_code: '',
                    first_name: orderData.user_name?.split(' ')[0] || '',
                    flat_number: '',
                    last_name: orderData.user_name?.split(' ').slice(1).join(' ') || '',
                    phone_number: '',
                    post_code: orderData.shipping_address?.post_code || '',
                    state: orderData.shipping_address?.state || '',
                    street_address: orderData.shipping_address?.street_address || '',
                    user_email: orderData.user_email || '',
                  },
                  wear_category: item.category,
               } as UserOrder;
             }
          }
        }
      }
    }

    // 2. Fallback to Standard Orders (Existing Logic)
    const usersOrdersRef = collection(db, "staging_users_orders")
    const userDocsSnap = await getDocs(usersOrdersRef)

    for (const userDoc of userDocsSnap.docs) {
      const userId = userDoc.id
      const orderDocRef = doc(db, "staging_users_orders", userId, "user_orders", orderId)
      const orderSnap = await getDoc(orderDocRef)

      if (orderSnap.exists()) {
        const data = orderSnap.data()

        if (data.tailor_id === tailorId) {
          return {
            ...(data as UserOrder),
            order_id: orderSnap.id,
            timestamp: data.timestamp.toDate().toISOString(),
            user_id: userId,
            images: data.images || [],
          }
        }
      }
    }

    return null // Order not found for this tailor
  } catch (error) {
    console.error("Error fetching order by ID:", error)
    return null
  }
}

export async function getTailorSalesSummary(tailorId: string): Promise<TailorSalesSummary> {
  const orders = await getAllOrdersForTailor(tailorId)

  let totalItemsSold = 0
  let totalRevenue = 0

  orders.forEach((order) => {
    totalItemsSold += order.quantity
    totalRevenue += (order.price * order.quantity) + order.shipping_fee
  })

  return {
    totalItemsSold,
    totalRevenue,
    orderCount: orders.length,
  }
}
