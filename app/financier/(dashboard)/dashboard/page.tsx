"use client";

import Link from "next/link";
import { DollarSign, FileText, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";

// Dummy data
const stats = [
	{
		icon: DollarSign,
		label: "Total Funded",
		value: "₦24.8M",
		change: "+₦450K this month",
		changeType: "positive" as const,
	},
	{
		icon: FileText,
		label: "Active Loans",
		value: "312",
		change: "₦8.7M outstanding",
		changeType: "neutral" as const,
	},
	{
		icon: TrendingUp,
		label: "Repayment Rate",
		value: "95.8%",
		change: "+1.2% improvement",
		changeType: "positive" as const,
	},
	{
		icon: AlertTriangle,
		label: "Default Rate",
		value: "1.2%",
		change: "-0.3% improvement",
		changeType: "positive" as const,
	},
];

const quickActions = [
	{
		title: "Pending Requests",
		count: 5,
		description: "Awaiting approval",
		href: "/financier/dashboard/requests",
		urgent: true,
	},
	{
		title: "Overdue Loans",
		count: 3,
		description: "Requiring attention",
		href: "/financier/dashboard/overdue",
		urgent: true,
	},
	{
		title: "Subsidy Budget",
		count: "31%",
		description: "₦3.1M / ₦10M used",
		href: "/financier/dashboard/subsidy",
		urgent: false,
	},
];

const recentActivity = [
	{
		type: "new_request",
		title: "New financing request submitted",
		description: "Request #FR-12458 - ₦95,000 - John Doe",
		time: "5 mins ago",
	},
	{
		type: "payment",
		title: "Payment received",
		description: "Loan #LN-2341 - ₦15,000 - Sarah Johnson",
		time: "25 mins ago",
	},
	{
		type: "approved",
		title: "Financing request approved",
		description: "Request #FR-12456 - ₦85,000",
		time: "1 hour ago",
	},
	{
		type: "payment",
		title: "Payment received",
		description: "Loan #LN-8923 - ₦20,000 - Michael Chen",
		time: "2 hours ago",
	},
];

export default function FinancierDashboardPage() {
	return (
		<div className="space-y-8">
			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{stats.map((stat, index) => {
					const Icon = stat.icon;
					return (
						<div
							key={index}
							className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
						>
							<div className="flex items-start justify-between mb-4">
								<div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
									<Icon className="w-6 h-6 text-blue-600" strokeWidth={2.5} />
								</div>
							</div>
							<p className="text-3xl font-bold text-gray-900 mb-1">
								{stat.value}
							</p>
							<p className="text-sm font-medium text-gray-600 mb-2">{stat.label}</p>
							<p className={`text-xs font-medium ${stat.changeType === "positive" ? "text-green-600" : "text-gray-500"}`}>
								{stat.change}
							</p>
						</div>
					);
				})}
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{quickActions.map((action, index) => (
					<div
						key={index}
						className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
					>
						<div className="flex items-start justify-between mb-4">
							<div>
								<h3 className="text-lg font-bold text-gray-900 mb-1">{action.title}</h3>
								<p className="text-sm text-gray-500">{action.description}</p>
							</div>
							<div className={`text-3xl font-bold ${action.urgent ? "text-orange-600" : "text-blue-600"}`}>
								{action.count}
							</div>
						</div>
						<Link
							href={action.href}
							className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
						>
							<span>View Details</span>
							<ArrowRight className="w-4 h-4" strokeWidth={2.5} />
						</Link>
					</div>
				))}
			</div>

			{/* Recent Activity */}
			<div className="bg-white rounded-xl border border-gray-200 p-6">
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
					<Link
						href="/financier/dashboard/analytics"
						className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
					>
						View All
						<ArrowRight className="w-4 h-4" strokeWidth={2.5} />
					</Link>
				</div>
				<div className="space-y-3">
					{recentActivity.map((activity, index) => (
						<div
							key={index}
							className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
						>
							<div className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0"></div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold text-gray-900 mb-0.5">
									{activity.title}
								</p>
								<p className="text-sm text-gray-600">{activity.description}</p>
							</div>
							<span className="text-xs font-medium text-gray-500 whitespace-nowrap">
								{activity.time}
							</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
