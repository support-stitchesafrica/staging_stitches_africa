export interface Vendor {
  id: string
  email: string
  name: string
  stripeConnectId: string
  stripeAccountStatus: "active" | "pending" | "restricted" | "not_set"
  paymentMethodId?: string
  bankDetails?: {
    accountHolder: string
    accountNumber: string
    routingNumber: string
  }
  kyc?: {
    verified: boolean
    documentType: string
    verificationDate: Date
  }
  createdAt: Date
  updatedAt: Date
  lastPayoutDate?: Date
  totalEarnings: number
  currentBalance: number
}

export interface Payout {
  id: string
  vendorId: string
  amount: number // in cents
  currency: string
  status: "pending" | "in_transit" | "paid" | "failed"
  stripePayoutId?: string
  reason: "automatic" | "manual" | "refund"
  errorMessage?: string
  createdAt: Date
  processedAt?: Date
}

export interface PayoutSchedule {
  id: string
  vendorId: string
  frequency: "daily" | "weekly" | "monthly" | "manual"
  dayOfWeek?: number
  dayOfMonth?: number
  minBalance: number
  autoRetry: boolean
  maxRetries: number
  createdAt: Date
  updatedAt: Date
}
