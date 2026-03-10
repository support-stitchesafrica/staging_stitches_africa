"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface RequestPayoutButtonProps {
  vendorId: string
  availableBalance: number
  disabled?: boolean
  onSuccess?: () => void
}

export function RequestPayoutButton({
  vendorId,
  availableBalance,
  disabled = false,
  onSuccess,
}: RequestPayoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleRequestPayout = async () => {
    if (availableBalance < 2500) {
      toast.error("Minimum payout amount is $25")
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/payouts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          amount: availableBalance,
          reason: "manual",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Payout requested successfully!")
        onSuccess?.()
      } else {
        toast.error(data.error || "Failed to request payout")
      }
    } catch (error: any) {
      toast.error(error.message || "Error requesting payout")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleRequestPayout}
      disabled={disabled || loading || availableBalance < 2500}
      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Processing...
        </>
      ) : (
        "Request Payout"
      )}
    </Button>
  )
}
