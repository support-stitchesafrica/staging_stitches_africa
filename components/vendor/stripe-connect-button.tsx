"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Link2 } from "lucide-react"

interface StripeConnectButtonProps {
  vendorId: string
  isConnected?: boolean
  onSuccess?: () => void
}

export function StripeConnectButton({ vendorId, isConnected = false, onSuccess }: StripeConnectButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/vendors/stripe-connect/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId }),
      })

      const data = await response.json()

      if (data.success && data.connectUrl) {
        window.location.href = data.connectUrl
      } else {
        toast.error(data.error || "Failed to initiate Stripe Connect")
      }
    } catch (error: any) {
      toast.error(error.message || "Error connecting to Stripe")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={loading || isConnected}
      className={
        isConnected
          ? "bg-green-500 hover:bg-green-600"
          : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
      }
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Connecting...
        </>
      ) : isConnected ? (
        <>
          <Link2 className="w-4 h-4 mr-2" />
          Connected
        </>
      ) : (
        <>
          <Link2 className="w-4 h-4 mr-2" />
          Connect Stripe Account
        </>
      )}
    </Button>
  )
}
