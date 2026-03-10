"use client"

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface PayoutRecord {
  id: string
  amount: number
  currency: string
  status: "pending" | "in_transit" | "paid" | "failed"
  reason: string
  createdAt: string
  stripePayoutId?: string
}

interface PayoutHistoryTableProps {
  vendorId: string
}

export function PayoutHistoryTable({ vendorId }: PayoutHistoryTableProps) {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        // This would be replaced with actual API call or real-time listener
        setPayouts([])
      } catch (error) {
        console.error("Error fetching payouts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayouts()
  }, [vendorId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200"
      case "in_transit":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ").charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Payout History</h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No payouts yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{formatDate(payout.createdAt)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(payout.amount)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payout.status)}>{getStatusLabel(payout.status)}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{payout.reason}</TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-32 truncate">
                      {payout.stripePayoutId || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Card>
  )
}
