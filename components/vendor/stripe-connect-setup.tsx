"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react"

interface StripeConnectSetupProps {
  vendorId: string
  email: string
  businessName: string
  onSuccess?: () => void
}

export function StripeConnectSetup({ vendorId, email, businessName, onSuccess }: StripeConnectSetupProps) {
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [status, setStatus] = useState<"idle" | "connecting" | "pending" | "active" | "error">("idle")
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  // Check current status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/vendors/stripe-connect/status?vendorId=${vendorId}`)
        const data = await res.json()

        if (data.stripeConnectId) {
          setStripeConnectId(data.stripeConnectId)
          setStatus(data.status || "pending")
        }
      } catch (error) {
        console.error("Error checking status:", error)
      }
    }

    checkStatus()
  }, [vendorId])

  const handleConnectStripe = async () => {
    try {
      setLoading(true)
      setErrorMessage("")

      const res = await fetch("/api/vendors/stripe-connect/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          email,
          businessName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to create Stripe Connect account")
        setStatus("error")
        return
      }

      setStripeConnectId(data.stripeConnectId)
      setStatus("connecting")

      // Redirect to Stripe onboarding
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl
      }
    } catch (error: any) {
      setErrorMessage(error.message || "An error occurred")
      setStatus("error")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAccount = async () => {
    if (!stripeConnectId) return

    try {
      setVerifying(true)
      setErrorMessage("")

      const res = await fetch("/api/vendors/stripe-connect/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          stripeConnectId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to verify account")
        return
      }

      setStatus(data.accountStatus)

      if (data.accountStatus === "active" && onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      setErrorMessage(error.message || "An error occurred")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Connect Stripe Account
          {status === "active" && <CheckCircle2 className="w-5 h-5 text-green-600" />}
        </CardTitle>
        <CardDescription>
          Connect your Stripe account to receive automatic payouts when orders are delivered
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Alert */}
        {status === "idle" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>You haven't connected a Stripe account yet. Click below to get started.</AlertDescription>
          </Alert>
        )}

        {status === "error" && errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {status === "active" && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your Stripe account is connected and ready to receive payouts!
            </AlertDescription>
          </Alert>
        )}

        {status === "pending" && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Your account setup is almost complete. Verify your account status to activate payouts.
            </AlertDescription>
          </Alert>
        )}

        {/* Setup Steps */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Setup Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Click "Connect to Stripe" to create your account</li>
              <li>Complete the Stripe onboarding form with your business details</li>
              <li>Return here and verify your account status</li>
              <li>Start receiving automatic payouts!</li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status === "idle" && (
            <Button onClick={handleConnectStripe} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect to Stripe
                </>
              )}
            </Button>
          )}

          {status === "pending" && (
            <Button onClick={handleVerifyAccount} disabled={verifying} className="w-full">
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Account Status"
              )}
            </Button>
          )}

          {status === "connecting" && (
            <Button disabled className="w-full bg-transparent" variant="outline">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait, redirecting...
            </Button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          <p className="font-semibold mb-2">What happens next?</p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>When your order is delivered via DHL, we automatically process your payout</li>
            <li>Funds are transferred to your connected Stripe account</li>
            <li>You can withdraw to your bank account anytime</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
