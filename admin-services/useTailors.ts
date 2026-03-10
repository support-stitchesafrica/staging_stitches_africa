// useTailors.ts
"use client";

import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  getDoc,
  Timestamp,
  query,
  where,
  CollectionReference,
  DocumentData,
  updateDoc,
} from "firebase/firestore";

// --- Types ---
export interface Transaction {
  transaction_id: string;
  related_transaction_id?: string;
  order_id: string;
  amount: number;
  created_by: string;
  date: Date;
  description: string;
  status: string;
  type: string;
}

export interface Tailor {
  id: string;
  brand_category: string[];
  brand_name: string;
  brandName?: string; // Added for compatibility
  brand_logo?: string;
  // KYC Request Fields
  requestKycUpload?: boolean;
  adminApprovedKycUpload?: boolean;
  kycUpdateReason?: string;
  kycApprovalStatus?: string;
  adminNote?: string;
  kycApprovedAt?: string;
  company_address_verification?: {
    city: string;
    country: string;
    postCode: string;
    proofOfAddress: string;
    state: string;
    status: string;
    streetAddress: string;
  };
  company_verification?: {
    address: string;
    businessName: string;
    city: string;
    companyStatus: string;
    documentImageUrl: string;
    registrationNumber: string;
    state: string;
    status: string;
    typeOfEntity: string;
    verifiedAt: Date;
  };
  ["company-verification"]?: {
    address: string;
    businessName: string;
    city: string;
    companyStatus: string;
    documentImageUrl: string;
    registrationNumber: string;
    state: string;
    status: string;
    typeOfEntity: string;
    verifiedAt: Date;
  };
  keyPersonnel?: Array<{
    countryOfResidence: string;
    designation: string;
    gender: string | null;
    isCorporate: boolean | null;
    name: string;
    nationality: string | null;
  }>;
  featured_works?: string[];
  identity_verification?: {
    countryCode: string;
    feedbackMessage: string;
    fullName: string;
    idNumber: string;
    middleName: string | null;
    status: string;
    verificationType: string;
    logo?: string;
    ratings: number;
    tagline?: string;
  };
  tailor_registered_info?: {
    email: string;
    ["first-name"]: string;
    id: string;
    ["last-name"]: string;
  };
  wear_specialization?: string;
  wallet?: number;
  transactions?: Transaction[];
  totalUsers?: number;
  totalProducts?: number;
  totalOrders?: number;
  users?: User[];
  products?: TailorWork[];
  orders?: UserOrder[];
  type?: string; // Added for compatibility
}

export interface User {
  id: string;
  tailorId?: string;
  first_name: string;
  last_name: string;
  email: string;
  createdAt: string;
}

export interface DhlEvent {
  id: string;
  order_id: string;
  event_type: string;
  description: string;
  timestamp: Date;
  location?: string;
}

export interface TailorWork {
  id: string;
  tailor_id: string;
  title: string;
  price: number;
  createdAt: string;
}

export interface UserOrder {
  id: string;
  product_id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  wear_category: string;
  wear_quantity: number;
  price: number;
  discount: number;
  customSizes: boolean;
  sizes: string[];
  images: string[];
  keywords: string[];
  tags: string[];
  tailor: string;
  tailor_id: string;
  is_verified: boolean;
  created_at: Date;

  // --- Firestore fields you were missing ---
  order_status: string;
  product_order_ref: string;
  delivery_date: string;
  delivery_type: string;
  shipping_fee: number;
  user_address: {
    first_name: string;
    last_name: string;
    street_address: string;
    flat_number: string;
    city: string;
    state: string;
    country: string;
    country_code: string;
    dial_code: string;
    post_code: string;
    phone_number: string;
  };
  quantity: number;
  size: string | null;
  user_id: string;
  order_id: string

  // NEW: DHL events snapshot
  dhl_events_snapshot?: Array<{
    date: string;
    time: string;
    description: string;
    typeCode: string;
    serviceArea: { code: string; description: string }[];
    signedBy?: string;
  }>;
}

// --- Get DHL events for a tailor ---
async function getDhlEventsByTailor(tailorId: string): Promise<DhlEvent[]> {
  const events: DhlEvent[] = [];
  const snap = await getDocs(
    collection(db, "staging_dhl_events") as CollectionReference<DocumentData>
  );

  snap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.tailor_id === tailorId) {
      events.push({
        id: doc.id,
        order_id: data.order_id,
        event_type: data.event_type,
        description: data.description,
        timestamp:
          data.timestamp instanceof Timestamp
            ? data.timestamp.toDate()
            : new Date(data.timestamp),
        location: data.location || "",
      });
    }
  });

  return events;
}



