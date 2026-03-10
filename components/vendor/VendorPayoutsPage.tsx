"use client"

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Filter, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PayoutRecord {
  id: string
  amount: number
  currency: string
  status: "pending" | "in_transit" | "paid" | "failed"
  reason: string
  createdAt: string
  stripePayoutId?: string
  dhlTrackingId?: string
}

export default function VendorPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchPayouts()
  }, [filter])

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== "all") params.append("status", filter)

      const response = await fetch(`/api/vendors/payouts?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setPayouts(data.payouts)
      } else {
        toast.error(data.error || "Failed to fetch payouts")
      }
    } catch (error) {
      console.error("Error fetching payouts:", error)
      toast.error("Failed to load payout history")
    } finally {
      setLoading(false)
    }
  }

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

  const filteredPayouts = payouts.filter(
    (p) =>
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.stripePayoutId?.toLowerCase().includes(search.toLowerCase()) ||
      p.reason.toLowerCase().includes(search.toLowerCase()),
  )

  const stats = {
    totalPayouts: payouts.length,
    totalPaid: payouts.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0),
    pending: payouts.filter((p) => p.status === "pending").length,
    inTransit: payouts.filter((p) => p.status === "in_transit").length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Link href="/vendor/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-slate-900">Payout History</h1>
            <p className="text-lg text-slate-600">View all your payouts and track payments</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-slate-600 mb-1">Total Payouts</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalPayouts}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-600 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-600 mb-1">In Transit</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inTransit}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by payout ID, Stripe ID, or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-lg">No payouts found</p>
              <p className="text-slate-400 text-sm mt-1">Your payout history will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-slate-200">
                    <TableHead className="font-semibold text-slate-900">Date</TableHead>
                    <TableHead className="font-semibold text-slate-900">Amount</TableHead>
                    <TableHead className="font-semibold text-slate-900">Status</TableHead>
                    <TableHead className="font-semibold text-slate-900">Reason</TableHead>
                    <TableHead className="font-semibold text-slate-900">Stripe Payout ID</TableHead>
                    <TableHead className="font-semibold text-slate-900">DHL Tracking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((payout) => (
                    <TableRow key={payout.id} className="hover:bg-slate-50 transition">
                      <TableCell className="font-medium text-slate-900">{formatDate(payout.createdAt)}</TableCell>
                      <TableCell className="font-semibold text-slate-900">{formatCurrency(payout.amount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payout.status)}>
                          {payout.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-slate-700">{payout.reason}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 max-w-40 truncate block">
                          {payout.stripePayoutId ? payout.stripePayoutId.substring(0, 20) + "..." : "—"}
                        </code>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {payout.dhlTrackingId ? (
                          <span className="text-blue-600 font-medium">{payout.dhlTrackingId}</span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
