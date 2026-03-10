"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, AlertCircle, ExternalLink } from "lucide-react"

interface StripeSetupFormProps {
  vendorId: string
  email: string
  businessName: string
  onSuccess?: (data: any) => void
}

export function StripeSetupForm({ vendorId, email, businessName, onSuccess }: StripeSetupFormProps) {
  const [loading, setLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [accountLink, setAccountLink] = useState<string | null>(null)

  const handleStartSetup = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/vendors/create-connect-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          email,
          businessName,
          country: "US",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAccountLink(data.accountLink)
        toast.success("Stripe Connect account created!")
      } else {
        toast.error(data.error || "Failed to create account")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Connect Stripe Account</h3>
          <p className="text-sm text-slate-600">Complete your Stripe Connect setup to receive payouts</p>
        </div>

        {accountLink ? (
          <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Complete your onboarding</p>
                <p className="text-xs text-blue-700 mt-1">
                  You'll be redirected to Stripe to verify your identity and bank details.
                </p>
              </div>
            </div>
            <a
              href={accountLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              Go to Stripe <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <Button onClick={handleStartSetup} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Setting up...
              </>
            ) : (
              "Start Stripe Setup"
            )}
          </Button>
        )}
      </div>
    </Card>
  )
}
