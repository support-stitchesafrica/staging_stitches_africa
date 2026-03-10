"use client";

const plans = [
	{
		name: "3-Month Standard",
		status: "active",
		interest: "0%",
		duration: "3 Months",
		lateFee: "2% of due",
		gracePeriod: "3 days",
		earlyRepayment: "Allowed",
		activeLoans: 89,
		totalFunded: "6.7M",
	},
	{
		name: "6-Month Premium",
		status: "active",
		interest: "5%",
		duration: "6 Months",
		lateFee: "₦5.00 fixed",
		gracePeriod: "5 days",
		earlyRepayment: "50% discount",
		activeLoans: 145,
		totalFunded: "10.9M",
	},
];

export default function PlansPage() {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h3 className="text-xl font-bold text-gray-800">
						Manage Financing Plans
					</h3>
					<p className="text-sm text-gray-500 mt-1">
						Create and configure repayment plans for your users
					</p>
				</div>
				<button className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow">
					+ Create New Plan
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{plans.map((plan, index) => (
					<div
						key={index}
						className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
					>
						<div className="flex justify-between items-start mb-4">
							<div>
								<h4 className="text-lg font-bold text-gray-800">{plan.name}</h4>
								<span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase rounded-full">
									Active
								</span>
							</div>
							<div className="text-right">
								<p className="text-3xl font-bold text-blue-600">
									{plan.interest}
								</p>
								<p className="text-xs text-gray-500">Interest</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-3 mb-4">
							<div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
								<p className="text-xs text-gray-500 mb-1">Duration</p>
								<p className="font-semibold text-gray-800">{plan.duration}</p>
							</div>
							<div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
								<p className="text-xs text-gray-500 mb-1">Late Fee</p>
								<p className="font-semibold text-gray-800">{plan.lateFee}</p>
							</div>
							<div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
								<p className="text-xs text-gray-500 mb-1">Grace Period</p>
								<p className="font-semibold text-gray-800">{plan.gracePeriod}</p>
							</div>
							<div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
								<p className="text-xs text-gray-500 mb-1">Early Repayment</p>
								<p className="font-semibold text-blue-600">
									{plan.earlyRepayment}
								</p>
							</div>
						</div>

						<div className="border-t border-gray-200 pt-4 mb-4">
							<p className="text-sm text-gray-600 mb-2">
								Active Usage:{" "}
								<span className="font-semibold text-gray-800">
									{plan.activeLoans} loans
								</span>
							</p>
							<p className="text-sm text-gray-600">
								Total Funded:{" "}
								<span className="font-semibold text-gray-800">
									₦{plan.totalFunded}
								</span>
							</p>
						</div>

						<div className="flex gap-2">
							<button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors">
								Edit Plan
							</button>
							<button className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-xl transition-colors">
								Deactivate
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
