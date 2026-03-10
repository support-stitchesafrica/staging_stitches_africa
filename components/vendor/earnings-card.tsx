"use client"

import { Card } from "@/components/ui/card"
import { DollarSign, TrendingUp, Calendar } from "lucide-react"

interface EarningsCardProps {
  currentBalance: number
  totalEarnings: number
  lastPayoutDate?: Date
}

export function EarningsCard({ currentBalance, totalEarnings, lastPayoutDate }: EarningsCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100)
  }

  const formatDate = (date?: Date) => {
    if (!date) return "No payouts yet"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-blue-900">{formatCurrency(currentBalance)}</p>
          </div>
          <div className="p-3 bg-blue-200 rounded-lg">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600 mb-1">Total Earnings</p>
            <p className="text-3xl font-bold text-emerald-900">{formatCurrency(totalEarnings)}</p>
          </div>
          <div className="p-3 bg-emerald-200 rounded-lg">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">Last Payout</p>
            <p className="text-base font-semibold text-slate-900">{formatDate(lastPayoutDate)}</p>
          </div>
          <div className="p-3 bg-slate-200 rounded-lg">
            <Calendar className="w-6 h-6 text-slate-600" />
          </div>
        </div>
      </Card>
    </div>
  )
}
