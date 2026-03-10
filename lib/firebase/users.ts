// lib/firebase/users.ts
import { collection, getDocs } from "firebase/firestore";
import { db } from "./config"; // make sure this points to your Firebase instance

export interface User {
  is_tailor: boolean;
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt?: any;
}

export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, "staging_users");
  const snapshot = await getDocs(usersRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as User[];
};
