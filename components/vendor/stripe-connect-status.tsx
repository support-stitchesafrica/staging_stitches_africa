"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Clock } from "lucide-react"

interface StripeConnectStatusProps {
  status: "active" | "pending" | "restricted" | "not_set"
  kycVerified: boolean
  requirementsPastDue?: string[]
  requirementsCurrentlyDue?: string[]
}

export function StripeConnectStatus({
  status,
  kycVerified,
  requirementsPastDue = [],
  requirementsCurrentlyDue = [],
}: StripeConnectStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />
      case "restricted":
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 border-green-200"
      case "pending":
        return "bg-yellow-50 border-yellow-200"
      case "restricted":
        return "bg-red-50 border-red-200"
      default:
        return "bg-slate-50 border-slate-200"
    }
  }

  return (
    <Card className={`p-6 ${getStatusColor(status)}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(status)}
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Stripe Connect Status</h3>
              <p className="text-sm text-slate-600">
                {status === "active"
                  ? "Your account is fully set up"
                  : status === "pending"
                    ? "Waiting for verification"
                    : status === "restricted"
                      ? "Your account has restrictions"
                      : "Account not connected"}
              </p>
            </div>
          </div>
          <Badge
            className={
              status === "active"
                ? "bg-green-100 text-green-800"
                : status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }
          >
            {status}
          </Badge>
        </div>

        {kycVerified && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Your KYC verification has been approved</AlertDescription>
          </Alert>
        )}

        {requirementsPastDue.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <span className="font-semibold">Action Required:</span>
              <ul className="mt-2 ml-4 list-disc">
                {requirementsPastDue.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {requirementsCurrentlyDue.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <span className="font-semibold">Please provide:</span>
              <ul className="mt-2 ml-4 list-disc">
                {requirementsCurrentlyDue.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  )
}
