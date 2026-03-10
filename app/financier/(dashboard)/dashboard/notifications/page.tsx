"use client";

const notifications = [
	{
		title: "New Financing Request",
		description: "Get notified when users submit new financing requests",
		checked: true,
	},
	{
		title: "Payment Received",
		description: "Get notified when payments are successfully processed",
		checked: true,
	},
	{
		title: "Payment Overdue",
		description: "Get notified when payments become overdue",
		checked: true,
	},
	{
		title: "Loan Completed",
		description: "Get notified when users complete their loan repayment",
		checked: true,
	},
	{
		title: "Budget Alerts",
		description: "Get notified when subsidy budget reaches threshold",
		checked: true,
	},
];

export default function NotificationsPage() {
	return (
		<div className="bg-white rounded-xl border border-gray-200 p-8">
			<h3 className="text-xl font-bold text-gray-800 mb-6">
				Notification Preferences
			</h3>

			<div className="space-y-6">
				{notifications.map((notification, index) => (
					<div
						key={index}
						className="p-5 bg-gray-50 border border-gray-200 rounded-xl"
					>
						<label className="flex items-start cursor-pointer">
							<input
								type="checkbox"
								defaultChecked={notification.checked}
								className="form-checkbox text-blue-600 rounded mr-4 w-6 h-6 mt-1"
							/>
							<div>
								<span className="font-semibold text-gray-800 block mb-1">
									{notification.title}
								</span>
								<p className="text-sm text-gray-600">
									{notification.description}
								</p>
							</div>
						</label>
					</div>
				))}

				<div className="border-t border-gray-200 pt-6 flex justify-end">
					<button className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-12 rounded-xl transition-colors shadow text-lg">
						Save Preferences
					</button>
				</div>
			</div>
		</div>
	);
}
