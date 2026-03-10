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
  product_order_ref: string;
}

export interface OrderResponse {
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  status: 'pending' | 'completed' | 'failed' | string; // you can narrow this based on known values
  reason: string;
  user_order: UserOrder[];
}

const PAGE_SIZE = 10;

export const fetchAllReturnOrders = async ({
  status = "",
  search = "",
  lastDoc = null
}: {
  status?: string;
  search?: string;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
} = {}): Promise<{
  orders: OrderResponse[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> => {
  try {
    const q = collectionGroup(db, "staging_returns");

    const filters = [];

    if (status) {
      filters.push(where("status", "==", status));
    }

    const queryConstraints = [...filters];

    if (lastDoc) queryConstraints.push(startAfter(lastDoc) as any);
    queryConstraints.push(limit(PAGE_SIZE) as any);

    const qBuilt = query(q, ...queryConstraints);
    const snapshot = await getDocs(qBuilt);

    let orders: OrderResponse[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate().toISOString()
          : data.updatedAt,
        status: data.status,
        reason: data.reason,
        user_order: Array.isArray(data.user_order)
          ? data.user_order.map((order) => ({
              delivery_date: order.delivery_date,
              delivery_type: order.delivery_type,
              dhl_shipment: {
                shipmentTrackingNumber: order.dhl_shipment?.shipmentTrackingNumber || "",
                trackingUrl: order.dhl_shipment?.trackingUrl || "",
                type: order.dhl_shipment?.type || ""
              },
              order_id: order.order_id,
              order_status: order.order_status,
              product_order_ref: order.product_order_ref,
              price: order.price,
              product_id: order.product_id,
              quantity: order.quantity,
              shipping_fee: order.shipping_fee,
              size: order.size || null,
              tailor_id: order.tailor_id,
              tailor_name: order.tailor_name,
              timestamp: order.timestamp?.toDate
                ? order.timestamp.toDate().toISOString()
                : order.timestamp,
              title: order.title,
              user_id: order.user_id,
              wear_category: order.wear_category,
              user_address: {
                city: order.user_address?.city || "",
                country: order.user_address?.country || "",
                dial_code: order.user_address?.dial_code || "",
                first_name: order.user_address?.first_name || "",
                flat_number: order.user_address?.flat_number || "",
                last_name: order.user_address?.last_name || "",
                phone_number: order.user_address?.phone_number || "",
                post_code: order.user_address?.post_code || "",
                state: order.user_address?.state || "",
                street_address: order.user_address?.street_address || ""
              }
            }))
          : []
      };
    });

    if (search) {
      const lowerSearch = search.toLowerCase();
      orders = orders.filter((response) =>
        response.user_order.some((order) =>
          order.tailor_name.toLowerCase().includes(lowerSearch)
        )
      );
    }

    return {
      orders,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === PAGE_SIZE
    };
  } catch (error) {
    console.error("Failed to fetch return orders:", error);
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
export const calculateTotalRevenue = (responses: OrderResponse[]): number => {
  return responses.reduce((total, res) => {
    const orderSum = res.user_order.reduce(
      (sum, order) => sum + (order.price || 0),
      0
    );
    return total + orderSum;
  }, 0);
};

