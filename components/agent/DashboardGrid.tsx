import MetricCard from "./MetricCard"
import { AdminDashboardStats } from "@/types/dashboard"

interface Props {
  stats: AdminDashboardStats
}

const DashboardGrid: React.FC<Props> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard title="Total Tailors" value={stats.tailors.total} />
      <MetricCard title="Active Tailors" value={stats.tailors.active} />
      <MetricCard title="Disabled Tailors" value={stats.tailors.disabled} />

      <MetricCard title="Total Works" value={stats.works.total} />
      <MetricCard title="Verified Works" value={stats.works.verified} />
      <MetricCard title="Pending Works" value={stats.works.pending} />

      <MetricCard
        title="Total Revenue"
        value={`₦${stats.finance.totalRevenue.toLocaleString()}`}
      />
      <MetricCard
        title="Wallet Balance"
        value={`₦${stats.finance.walletBalance.toLocaleString()}`}
      />

      <MetricCard title="Activities Logged" value={stats.activityCount} />
    </div>
  )
}

export default DashboardGrid
