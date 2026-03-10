import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore"
import { AdminDashboardStats } from "@/types/dashboard"
import { db } from "@/firebase"

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  const [tailorsSnap, worksSnap, activitiesSnap] = await Promise.all([
    getDocs(collection(db, "staging_tailors")),
    getDocs(collection(db, "staging_tailor_works")),
    getDocs(collection(db, "activity_logs"))
  ])

  // 👔 Tailors
  let active = 0
  let disabled = 0
  let walletBalance = 0

  tailorsSnap.forEach(doc => {
    const t = doc.data()
    if (t.is_disabled) disabled++
    else active++

    walletBalance += Number(t.wallet || 0)
  })

  // 🧵 Works
  let verified = 0
  let pending = 0
  let totalRevenue = 0

  worksSnap.forEach(doc => {
    const w = doc.data()
    if (w.status === "verified") verified++
    if (w.status === "pending") pending++
    totalRevenue += Number(w.price?.base || 0)
  })

  return {
    tailors: {
      total: tailorsSnap.size,
      active,
      disabled
    },
    works: {
      total: worksSnap.size,
      verified,
      pending
    },
    finance: {
      totalRevenue,
      walletBalance
    },
    activityCount: activitiesSnap.size
  }
}
