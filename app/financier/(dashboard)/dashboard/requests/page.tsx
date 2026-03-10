"use client";

import { Info } from "lucide-react";

const requests = [
	{
		id: "FR-12458",
		status: "pending",
		user: {
			name: "John Doe",
			email: "jdoe@shell.com",
			staffId: "SHL-8821",
			verified: true,
		},
		creditScore: 780,
		riskLevel: "low",
		product: "Designer Blazer",
		amount: 95000,
		subsidy: 10000,
		plan: "6 months @ 5%",
		monthlyPayment: 14875,
		timeAgo: "2 hours ago",
	},
	{
		id: "FR-12457",
		status: "pending",
		user: {
			name: "Sarah Johnson",
			email: "sjohnson@shell.com",
			staffId: "SHL-7654",
			verified: true,
		},
		creditScore: 720,
		riskLevel: "low",
		product: "Evening Gown",
		amount: 75000,
		subsidy: 10000,
		plan: "3 months @ 0%",
		monthlyPayment: 21667,
		timeAgo: "5 hours ago",
	},
	{
		id: "FR-12456",
		status: "pending",
		user: {
			name: "Michael Chen",
			email: "mchen@shell.com",
			staffId: "SHL-9123",
			verified: true,
		},
		creditScore: 650,
		riskLevel: "medium",
		product: "Business Suit",
		amount: 120000,
		subsidy: 10000,
		plan: "9 months @ 8%",
		monthlyPayment: 13111,
		timeAgo: "1 day ago",
	},
];

export default function RequestsPage() {
	return (
		<div className="space-y-6">
			{/* Info Alert */}
			<div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
				<div className="flex items-start gap-3">
					<Info className="w-6 h-6 text-blue-600 mt-0.5" strokeWidth={2.5} />
					<div>
						<p className="text-sm font-semibold text-blue-800">Information</p>
						<p className="text-sm text-blue-700 mt-1">
							These requests are awaiting approval from Stitches Africa admin. You
							can view details but cannot approve/reject them directly.
						</p>
					</div>
				</div>
			</div>

			{/* Request Cards */}
			<div className="space-y-4">
				{requests.map((request) => (
					<div
						key={request.id}
						className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
					>
						<div className="flex items-start justify-between mb-4">
							<div>
								<div className="flex items-center gap-3 mb-2">
									<h3 className="text-lg font-bold text-gray-800">
										#{request.id}
									</h3>
									<span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold uppercase rounded-full">
										Pending Admin Approval
									</span>
									<span className="text-xs text-gray-500">
										{request.timeAgo}
									</span>
								</div>
								<p className="text-sm text-gray-600">
									User: <span className="font-semibold">{request.user.name}</span>{" "}
									({request.user.email})
								</p>
								{request.user.verified && (
									<p className="text-xs text-blue-600 mt-1">
										✓ Staff ID: {request.user.staffId} Verified
									</p>
								)}
							</div>
							<div className="text-right">
								<p className="text-sm text-gray-500 mb-1">Credit Score</p>
								<p className="text-2xl font-bold text-blue-600">
									{request.creditScore}
								</p>
								<span
									className={`inline-block mt-1 px-2 py-1 text-xs font-bold uppercase rounded-full ${
										request.riskLevel === "low"
											? "bg-blue-100 text-blue-700"
											: request.riskLevel === "medium"
											? "bg-yellow-100 text-yellow-700"
											: "bg-red-100 text-red-700"
									}`}
								>
									{request.riskLevel} Risk
								</span>
							</div>
						</div>

						<div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
							<div>
								<p className="text-xs text-gray-500 mb-1">Product</p>
								<p className="font-semibold text-sm text-gray-800">
									{request.product}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-500 mb-1">Amount</p>
								<p className="font-semibold text-sm text-gray-800">
									₦{request.amount.toLocaleString()}
								</p>
								<p className="text-xs text-blue-600">
									-₦{request.subsidy.toLocaleString()} subsidy
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-500 mb-1">Plan</p>
								<p className="font-semibold text-sm text-gray-800">
									{request.plan}
								</p>
							</div>
							<div>
								<p className="text-xs text-gray-500 mb-1">Monthly Payment</p>
								<p className="font-semibold text-sm text-gray-800">
									₦{request.monthlyPayment.toLocaleString()}
								</p>
							</div>
						</div>

						<div className="flex gap-3">
							<button
								disabled
								className="flex-1 bg-gray-200 text-gray-500 font-semibold py-2 px-4 rounded-xl cursor-not-allowed"
							>
								Awaiting Admin Review
							</button>
							<button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-xl transition-colors">
								View Details
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
