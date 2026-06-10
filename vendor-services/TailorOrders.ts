// lib/firebase/orders.ts
import { getDbInstance } from "@/firebase"
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
  /** Firestore document ID for this specific item */
  doc_id?: string;
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

  // Source currency fields (original NGN prices)
  source_currency?: string;
  source_original_price?: number;
  source_price?: number;
  source_platform_commission?: number;
  currency?: string;

  // Duty charge fields
  original_price?: number;
  duty_charge?: number;

  // BOGO fields
  is_bogo_item?: boolean;
  bogo_type?: string;
  bogo_main_product_id?: string;

  // Coupon fields
  coupon_code?: string;
  coupon_value?: number;
  coupon_currency?: string;

  // Amount actually paid after coupon
  amount_paid?: number;
  amount_paid_currency?: string;
}

/** A grouped order containing one or more items that share the same order_id */
export interface GroupedOrder {
  order_id: string;
  items: UserOrder[];
  user_address: UserAddress;
  timestamp: string;
  order_status: string;
  total_amount: number;
  shipping_fee: number;
  currency?: string;
  source_currency?: string;
  delivery_date: string;
  user_id: string;
  last_dhl_event?: any;
  dhl_events_snapshot?: any[];
}

export interface TailorSalesSummary {
  totalItemsSold: number;
  totalRevenue: number;
  orderCount: number;
}

/**
 * Rows under users_orders/{uid}/user_orders that mirror top-level VVIP orders are skipped here.
 * Approved VVIP work is loaded from the top-level `orders` collection via getVvipOrdersForTailor.
 * Including mirrors here as well would duplicate those rows in the vendor list.
 */
function shouldOmitVvipUserOrdersMirrorRow(data: any): boolean {
  const vvipRef =
    typeof data.vvip_order_ref === 'string' ? data.vvip_order_ref.trim() : '';
  if (vvipRef) return true;
  if (data._isMirror === true) return true;
  return (
    data.isVvip === true &&
    data.payment_method === 'manual_transfer'
  );
}

/** Stable key for deduping line items merged into one GroupedOrder. */
function orderItemDedupeKey(item: UserOrder): string {
  const ref =
    typeof item.product_order_ref === 'string'
      ? item.product_order_ref.trim()
      : '';
  if (ref) return `ref:${ref}`;
  // Dedupe by cart line identity — the same product in one order_id can exist in
  // multiple Firestore docs (checkout mirror + users_orders write). Do not key on
  // doc_id alone or duplicates show up in the vendor list.
  return `line:${item.order_id}:${item.product_id}:${item.size ?? ''}:${item.color ?? ''}:${item.quantity}`;
}

function normalizeOrderGroupKey(orderId: string | undefined, fallbackDocId?: string): string {
  const key = (orderId || fallbackDocId || '').trim();
  return key;
}

