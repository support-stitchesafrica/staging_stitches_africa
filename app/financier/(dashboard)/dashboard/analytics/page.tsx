"use client";

import { Download } from "lucide-react";

const repaymentPerformance = [
	{ label: "On-Time Payments", percentage: 95.8, color: "bg-green-500" },
	{ label: "Late Payments", percentage: 3.0, color: "bg-orange-500" },
	{ label: "Defaults", percentage: 1.2, color: "bg-red-500" },
];

const financialSummary = [
	{
		label: "Revenue (Interest)",
		amount: "450K",
	},
	{
		label: "Subsidy Provided",
		amount: "3.1M",
	},
	{
		label: "Employees Benefited",
		amount: "310",
	},
];

const loanDistribution = [
	{
		plan: "3-Month Standard (0%)",
		loans: 89,
		percentage: 29,
	},
	{
		plan: "6-Month Premium (5%)",
		loans: 145,
		percentage: 46,
	},
	{
		plan: "9-Month Extended (10%)",
		loans: 52,
		percentage: 17,
	},
	{
		plan: "12-Month Long-Term (15%)",
		loans: 26,
		percentage: 8,
	},
];

export default function AnalyticsPage() {
	return (
		<div className="space-y-6">
			{/* Performance Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="bg-white rounded-xl border border-gray-200 p-6">
					<h4 className="text-lg font-bold text-gray-900 mb-6">
						Repayment Performance
					</h4>
					<div className="space-y-5">
						{repaymentPerformance.map((item, index) => (
							<div key={index}>
								<div className="flex justify-between items-center mb-2">
									<span className="text-sm font-medium text-gray-700">{item.label}</span>
									<span className="text-sm font-bold text-gray-900">
										{item.percentage}%
									</span>
								</div>
								<div className="w-full bg-gray-100 rounded-full h-2.5">
									<div
										className={`${item.color} h-2.5 rounded-full transition-all`}
										style={{ width: `${item.percentage}%` }}
									></div>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="bg-white rounded-xl border border-gray-200 p-6">
					<h4 className="text-lg font-bold text-gray-900 mb-6">
						Financial Summary
					</h4>
					<div className="space-y-4">
						{financialSummary.map((item, index) => (
							<div
								key={index}
								className="flex justify-between items-center p-4 bg-gray-50 rounded-xl"
							>
								<span className="text-sm font-medium text-gray-700">
									{item.label}
								</span>
								<span className="text-xl font-bold text-gray-900">
									₦{item.amount}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Loan Distribution */}
			<div className="bg-white rounded-xl border border-gray-200 p-6">
				<div className="flex justify-between items-center mb-6">
					<h4 className="text-lg font-bold text-gray-900">
						Loan Distribution by Plan
					</h4>
					<button className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors">
						<Download className="w-4 h-4" strokeWidth={2.5} />
						<span>Download Report</span>
					</button>
				</div>
				<div className="space-y-4">
					{loanDistribution.map((item, index) => (
						<div key={index}>
							<div className="flex justify-between items-center mb-2">
								<span className="text-sm font-medium text-gray-700">
									{item.plan}
								</span>
								<span className="text-sm font-bold text-gray-900">
									{item.loans} loans ({item.percentage}%)
								</span>
							</div>
							<div className="w-full bg-gray-100 rounded-full h-3">
								<div
									className="bg-blue-600 h-3 rounded-full transition-all"
									style={{ width: `${item.percentage}%` }}
								></div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
