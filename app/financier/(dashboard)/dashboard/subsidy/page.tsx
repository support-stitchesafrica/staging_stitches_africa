"use client";

export default function SubsidyPage() {
	return (
		<div className="bg-white rounded-xl border border-gray-200 p-8">
			<h3 className="text-xl font-bold text-gray-800 mb-6">
				Employee Subsidy Configuration
			</h3>

			<div className="space-y-8">
				{/* Subsidy Amounts */}
				<div>
					<label className="block text-md font-bold text-gray-700 mb-4">
						Subsidy Structure
					</label>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-semibold text-gray-600 mb-2">
								Subsidy Per Purchase
							</label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
									₦
								</span>
								<input
									type="number"
									defaultValue="10000"
									className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-lg"
								/>
							</div>
							<p className="text-xs text-gray-500 mt-2">
								Fixed amount deducted from each eligible purchase
							</p>
						</div>
						<div>
							<label className="block text-sm font-semibold text-gray-600 mb-2">
								Max Subsidy Per Employee (Annual)
							</label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
									₦
								</span>
								<input
									type="number"
									defaultValue="120000"
									className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-lg"
								/>
							</div>
							<p className="text-xs text-gray-500 mt-2">
								Total subsidy cap per employee per year
							</p>
						</div>
					</div>
				</div>

				{/* Budget Tracking */}
				<div className="border-t border-gray-200 pt-8">
					<label className="block text-md font-bold text-gray-700 mb-4">
						Budget Tracking
					</label>
					<div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<p className="text-sm font-semibold text-gray-700">
									Total Annual Budget:
								</p>
								<p className="text-2xl font-bold text-gray-800">
									₦10,000,000
								</p>
							</div>
							<div className="flex justify-between items-center">
								<p className="text-sm font-semibold text-gray-700">
									Subsidy Used YTD:
								</p>
								<p className="text-2xl font-bold text-gray-800">
									₦3,100,000
								</p>
							</div>
							<div>
								<div className="flex justify-between items-center mb-2">
									<p className="text-sm font-semibold text-gray-700">
										Budget Utilization:
									</p>
									<p className="text-sm font-bold text-gray-800">31%</p>
								</div>
								<div className="w-full bg-gray-200 rounded-full h-3">
									<div
										className="bg-blue-600 h-3 rounded-full transition-all duration-500"
										style={{ width: "31%" }}
									></div>
								</div>
							</div>
							<div className="bg-white border border-gray-200 rounded-xl p-4 mt-4">
								<label className="flex items-center cursor-pointer">
									<input
										type="checkbox"
										defaultChecked
										className="form-checkbox text-blue-600 rounded mr-3 w-5 h-5"
									/>
									<span className="text-sm font-medium text-gray-700">
										Alert me when budget reaches 80% utilization
									</span>
								</label>
							</div>
						</div>
					</div>
				</div>

				{/* Save Button */}
				<div className="border-t border-gray-200 pt-8 flex justify-end">
					<button className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-12 rounded-xl transition-colors shadow text-lg">
						Save Subsidy Configuration
					</button>
				</div>
			</div>
		</div>
	);
}
