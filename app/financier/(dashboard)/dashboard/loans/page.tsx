"use client";

const loans = [
	{
		id: "LN-2341",
		user: {
			name: "Sarah Johnson",
			email: "sjohnson@shell.com",
		},
		product: "Evening Gown",
		outstanding: 39000,
		progress: 40,
		nextPayment: {
			amount: 13000,
			date: "Jan 15, 2025",
			daysUntil: 5,
		},
		status: "active",
	},
	{
		id: "LN-2340",
		user: {
			name: "John Doe",
			email: "jdoe@shell.com",
		},
		product: "Designer Blazer",
		outstanding: 55000,
		progress: 60,
		nextPayment: {
			amount: 18333,
			date: "Jan 18, 2025",
			daysUntil: 8,
		},
		status: "active",
	},
	{
		id: "LN-2339",
		user: {
			name: "Michael Chen",
			email: "mchen@shell.com",
		},
		product: "Business Suit",
		outstanding: 85000,
		progress: 25,
		nextPayment: {
			amount: 14167,
			date: "Jan 20, 2025",
			daysUntil: 10,
		},
		status: "active",
	},
];

export default function LoansPage() {
	return (
		<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
			<div className="p-6 border-b border-gray-200">
				<div className="flex justify-between items-center">
					<div>
						<h3 className="text-lg font-bold text-gray-800">
							Your Active Loans ({loans.length})
						</h3>
						<p className="text-sm text-gray-500 mt-1">
							Total Outstanding: ₦
							{loans
								.reduce((sum, loan) => sum + loan.outstanding, 0)
								.toLocaleString()}
						</p>
					</div>
					<div className="flex gap-3">
						<select className="border border-gray-300 rounded-xl px-4 py-2 text-sm bg-white">
							<option>All Status</option>
							<option>Due This Week</option>
							<option>Due This Month</option>
						</select>
						<button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-xl transition-colors">
							Export
						</button>
					</div>
				</div>
			</div>

			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
								Loan ID
							</th>
							<th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
								User
							</th>
							<th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
								Product
							</th>
							<th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
								Outstanding
							</th>
							<th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
								Next Payment
							</th>
							<th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
								Status
							</th>
							<th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{loans.map((loan) => (
							<tr
								key={loan.id}
								className="hover:bg-gray-50 transition-colors"
							>
								<td className="px-6 py-4 whitespace-nowrap font-bold text-sm">
									#{loan.id}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm">
									<div>
										<p className="font-semibold text-gray-800">
											{loan.user.name}
										</p>
										<p className="text-xs text-gray-500">{loan.user.email}</p>
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
									{loan.product}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<p className="font-bold text-gray-800">
										₦{loan.outstanding.toLocaleString()}
									</p>
									<div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
										<div
											className="bg-blue-600 h-1.5 rounded-full"
											style={{ width: `${loan.progress}%` }}
										></div>
									</div>
									<p className="text-xs text-gray-500 mt-1">
										{loan.progress}% paid
									</p>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm">
									<p className="font-bold">
										₦{loan.nextPayment.amount.toLocaleString()}
									</p>
									<p className="text-xs text-gray-500">
										{loan.nextPayment.date}
									</p>
									<p className="text-xs text-blue-600">
										({loan.nextPayment.daysUntil} days)
									</p>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full">
										Active
									</span>
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
									<button className="text-blue-600 hover:text-blue-800 font-medium">
										View
									</button>
									<button className="text-gray-600 hover:text-gray-800 font-medium">
										Remind
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
