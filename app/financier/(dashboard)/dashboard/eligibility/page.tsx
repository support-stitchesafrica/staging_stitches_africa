"use client";

export default function EligibilityPage() {
	return (
		<div className="bg-white rounded-xl border border-gray-200 p-8">
			<h3 className="text-xl font-bold text-gray-800 mb-6">
				Configure Eligibility Rules
			</h3>

			<div className="space-y-8">
				{/* User Types */}
				<div>
					<label className="block text-md font-bold text-gray-700 mb-4">
						Who Can Access Your Financing?
					</label>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<label className="flex items-start p-5 bg-gray-50 rounded-xl border-2 border-transparent hover:border-blue-300 transition cursor-pointer">
							<input
								type="checkbox"
								defaultChecked
								className="form-checkbox text-blue-600 rounded mr-4 w-6 h-6 mt-1"
							/>
							<div>
								<span className="font-semibold text-gray-800 block mb-1">
									Corporate Staff Only
								</span>
								<p className="text-sm text-gray-600">
									Verified employees with staff ID
								</p>
							</div>
						</label>
						<label className="flex items-start p-5 bg-gray-50 rounded-xl border-2 border-transparent hover:border-blue-300 transition cursor-pointer">
							<input
								type="checkbox"
								className="form-checkbox text-blue-600 rounded mr-4 w-6 h-6 mt-1"
							/>
							<div>
								<span className="font-semibold text-gray-800 block mb-1">
									Public Users
								</span>
								<p className="text-sm text-gray-600">General platform users</p>
							</div>
						</label>
						<label className="flex items-start p-5 bg-gray-50 rounded-xl border-2 border-transparent hover:border-blue-300 transition cursor-pointer">
							<input
								type="checkbox"
								defaultChecked
								className="form-checkbox text-blue-600 rounded mr-4 w-6 h-6 mt-1"
							/>
							<div>
								<span className="font-semibold text-gray-800 block mb-1">
									Verified Users Only
								</span>
								<p className="text-sm text-gray-600">Users with verified BVN</p>
							</div>
						</label>
					</div>
				</div>

				{/* Loan Limits */}
				<div className="border-t border-gray-200 pt-8">
					<label className="block text-md font-bold text-gray-700 mb-4">
						Loan Limits
					</label>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div>
							<label className="block text-sm font-semibold text-gray-600 mb-2">
								Max Amount Per Order
							</label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
									₦
								</span>
								<input
									type="number"
									defaultValue="500000"
									className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-lg"
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-semibold text-gray-600 mb-2">
								Max Amount Per User
							</label>
							<div className="relative">
								<span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
									₦
								</span>
								<input
									type="number"
									defaultValue="2000000"
									className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-lg"
								/>
							</div>
						</div>
						<div>
							<label className="block text-sm font-semibold text-gray-600 mb-2">
								Max Active Loans
							</label>
							<input
								type="number"
								defaultValue="2"
								className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-lg"
							/>
						</div>
					</div>
				</div>

				{/* Product Categories */}
				<div className="border-t border-gray-200 pt-8">
					<label className="block text-md font-bold text-gray-700 mb-4">
						Product Categories Allowed
					</label>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						{[
							"Dresses",
							"Suits",
							"Shoes",
							"Bags",
							"Accessories",
							"Outerwear",
							"Sportswear",
							"Jewelry",
						].map((category, index) => (
							<label
								key={index}
								className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition cursor-pointer border-2 border-transparent hover:border-blue-300"
							>
								<input
									type="checkbox"
									defaultChecked={[0, 1, 2, 4, 6].includes(index)}
									className="form-checkbox text-blue-600 rounded mr-3 w-5 h-5"
								/>
								<span className="font-medium text-gray-800">{category}</span>
							</label>
						))}
					</div>
				</div>

				{/* Employee Verification */}
				<div className="border-t border-gray-200 pt-8">
					<label className="block text-md font-bold text-gray-700 mb-4">
						Employee Verification
					</label>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-semibold text-gray-600 mb-2">
								Employer Domain(s)
							</label>
							<div className="space-y-2">
								{["@shell.com", "@shellnigeria.com"].map((domain, index) => (
									<div key={index} className="flex gap-2">
										<input
											type="text"
											value={domain}
											readOnly
											className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl bg-gray-50"
										/>
										<button className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-4 py-2 rounded-xl transition-colors">
											Remove
										</button>
									</div>
								))}
							</div>
						</div>
						<div>
							<label className="block text-sm font-semibold text-gray-600 mb-2">
								Add New Domain
							</label>
							<div className="flex gap-2">
								<input
									type="text"
									placeholder="@example.com"
									className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
								<button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
									Add Domain
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Save Button */}
				<div className="border-t border-gray-200 pt-8 flex justify-end">
					<button className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-12 rounded-xl transition-colors shadow-lg text-lg">
						Save Eligibility Rules
					</button>
				</div>
			</div>
		</div>
	);
}
