// hooks/useTotalCustomers.ts
import { useEffect, useState } from "react";
import { collection, getCountFromServer, getFirestore } from "firebase/firestore";
import { db } from "../firebase"; // update the path if needed

export const useTotalCustomers = () => {
  const [totalCustomers, setTotalCustomers] = useState<number>(0);

  useEffect(() => {
    const fetchCustomerCounts = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, "staging_users"));
        const tailorsSnap = await getCountFromServer(collection(db, "staging_tailors"));

        const total = usersSnap.data().count + tailorsSnap.data().count;
        setTotalCustomers(total);
      } catch (error) {
        console.error("Error fetching customer counts:", error);
      }
    };

    fetchCustomerCounts();
  }, []);

  return totalCustomers;
};

export async function getTailorsCount(): Promise<number> {
  const db = getFirestore();
  const tailorsRef = collection(db, "staging_tailors");

  try {
    const snapshot = await getCountFromServer(tailorsRef);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error fetching tailors count:", error);
    throw error;
  }
}