export async function getVvipOrdersForTailor(tailorId: string): Promise<UserOrder[]> {
  try {
    const ordersRef = collection(getDbInstance(), "orders");
    const q = query(ordersRef, where("isVvip", "==", true));
    const querySnapshot = await getDocs(q);

    const tailorOrders: UserOrder[] = [];

    querySnapshot.forEach((doc) => {
      const orderData = doc.data();

      /** Vendors must not see VVIP orders until marketing approves payment. */
      if (orderData.payment_status !== 'approved') {
        return;
      }

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

        const lineDocId = `${doc.id}_${item.originalIndex}`;

        // Map VVIP order item to UserOrder format
        tailorOrders.push({
          order_id: doc.id,
          doc_id: lineDocId,
          tailor_id: tailorId,
          user_id: orderData.userId,
          product_id: item.id || item.productId,
          tailor_name: item.tailor_name || item.vendor?.name || 'Unknown Vendor',
          title: item.name || item.title || 'Untitled Product',
          quantity: item.quantity || 1,
          price: item.originalPrice || item.price || 0,
          original_price: item.originalPrice || item.price || 0,
          // Source price fields (NGN) — camelCase from VVIP order items
          source_original_price: item.sourceOriginalPrice || item.source_original_price || 0,
          source_currency: item.sourceCurrency || item.source_currency || orderData.currency || 'NGN',
          source_price: item.sourcePrice || item.source_price || 0,
          
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
): Promise<GroupedOrder[]> {
	const rawItems: UserOrder[] = [];

	try {
		// Fetch standard orders using collectionGroup for efficiency
		const q = query(
			collectionGroup(getDbInstance(), "user_orders"),
			where("tailor_id", "==", tailorId),
		);
		const querySnapshot = await getDocs(q);

		querySnapshot.forEach((orderDoc) => {
			const data = orderDoc.data();
			if (shouldOmitVvipUserOrdersMirrorRow(data)) {
				return;
			}
			// Resolve timestamp to ISO string regardless of Firestore Timestamp or string
			let resolvedTimestamp: string;
			if (data.timestamp?.toDate) {
				resolvedTimestamp = data.timestamp.toDate().toISOString();
			} else if (data.timestamp?.seconds) {
				resolvedTimestamp = new Date(data.timestamp.seconds * 1000).toISOString();
			} else if (data.timestamp) {
				resolvedTimestamp = data.timestamp;
			} else {
				resolvedTimestamp = new Date().toISOString();
			}
			rawItems.push({
				...(data as UserOrder),
				// Use the shared order_id field on the document (cart reference), not the doc ID
				// Only fall back to doc ID if order_id is truly absent
				order_id: data.order_id || orderDoc.id,
				doc_id: orderDoc.id,
				timestamp: resolvedTimestamp,
				user_id: orderDoc.ref.parent.parent?.id || data.user_id || "",
				images: data.images || [],
			});
		});
	} catch (error) {
		console.error("Error fetching standard orders for tailor:", error);
	}

	// Fetch and merge VVIP orders (already one item per entry)
	const vvipOrders = await getVvipOrdersForTailor(tailorId);
	rawItems.push(...vvipOrders);

	// Group items by shared order_id (cart reference)
	const grouped = new Map<string, GroupedOrder>();
	const seenItemsByGroup = new Map<string, Set<string>>();
	for (const item of rawItems) {
		const key = normalizeOrderGroupKey(item.order_id, item.doc_id);
		if (!key) continue;
		if (!grouped.has(key)) {
			grouped.set(key, {
				order_id: item.order_id?.trim() || key,
				items: [],
				user_address: item.user_address,
				timestamp: item.timestamp,
				order_status: item.order_status,
				total_amount: 0,
				shipping_fee: item.shipping_fee,
				currency: item.currency,
				source_currency: item.source_currency,
				delivery_date: item.delivery_date,
				user_id: item.user_id,
				last_dhl_event: item.last_dhl_event,
				dhl_events_snapshot: item.dhl_events_snapshot,
			});
			seenItemsByGroup.set(key, new Set());
		}
		const group = grouped.get(key)!;
		const seen = seenItemsByGroup.get(key)!;
		const dedupeKey = orderItemDedupeKey(item);
		if (seen.has(dedupeKey)) {
			const existingIdx = group.items.findIndex(
				(existing) => orderItemDedupeKey(existing) === dedupeKey,
			);
			if (
				existingIdx >= 0 &&
				item.doc_id &&
				!group.items[existingIdx].doc_id
			) {
				const existing = group.items[existingIdx];
				group.total_amount -= (existing.original_price ?? existing.price) * existing.quantity;
				group.items[existingIdx] = item;
				group.total_amount += (item.original_price ?? item.price) * item.quantity;
			}
			continue;
		}
		seen.add(dedupeKey);
		// Use the most recent last_dhl_event across all items in the group
		if (item.last_dhl_event && !group.last_dhl_event) {
			group.last_dhl_event = item.last_dhl_event;
		}
		// Use the most recent timestamp for the group
		if (item.timestamp && new Date(item.timestamp) > new Date(group.timestamp)) {
			group.timestamp = item.timestamp;
		}
		group.items.push(item);
		group.total_amount += (item.original_price ?? item.price) * item.quantity;
	}

	return Array.from(grouped.values()).sort(
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
        const orderDocRef = doc(getDbInstance(), "orders", realOrderId);
        const orderSnap = await getDoc(orderDocRef);
        
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          if (
            orderData.isVvip === true &&
            orderData.payment_status !== 'approved'
          ) {
            return null;
          }
          
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
                  source_original_price: item.sourceOriginalPrice || item.source_original_price || 0,
                  source_currency: item.sourceCurrency || item.source_currency || orderData.currency || 'NGN',
                  source_price: item.sourcePrice || item.source_price || 0,
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

    // 2. Fallback to Standard Orders
    // NB: list page routes with shared `order_id`, while Firestore doc id may differ.
    // Match either `data.order_id` OR document id, scoped to this tailor.
    const standardOrdersQuery = query(
      collectionGroup(getDbInstance(), "user_orders"),
      where("tailor_id", "==", tailorId),
    );
    const standardOrdersSnap = await getDocs(standardOrdersQuery);

    for (const orderDoc of standardOrdersSnap.docs) {
      const data = orderDoc.data();
      const sharedOrderId = data.order_id || orderDoc.id;
      if (sharedOrderId !== orderId && orderDoc.id !== orderId) continue;

      const vvipMirrorRef =
        typeof data.vvip_order_ref === 'string'
          ? data.vvip_order_ref.trim()
          : '';
      if (vvipMirrorRef) {
        const masterSnap = await getDoc(
          doc(getDbInstance(), 'orders', vvipMirrorRef),
        );
        if (
          !masterSnap.exists() ||
          masterSnap.data()?.payment_status !== 'approved'
        ) {
          continue;
        }
      } else if (shouldOmitVvipUserOrdersMirrorRow(data)) {
        continue;
      }

      const userId = orderDoc.ref.parent.parent?.id || data.user_id || "";
      return {
        ...(data as UserOrder),
        order_id: sharedOrderId,
        doc_id: orderDoc.id,
        timestamp: data.timestamp?.toDate
          ? data.timestamp.toDate().toISOString()
          : data.timestamp,
        user_id: userId,
        images: data.images || [],
      };
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
    order.items.forEach((item) => {
      totalItemsSold += item.quantity
      const unitPrice = (item.source_original_price && item.source_original_price > 0)
        ? item.source_original_price
        : item.price
      totalRevenue += unitPrice * item.quantity
    })
  })

  return {
    totalItemsSold,
    totalRevenue,
    orderCount: orders.length,
  }
}

/**
 * Calculate the vendor's total wallet balance by reading directly from the tailor doc.
 * This is the authoritative source — updated atomically at checkout (wallet_by_provider)
 * and decremented on payout approval. Matches what the API returns.
 */
export async function getTailorWalletBalance(tailorId: string): Promise<number> {
  try {
    const tailorRef = doc(getDbInstance(), "tailors", tailorId);
    const tailorSnap = await getDoc(tailorRef);
    if (!tailorSnap.exists()) return 0;
    const data = tailorSnap.data();
    return Number(data?.wallet_balance ?? data?.wallet ?? data?.wallet_details?.balance ?? 0);
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return 0;
  }
}
