"use client"

import { useState, useEffect } from "react";
import { auth, db } from "@/firebase"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, Plus, Wallet } from "lucide-react"
import { SubaccountManager } from "./subaccount-manager"
import { VirtualAccountManager } from "./virtual-account-manager"
import { getTailorWalletBalance } from "@/vendor-services/TailorOrders"
import { PayoutAccountsSummaryTable } from "@/components/vendor/PayoutAccountsSummaryTable"

interface VendorData
{
  first_name: string
  last_name: string
  email: string
  is_tailor: boolean
  userId: string
}

export function VendorDashboard()
{
  const [user, setUser] = useState<User | null>(null)
  const [vendorData, setVendorData] = useState<VendorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"subaccounts" | "virtual-accounts">("subaccounts")
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [loadingWallet, setLoadingWallet] = useState(false)
  /** Avoid hydration mismatch reading localStorage only after mount */
  const [storedTailorUid, setStoredTailorUid] = useState<string | null>(null)

  useEffect(() =>
  {
    setStoredTailorUid(typeof window !== "undefined" ? localStorage.getItem("tailorUID") : null)
  }, [])

  const tailorDocId = storedTailorUid ?? vendorData?.userId ?? null

  useEffect(() =>
  {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) =>
    {
      let userId: string | null = null

      if (firebaseUser)
      {
        setUser(firebaseUser)
        userId = firebaseUser.uid
        localStorage.setItem("user", JSON.stringify(firebaseUser)) // 👈 save to localStorage
      } else
      {
        // 👇 fallback: try to load from localStorage
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
        if (storedUser?.uid)
        {
          userId = storedUser.uid
        }
        setUser(null)
      }

      if (userId)
      {
        try
        {
          const userDoc = await getDoc(doc(db, "users", userId))
          if (userDoc.exists())
          {
            const userData = userDoc.data()
            if (userData.is_tailor)
            {
              setVendorData({
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: userData.email,
                is_tailor: userData.is_tailor,
                userId,
              })
            }
          }
        } catch (error)
        {
          console.error("Error fetching vendor data:", error)
        }
      } else
      {
        setVendorData(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() =>
  {
    if (!vendorData) return
    const id = storedTailorUid ?? vendorData.userId
    if (!id) return
    let cancelled = false
    ;(async () =>
    {
      setLoadingWallet(true)
      try
      {
        const balance = await getTailorWalletBalance(id)
        if (!cancelled) setWalletBalance(balance)
      } catch (e)
      {
        console.error("Vendor dashboard wallet balance:", e)
        if (!cancelled) setWalletBalance(0)
      } finally
      {
        if (!cancelled) setLoadingWallet(false)
      }
    })()
    return () =>
    {
      cancelled = true
    }
  }, [vendorData, storedTailorUid])

  if (loading)
  {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!vendorData)
  {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              Only registered vendors can access this application.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Account Management</h2>
        <p className="text-muted-foreground">Create and manage your account details</p>
      </div>

 
      <div className="flex gap-4 border-b">
        <Button
          variant={activeTab === "subaccounts" ? "default" : "ghost"}
          onClick={() => setActiveTab("subaccounts")}
          className={`flex items-center gap-2 cursor-pointer ${activeTab === "subaccounts" ? "bg-gray-900 text-white" : "bg-gray-700! hover:bg-gray-900! text-gray-50!"}`}
        >
          <Plus className="h-4 w-4" />
          Subaccounts
        </Button>
        <Button
          variant={activeTab === "virtual-accounts" ? "default" : "ghost"}
          onClick={() => setActiveTab("virtual-accounts")}
          className={`flex items-center gap-2 cursor-pointer ${activeTab === "virtual-accounts" ? "bg-gray-900 text-white" : "bg-gray-700! hover:bg-gray-900! text-gray-50!"}`}
        >
          <CreditCard className="h-4 w-4" />
          Virtual Accounts
        </Button>
      </div>

      {activeTab === "subaccounts" && <SubaccountManager vendorData={vendorData} />}
      {activeTab === "virtual-accounts" && <VirtualAccountManager vendorData={vendorData} />}
    </div>
  )
}
