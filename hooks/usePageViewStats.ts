"use client"

import { useEffect, useState } from "react";
import { getPageViewStats, PageViewStats } from "@/lib/firebase/pageViewsService"

export function usePageViewStats() {
  const [stats, setStats] = useState<PageViewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getPageViewStats()
        setStats(data)
      } catch (error) {
        console.error("Error fetching page view stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return { stats, loading }
}
