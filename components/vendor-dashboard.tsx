"use client"

import { useState, useEffect } from "react";
import { auth, db } from "@/firebase"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Store, CreditCard, Plus } from "lucide-react"
import { SubaccountManager } from "./subaccount-manager"
import { VirtualAccountManager } from "./virtual-account-manager"

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
          const userDoc = await getDoc(doc(db, "staging_users", userId))
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
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Subaccounts
        </Button>
        <Button
          variant={activeTab === "virtual-accounts" ? "default" : "ghost"}
          onClick={() => setActiveTab("virtual-accounts")}
          className="flex items-center gap-2"
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
