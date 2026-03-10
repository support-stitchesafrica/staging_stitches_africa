// app/vendor/settings/VendorStripeDashboard.tsx
"use client"

import { useState, useEffect } from "react";
import { EarningsCard } from "./earnings-card"
import { PayoutHistoryTable } from "./payout-history-table"
import { RequestPayoutButton } from "./request-payout-button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Eye } from "lucide-react"
import { StripeConnectButton } from "./stripe-connect-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface VendorData {
  id: string
  name: string
  email: string
  stripeConnectId: string
  stripeAccountStatus: string
  currentBalance: number
  totalEarnings: number
  lastPayoutDate?: Date
  kyc?: {
    verified: boolean
  }
}

export default function VendorStripeDashboard() {
  const [vendor, setVendor] = useState<VendorData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Example mock vendor (replace with API later)
    const mockVendor: VendorData = {
      id: "vendor-123",
      name: "Stitches Africa",
      email: "vendor@stitchesafrica.com",
      stripeConnectId: "acct_1234567890",
      stripeAccountStatus: "active",
      currentBalance: 125000,
      totalEarnings: 500000,
      lastPayoutDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      kyc: { verified: true },
    }
    setVendor(mockVendor)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Unable to load vendor information
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const isReadyForPayout =
    vendor.stripeAccountStatus === "active" && vendor.kyc?.verified

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Payout Dashboard</h1>
          <p className="text-lg text-slate-600">Welcome back, {vendor.name}</p>
        </div>

        {/* Alerts */}
        {vendor.stripeAccountStatus !== "active" && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Your Stripe account is not fully set up. Complete verification to enable payouts.
            </AlertDescription>
          </Alert>
        )}

        {!vendor.kyc?.verified && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              KYC verification is pending. Your account will be reviewed within 24 hours.
            </AlertDescription>
          </Alert>
        )}

        {/* Stripe Connect Section */}
        {vendor.stripeAccountStatus !== "active" && (
          <Card className="p-6 border-2 border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">
                  Connect Your Stripe Account
                </h2>
                <p className="text-slate-600 text-sm">
                  Connect your Stripe account to start receiving automatic payouts when deliveries are completed.
                </p>
              </div>
              <StripeConnectButton
                vendorId={vendor.id}
                isConnected={vendor.stripeAccountStatus === "active"}
                onSuccess={() => {
                  // Refresh vendor data
                }}
              />
            </div>
          </Card>
        )}

        {/* Earnings */}
        <EarningsCard
          currentBalance={vendor.currentBalance}
          totalEarnings={vendor.totalEarnings}
          lastPayoutDate={vendor.lastPayoutDate}
        />

        {/* Request Payout */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">
                Request Payout
              </h2>
              <p className="text-slate-600 text-sm">
                {isReadyForPayout
                  ? "Your account is ready for payouts"
                  : "Complete verification to request payouts"}
              </p>
            </div>
            <RequestPayoutButton
              vendorId={vendor.id}
              availableBalance={vendor.currentBalance}
              disabled={!isReadyForPayout}
              onSuccess={() => {
                // Refresh data
              }}
            />
          </div>
        </Card>

        {/* Payout History */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">
            Payout History
          </h2>
          <Link href="/vendor/payouts">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View All Payouts
            </Button>
          </Link>
        </div>

        <PayoutHistoryTable vendorId={vendor.id} />
      </div>
    </div>
  )
}
