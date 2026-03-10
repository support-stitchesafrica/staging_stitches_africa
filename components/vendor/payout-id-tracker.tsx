"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, CheckCircle, AlertCircle, Copy } from "lucide-react"
import { toast } from "sonner"

interface PayoutRecord {
  payoutId: string
  amount: number
  status: string
  arrivalDate: number
  createdAt: any
}

export function PayoutIdTracker({ vendorId }: { vendorId: string }) {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const response = await fetch(`/api/payouts/get-status?vendorId=${vendorId}`)
        const data = await response.json()

        if (data.success) {
          setPayouts(data.payouts.reverse())
        }
      } catch (error) {
        console.error("Error fetching payouts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayouts()
  }, [vendorId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "in_transit":
        return <Clock className="w-4 h-4 text-blue-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "in_transit":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (payouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>No payouts yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payout IDs</CardTitle>
        <CardDescription>Track your payout requests</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {payouts.map((payout) => (
          <div
            key={payout.payoutId}
            className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 transition"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(payout.status)}
                <code className="text-sm font-mono font-bold text-gray-900">{payout.payoutId}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(payout.payoutId)
                    toast.success("Copied!")
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                ${(payout.amount / 100).toFixed(2)} • {new Date(payout.createdAt.seconds * 1000).toLocaleDateString()}
              </p>
            </div>
            <Badge className={`${getStatusColor(payout.status)} border-0`}>{payout.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
