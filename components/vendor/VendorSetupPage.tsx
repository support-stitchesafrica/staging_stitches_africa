"use client"

import { useSearchParams } from "next/navigation"
import { StripeConnectSetup } from "./stripe-connect-setup"
import { Card, CardContent } from "@/components/ui/card"

export default function VendorSetupPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const status = searchParams.get("status")

  // Mock vendor data - in real app, fetch from auth/user context
  const vendorId = "vendor-123"
  const email = "vendor@example.com"
  const businessName = "Your Business"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Complete Your Setup</h1>
          <p className="text-slate-400">Connect your Stripe account to start receiving automatic payouts</p>
        </div>

        {status === "complete" && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <h3 className="font-semibold text-green-900">Setup Complete!</h3>
                  <p className="text-sm text-green-800 mt-1">
                    Your Stripe account has been successfully connected. You're ready to receive payouts!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <StripeConnectSetup
          vendorId={vendorId}
          email={email}
          businessName={businessName}
          onSuccess={() => {
            // Redirect to dashboard after successful setup
            setTimeout(() => {
              window.location.href = "/vendor/dashboard"
            }, 2000)
          }}
        />
      </div>
    </div>
  )
}
