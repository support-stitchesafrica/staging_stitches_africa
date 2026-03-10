import { db } from "../firebase";
import {
  collectionGroup,
  getDocs,
  query,
  where,
  startAfter,
  limit,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";

export interface DHLShipment {
  shipmentTrackingNumber: string;
  trackingUrl: string;
  type: string;
}

export interface UserAddress {
  city: string;
  country: string;
  dial_code: string;
  first_name: string;
  flat_number: string;
  last_name: string;
  phone_number: string;
  post_code: string;
  state: string;
  street_address: string;
}

export interface UserOrder {
  delivery_date: string;
  delivery_type: string;
  dhl_shipment: DHLShipment;
  order_id: string;
  order_status: string;
  price: number;
  product_id: string;
  quantity: number;
  shipping_fee: number;
  size: string | null;
  tailor_id: string;
  tailor_name: string;
  timestamp: string;
  title: string;
  user_id: string;
  user_address: UserAddress;
  wear_category: string;
}

const PAGE_SIZE = 10;

export const fetchAllUserOrders = async ({
  status = "",
  search = "",
  lastDoc = null
}: {
  status?: string;
  search?: string;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
} = {}): Promise<{
  orders: UserOrder[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> => {
  try {
    const q = collectionGroup(db, "staging_all_orders");

    const filters = [];

    if (status) {
      filters.push(where("order_status", "==", status));
    }

    const queryConstraints = [...filters];

    if (lastDoc) queryConstraints.push(startAfter(lastDoc) as any);

    queryConstraints.push(limit(PAGE_SIZE) as any);

    const qBuilt = query(q, ...queryConstraints);
    const snapshot = await getDocs(qBuilt);

    let orders: UserOrder[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        delivery_date: data.delivery_date,
        delivery_type: data.delivery_type,
        dhl_shipment: {
          shipmentTrackingNumber: data.dhl_shipment?.shipmentTrackingNumber || "",
          trackingUrl: data.dhl_shipment?.trackingUrl || "",
          type: data.dhl_shipment?.type || ""
        },
        order_id: doc.id,
        order_status: data.order_status,
        price: data.price,
        product_id: data.product_id,
        quantity: data.quantity,
        shipping_fee: data.shipping_fee,
        size: data.size || null,
        tailor_id: data.tailor_id,
        tailor_name: data.tailor_name,
        timestamp: data.timestamp?.toDate
          ? data.timestamp.toDate().toISOString()
          : data.timestamp,
        title: data.title,
        wear_category: data.wear_category,
        user_id: data.user_id,
        user_address: {
          city: data.user_address?.city || "",
          country: data.user_address?.country || "",
          dial_code: data.user_address?.dial_code || "",
          first_name: data.user_address?.first_name || "",
          flat_number: data.user_address?.flat_number || "",
          last_name: data.user_address?.last_name || "",
          phone_number: data.user_address?.phone_number || "",
          post_code: data.user_address?.post_code || "",
          state: data.user_address?.state || "",
          street_address: data.user_address?.street_address || ""
        }
      };
    });

    if (search) {
      const lowerSearch = search.toLowerCase();
      orders = orders.filter((order) =>
        order.tailor_name.toLowerCase().includes(lowerSearch)
      );
    }

    return {
      orders,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === PAGE_SIZE
    };
  } catch (error) {
    console.error("Failed to fetch all user orders:", error);
    return {
      orders: [],
      lastVisible: null,
      hasMore: false
    };
  }
};

/**
 * Calculates the total revenue based only on the `price` of each order.
 * @param orders Array of UserOrder
 * @returns total revenue (number)
 */
export const calculateTotalRevenue = (orders: UserOrder[]): number => {
  return orders.reduce((total, order) => total + (order.price || 0), 0);
};

