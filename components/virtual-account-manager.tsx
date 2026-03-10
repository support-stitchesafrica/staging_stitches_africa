"use client"

import type React from "react"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, CreditCard, Eye, EyeOff, Copy, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VendorData {
  first_name: string
  last_name: string
  email: string
  is_tailor: boolean
  userId: string
}

interface VirtualAccount {
  id: string
  account_number: string
  account_reference: string
  bank_name: string
  created_at: string
  currency: string
  order_ref: string
  type: string
  balance?: number
}

export function VirtualAccountManager({ vendorData }: { vendorData: VendorData }) {
  // ✅ derive userId from localStorage as fallback
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
  const userId = storedUser?.uid || vendorData.userId

  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [showBalances, setShowBalances] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (userId) {
      fetchVirtualAccounts()
    }
  }, [userId])

  const fetchVirtualAccounts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/flutterwave/virtual-accounts", {
        method: "GET",
        headers: {
          "user-id": userId,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setVirtualAccounts(data.virtualAccounts || [])
      }
    } catch (error) {
      console.error("Error fetching virtual accounts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVirtualAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)

    const formData = new FormData(e.currentTarget)
    const accountData = {
      email: formData.get("email") as string,
      is_permanent: true,
      bvn: formData.get("bvn") as string,
      tx_ref: `VA_${Date.now()}_${userId}`,
      firstname: formData.get("firstname") as string,
      lastname: formData.get("lastname") as string,
      narration: formData.get("narration") as string,
    }

    try {
      const response = await fetch("/api/flutterwave/virtual-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": userId,
        },
        body: JSON.stringify(accountData),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Virtual account created successfully",
        })
        setShowForm(false)
        fetchVirtualAccounts()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create virtual account",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create virtual account",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const fetchBalance = async (accountId: string) => {
    try {
      const response = await fetch(`/api/flutterwave/virtual-accounts/${accountId}/balance`, {
        headers: {
          "user-id": userId,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBalances((prev) => ({ ...prev, [accountId]: data.balance }))
      }
    } catch (error) {
      console.error("Error fetching balance:", error)
    }
  }

  const toggleBalance = async (accountId: string) => {
    const isShowing = showBalances[accountId]

    if (!isShowing) {
      await fetchBalance(accountId)
    }

    setShowBalances((prev) => ({ ...prev, [accountId]: !isShowing }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Account number copied to clipboard",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Virtual Account Management</h2>
          <p className="text-muted-foreground">Create and manage your virtual accounts for receiving payments</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Virtual Account
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Virtual Account</CardTitle>
            <CardDescription>Fill in the details to create a new virtual account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateVirtualAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstname">First Name</Label>
                  <Input id="firstname" name="firstname" defaultValue={vendorData.first_name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastname">Last Name</Label>
                  <Input id="lastname" name="lastname" defaultValue={vendorData.last_name} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={vendorData.email} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bvn">BVN (Bank Verification Number)</Label>
                <Input id="bvn" name="bvn" placeholder="12345678901" maxLength={11} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="narration">Account Description</Label>
                <Input id="narration" name="narration" placeholder="Business payments account" required />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Virtual Account
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {virtualAccounts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No virtual accounts found. Create your first virtual account to start receiving payments.
                </p>
              </CardContent>
            </Card>
          ) : (
            virtualAccounts.map((account) => (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {account.bank_name}
                    </CardTitle>
                    <Badge variant="default">{account.currency}</Badge>
                  </div>
                  <CardDescription>Reference: {account.account_reference}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Account Number</p>
                        <p className="text-lg font-mono">{account.account_number}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(account.account_number)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Balance:</span>
                        {showBalances[account.id] ? (
                          <span className="text-lg font-mono">${balances[account.id]?.toLocaleString() || "0.00"}</span>
                        ) : (
                          <span className="text-lg">••••••</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleBalance(account.id)}>
                          {showBalances[account.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => fetchBalance(account.id)}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(account.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
