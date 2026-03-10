// hooks/useMonthlyCustomerRegistrations.ts
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase"; // adjust if needed

export const useMonthlyCustomerRegistrations = () => {
  const [monthlyRegistrations, setMonthlyRegistrations] = useState<number>(0);

  useEffect(() => {
    const fetchMonthlyRegistrations = async () => {
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startTimestamp = Timestamp.fromDate(startOfMonth);

        const userQuery = query(
          collection(db, "staging_users"),
          where("createdAt", ">=", startTimestamp)
        );
        const tailorQuery = query(
          collection(db, "staging_tailors"),
          where("createdAt", ">=", startTimestamp)
        );

        const [userSnap, tailorSnap] = await Promise.all([
          getDocs(userQuery),
          getDocs(tailorQuery),
        ]);

        const total = userSnap.size + tailorSnap.size;
        setMonthlyRegistrations(total);
      } catch (error) {
        console.error("Error fetching monthly registrations:", error);
      }
    };

    fetchMonthlyRegistrations();
  }, []);

  return monthlyRegistrations;
};
