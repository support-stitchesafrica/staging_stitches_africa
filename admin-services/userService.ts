// services/userService.ts
import { DhlShipment, FirestoreTimestamp, UserAddress } from "@/components/vendor/orders-tab";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

export interface User {
  id: string;
  tailorId?: string;
  first_name: string;
  last_name: string;
  email: string;
  createdAt: string;
  is_general_admin?: boolean;
  is_sub_tailor?: boolean;
  is_tailor?: boolean;
}

export interface UserOrder {
  delivery_date: string;
  delivery_type: string;
  dhl_shipment: DhlShipment;
  id: string;
  images: string[];
  order_id: string;
  order_status: string;
  price: number;
  product_id: string;
  product_order_ref: string;
  quantity: number;
  shipping_fee: number;
  size: string | null;
  tailor_id: string;
  tailor_name: string;
  timestamp: FirestoreTimestamp;
  title: string;
  user_address: UserAddress;
  user_id: string;
  wear_category: string;
}

/** 1. Get all users with is_general_admin, is_sub_tailor, and is_tailor = false */
export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, "staging_users");

  // ✅ Use Firestore where clauses to filter boolean fields
  const q = query(
    usersRef,
    where("is_general_admin", "==", false),
    where("is_sub_tailor", "==", false),
    where("is_tailor", "==", false)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as User[];
};

/** 2. Get user by ID */
export const getUserById = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, "staging_users", userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as User;
};

/** 3. Get all orders for a specific userId */
export const getOrdersByUserId = async (userId: string): Promise<UserOrder[]> => {
  const ordersRef = collection(db, "staging_all_orders");

  const q = query(ordersRef, where("user_id", "==", userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as UserOrder[];
};

/** 4. Get orders for a user by verifying they exist in "users" first */
export const getVerifiedOrdersByUserId = async (userId: string): Promise<UserOrder[]> => {
  const user = await getUserById(userId);
  if (!user) {
    console.warn(`User with ID ${userId} not found.`);
    return [];
  }

  return await getOrdersByUserId(user.id);
};
