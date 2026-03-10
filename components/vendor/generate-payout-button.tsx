"use client"

import { useState } from "react";
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Loader2, DollarSign } from "lucide-react"

interface GeneratePayoutButtonProps {
  vendorId: string
  currentBalance: number
  onPayoutGenerated?: (payoutId: string) => void
}

export function GeneratePayoutButton({ vendorId, currentBalance, onPayoutGenerated }: GeneratePayoutButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [generatedPayout, setGeneratedPayout] = useState<any>(null)

  const handleGeneratePayout = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    const amountInCents = Math.round(Number(amount) * 100)

    if (amountInCents > currentBalance) {
      toast.error(`Insufficient balance. Available: $${(currentBalance / 100).toFixed(2)}`)
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/payouts/generate-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          amount: amountInCents,
          metadata: {
            reason: "vendor_request",
            requestedBy: "vendor",
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to generate payout")
        return
      }

      setGeneratedPayout(data)
      toast.success("Payout ID generated successfully!")
      if (onPayoutGenerated) {
        onPayoutGenerated(data.payoutId)
      }
    } catch (error: any) {
      toast.error("Error generating payout")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        <DollarSign className="w-4 h-4 mr-2" />
        Request Payout
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Payout ID</DialogTitle>
            <DialogDescription>
              Request a payout to your connected Stripe account. Available balance: ${(currentBalance / 100).toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          {!generatedPayout ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Payout Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  step="0.01"
                  min="0.25"
                />
              </div>

              <Button onClick={handleGeneratePayout} disabled={loading || !amount} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Payout ID"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 mb-3">Payout Created Successfully</p>

                <div className="space-y-3">
                  <div className="bg-white rounded p-3">
                    <Label className="text-xs text-gray-600">Payout ID</Label>
                    <div className="flex items-center justify-between mt-1">
                      <code className="text-sm font-mono font-bold text-gray-900 break-all">
                        {generatedPayout.payoutId}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPayout.payoutId)
                          toast.success("Copied!")
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded p-3">
                    <Label className="text-xs text-gray-600">Amount</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      ${(generatedPayout.amount / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white rounded p-3">
                    <Label className="text-xs text-gray-600">Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full"></span>
                      <p className="text-sm font-medium text-gray-900 capitalize">{generatedPayout.status}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded p-3">
                    <Label className="text-xs text-gray-600">Arrival Date</Label>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {new Date(generatedPayout.arrivalDate * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setOpen(false)
                  setGeneratedPayout(null)
                  setAmount("")
                }}
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
