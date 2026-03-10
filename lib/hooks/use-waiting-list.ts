import { useEffect, useState } from "react";
import { getAllWaitingList, type WaitingListEntry } from "@/lib/firebase/waiting-list";

export function useWaitingList() {
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWaitingList = async () => {
    setLoading(true);
    try {
      const data = await getAllWaitingList();
      setWaitingList(data);
    } catch (error) {
      console.error("Error fetching waiting list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitingList();
  }, []);

  return { waitingList, loading, refetch: fetchWaitingList };
}
