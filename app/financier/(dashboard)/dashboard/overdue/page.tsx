"use client";

const overdueStats = [
	{
		label: "Early (1-7 days)",
		count: 2,
		amount: 31000,
		severity: "low",
	},
	{
		label: "Moderate (8-30)",
		count: 1,
		amount: 15500,
		severity: "medium",
	},
	{
		label: "Serious (31-60)",
		count: 0,
		amount: 0,
		severity: "high",
	},
	{
		label: "Severe (60+)",
		count: 0,
		amount: 0,
		severity: "critical",
	},
];

const overdueLoans = [
	{
		id: "LN-2156",
		user: {
			name: "Michael Chen",
			phone: "+234-XXX-XXXX",
		},
		daysOverdue: 3,
		severity: "early",
		overdueAmount: 15810,
		principal: 15500,
		lateFee: 310,
	},
	{
		id: "LN-2155",
		user: {
			name: "James Wilson",
			phone: "+234-XXX-XXXX",
		},
		daysOverdue: 5,
		severity: "early",
		overdueAmount: 15310,
		principal: 15000,
		lateFee: 310,
	},
	{
		id: "LN-2150",
		user: {
			name: "Emma Davis",
			phone: "+234-XXX-XXXX",
		},
		daysOverdue: 12,
		severity: "moderate",
		overdueAmount: 15810,
		principal: 15500,
		lateFee: 310,
	},
];

export default function OverduePage() {
	return (
		<div className="space-y-6">
			{/* Overdue Stats */}
			<div className="grid grid-cols-4 gap-4">
				{overdueStats.map((stat, index) => (
					<div
						key={index}
						className="bg-white border-2 border-gray-200 rounded-xl p-5 text-center hover:shadow-md transition-shadow"
					>
						<p className="text-sm font-bold mb-2 text-gray-700">
							{stat.label}
						</p>
						<p className="text-4xl font-bold mb-1 text-gray-900">
							{stat.count}
						</p>
						<p className="text-xs text-gray-500">
							₦{stat.amount.toLocaleString()}
						</p>
						{stat.severity === "low" && (
							<div className="mt-2 w-2 h-2 bg-blue-500 rounded-full mx-auto"></div>
						)}
						{stat.severity === "medium" && (
							<div className="mt-2 w-2 h-2 bg-yellow-500 rounded-full mx-auto"></div>
						)}
						{stat.severity === "high" && (
							<div className="mt-2 w-2 h-2 bg-orange-500 rounded-full mx-auto"></div>
						)}
						{stat.severity === "critical" && (
							<div className="mt-2 w-2 h-2 bg-red-500 rounded-full mx-auto"></div>
						)}
					</div>
				))}
			</div>

			{/* Overdue Loan Cards */}
			<div className="space-y-4">
				{overdueLoans.map((loan) => (
					<div
						key={loan.id}
						className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
					>
						<div className="flex justify-between items-start mb-4">
							<div>
								<div className="flex items-center gap-3 mb-2">
									<h3 className="text-lg font-bold text-gray-800">
										#{loan.id}
									</h3>
									<span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-full">
										{loan.daysOverdue} Days Overdue
									</span>
								</div>
								<p className="text-sm text-gray-600">
									User: <span className="font-semibold">{loan.user.name}</span>
								</p>
								<p className="text-sm text-gray-600">Phone: {loan.user.phone}</p>
							</div>
							<div className="text-right">
								<p className="text-sm text-gray-500 mb-1">Overdue Amount</p>
								<p className="text-2xl font-bold text-gray-900">
									₦{loan.overdueAmount.toLocaleString()}
								</p>
								<p className="text-xs text-gray-600">
									₦{loan.principal.toLocaleString()} + ₦
									{loan.lateFee.toLocaleString()} late fee
								</p>
							</div>
						</div>

						<div className="flex gap-3">
							<button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors">
								Send Reminder
							</button>
							<button className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-xl transition-colors">
								Contact User
							</button>
							<button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-xl transition-colors">
								View Loan
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
