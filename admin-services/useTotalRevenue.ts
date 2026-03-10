// hooks/useTotalRevenue.ts
import { useEffect, useState } from "react";
import { collectionGroup, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../firebase"; 
import type { UserOrder } from "@/admin-services/userOrder";

export const useTotalRevenue = () => {
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [totalQuantity, setTotalQuantity] = useState<number>(0);

  useEffect(() => {
    const fetchAndSum = async () => {
      try {
        const snapshot = await getDocs(collectionGroup(db, "staging_all_orders"));
        let revenueSum = 0;
        let orderCount = 0;
        let quantitySum = 0;

        snapshot.forEach((doc: QueryDocumentSnapshot) => {
          const data = doc.data();
          
          const price = Number(data.price);
          if (!isNaN(price)) {
            revenueSum += price;
          }

          const quantity = Number(data.quantity);
          if (!isNaN(quantity)) {
            quantitySum += quantity;
          }

          orderCount++;
        });

        setTotalRevenue(revenueSum);
        setTotalOrders(orderCount);
        setTotalQuantity(quantitySum);
      } catch (err) {
        console.error("Failed fetching user_orders:", err);
      }
    };

    fetchAndSum();
  }, []);

  return { totalRevenue, totalOrders, totalQuantity };
};
