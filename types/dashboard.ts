export interface TailorStats {
  total: number
  active: number
  disabled: number
}

export interface WorkStats {
  total: number
  verified: number
  pending: number
}

export interface FinanceStats {
  totalRevenue: number
  walletBalance: number
}

export interface AdminDashboardStats {
  tailors: TailorStats
  works: WorkStats
  finance: FinanceStats
  activityCount: number
}
