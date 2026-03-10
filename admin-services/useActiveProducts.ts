// services/useActiveProducts.ts
import { useEffect, useState } from "react";
import { getActiveTailorWorksCount } from "./getTailorWorks";

export function useActiveProducts() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const total = await getActiveTailorWorksCount();
      setCount(total);
    };
    fetchData();
  }, []);

  return count;
}