// --- Get all orders of a specific tailor ---
export async function getAllOrdersByTailor(
	tailorId: string,
): Promise<UserOrder[]> {
	try {
		const q = query(
			collectionGroup(db, "user_orders"),
			where("tailor_id", "==", tailorId),
		);
		const querySnapshot = await getDocs(q);

		const orders: UserOrder[] = querySnapshot.docs.map((orderDoc) => {
			const data = orderDoc.data();
			// The parent document's ID in users_orders is the userId
			const userId = orderDoc.ref.parent.parent?.id || data.user_id || "";

			return {
				id: orderDoc.id,
				product_id: data.product_id,
				title: data.title,
				description: data.description,
				category: data.category || "",
				type: data.type || "",
				wear_category: data.wear_category || "",
				wear_quantity: data.wear_quantity || 0,
				price: data.price || 0,
				discount: data.discount || 0,
				customSizes: data.customSizes ?? false,
				sizes: data.sizes || [],
				images: data.images || [],
				keywords: data.keywords || [],
				tags: data.tags || [],
				tailor: data.tailor || "",
				tailor_id: data.tailor_id,
				is_verified: data.is_verified ?? false,
				user_id: userId,
				order_id: data.order_id,
				created_at:
					data.created_at instanceof Timestamp
						? data.created_at.toDate()
						: data.created_at
						? new Date(data.created_at)
						: new Date(),

				// --- Required fields ---
				order_status: data.order_status || "",
				product_order_ref: data.product_order_ref || "",
				delivery_date: data.delivery_date || "",
				delivery_type: data.delivery_type || "",
				shipping_fee: data.shipping_fee || 0,
				user_address: data.user_address || {
					first_name: "",
					last_name: "",
					street_address: "",
					flat_number: "",
					city: "",
					state: "",
					country: "",
					country_code: "",
					dial_code: "",
					post_code: "",
					phone_number: "",
				},
				quantity: data.quantity || 1,
				size: data.size || null,
				dhl_events_snapshot: data.dhl_events_snapshot || [],
			};
		});

		// Sort by created_at descending
		return orders.sort(
			(a, b) => b.created_at.getTime() - a.created_at.getTime(),
		);
	} catch (error) {
		console.error("Error fetching orders for tailor:", error);
		return [];
	}
}

// --- Update Order Status ---
export async function updateOrderStatus(
  userId: string,
  orderId: string,
  newStatus: string
): Promise<void> {
  try {
    const orderRef = doc(db, "staging_users_orders", userId, "user_orders", orderId);
    await updateDoc(orderRef, {
      order_status: newStatus,
    });
    console.log(`Order ${orderId} updated to status: ${newStatus}`);
  } catch (err) {
    console.error("Failed to update order status:", err);
    throw err;
  }
}

// --- Get all tailors with enriched data ---
export async function getTailorStats(): Promise<{
  fullPayload: {
    tailors: Tailor[];
    users: User[];
    works: TailorWork[];
    orders: UserOrder[];
  };
  enrichedTailors: Tailor[];
}> {
  const [tailorsSnap, usersSnap, worksSnap] = await Promise.all([
    getDocs(collection(db, "staging_tailors")),
    getDocs(collection(db, "staging_users")),
    getDocs(collection(db, "staging_tailor_works")),
  ]);

  const tailors: Tailor[] = tailorsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Tailor[];
  const users: User[] = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[];
  const works: TailorWork[] = worksSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as TailorWork[];

  // Fetch all orders of all tailors
  const allOrders: UserOrder[] = [];
  for (const tailor of tailors) {
    const orders = await getAllOrdersByTailor(tailor.id);
    allOrders.push(...orders);
  }

  const enrichedTailors = await Promise.all(
  tailors.map(async (tailor) => {
    const tailorUsers = users.filter((u) => u.tailorId === tailor.id);
    const tailorProducts = works.filter((w) => w.tailor_id === tailor.id);
    const tailorOrders = allOrders.filter((o) => o.tailor_id === tailor.id);
    const dhlEvents = await getDhlEventsByTailor(tailor.id);

    return {
      ...tailor,
      totalUsers: tailorUsers.length,
      totalProducts: tailorProducts.length,
      totalOrders: tailorOrders.length,
      users: tailorUsers,
      products: tailorProducts,
      orders: tailorOrders,
      dhlEvents, // ✅ added here
    };
  })
);

  return {
    fullPayload: {
      tailors,
      users,
      works,
      orders: allOrders,
    },
    enrichedTailors,
  };
}

// --- Get single tailor by ID ---
export async function getTailorById(tailorId: string) {
  const tailorDoc = await getDoc(doc(db, "staging_tailors", tailorId));
  if (!tailorDoc.exists()) throw new Error("Tailor not found");

  const tailor = { id: tailorDoc.id, ...tailorDoc.data() } as Tailor;

  const [usersSnap, worksSnap, allOrders, dhlEvents] = await Promise.all([
    getDocs(collection(db, "staging_users")),
    getDocs(collection(db, "staging_tailor_works")),
    getAllOrdersByTailor(tailor.id),
    getDhlEventsByTailor(tailor.id),
  ]);

  const users: User[] = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as User[];
  const works: TailorWork[] = worksSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as TailorWork[];

  const tailorUsers = users.filter((u) => u.tailorId === tailor.id);
  const tailorProducts = works.filter((w) => w.tailor_id === tailor.id);
  const tailorOrders = allOrders;

  return {
    ...tailor,
    totalUsers: tailorUsers.length,
    totalProducts: tailorProducts.length,
    totalOrders: tailorOrders.length,
    users: tailorUsers,
    products: tailorProducts,
    orders: tailorOrders,
    dhlEvents,
  };
}

// --- React hooks ---
export function useTailors() {
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTailors() {
      try {
        setLoading(true);
        const data = await getTailorStats();

        // ✅ Only include tailors that have a valid tailorId
        const filteredTailors = data.enrichedTailors.filter(
          (tailor: Tailor) => Boolean(tailor?.id)
        );

        setTailors(filteredTailors);
      } catch (err: any) {
        setError(err.message || "Error fetching tailors");
      } finally {
        setLoading(false);
      }
    }

    fetchTailors();
  }, []);

  return { tailors, loading, error };
}

export function useTailorById(tailorId: string) {
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTailor() {
      try {
        setLoading(true);
        const data = await getTailorById(tailorId);
        setTailor(data);
      } catch (err: any) {
        setError(err.message || "Error fetching tailor");
      } finally {
        setLoading(false);
      }
    }
    if (tailorId) fetchTailor();
  }, [tailorId]);

  return { tailor, loading, error };
}
