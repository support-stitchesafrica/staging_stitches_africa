/**
 * Rewards Section Component
 * Detailed rewards breakdown with examples
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

"use client";

import React from "react";
import { Coins, Percent, TrendingUp } from "lucide-react";

interface RewardsSectionProps {
	className?: string;
}

export function RewardsSection({ className = "" }: RewardsSectionProps) {
	const rewards = [
		{
			icon: Coins,
			title: "Sign-Up Bonus",
			amount: "1",
			unit: "Point",
			description:
				"Earn a point for every sign-up or app download through your referral link.",
			color: "bg-green-50 border-green-200",
		},
		{
			icon: Percent,
			title: "Commission on Purchases",
			amount: "5-10",
			unit: "%",
			description: "Earn commission whenever your community shops using your referral link or code.",
			color: "bg-blue-50 border-blue-200",
		},
		{
			icon: TrendingUp,
			title: "Unlimited Earnings",
			amount: "∞",
			unit: "",
			description:
				"Your earning potential never stops. Every purchase made through your referral link counts, including repeat orders from returning customers. The more your community shops using your referral link or code, the more you earn.",
			color: "bg-purple-50 border-purple-200",
		},
	];

	const examples = [
		{
			referrals: "10",
			avgPurchase: "$500",
			signupBonus: "10 pts",
			commission: "Tier 1 (5%) $25",
			total: "10 pts + $25",
		},
		{
			referrals: "10",
			avgPurchase: "$500",
			signupBonus: "10 pts",
			commission: "Tier 2 (10%) $50",
			total: "10 pts + $50",
		},
		{
			referrals: "50",
			avgPurchase: "$500",
			signupBonus: "50 pts",
			commission: "Tier 1 (5%) $125",
			total: "50 pts + $125",
		},
		{
			referrals: "50",
			avgPurchase: "$500",
			signupBonus: "50 pts",
			commission: "Tier 2 (10%) $250",
			total: "50 pts + $250",
		},
		{
			referrals: "100",
			avgPurchase: "$500",
			signupBonus: "100 pts",
			commission: "Tier 1 (5%) $250",
			total: "100 pts + $250",
		},
		{
			referrals: "100",
			avgPurchase: "$500",
			signupBonus: "100 pts",
			commission: "Tier 2 (10%) $500",
			total: "100 pts + $500",
		},
	];

	return (
		<section id="rewards" className={`py-16 md:py-24 bg-white ${className}`}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12 sm:mb-16">
					<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-3 sm:mb-4 px-4">
						Your Earning Potential
					</h2>
					<div className="text-left max-w-4xl mx-auto px-4">
						<p className="text-lg sm:text-xl text-gray-600 mb-2">
							<strong>Sign-Up Bonus — 1 Point</strong>
						</p>
						<p className="text-lg sm:text-xl text-gray-600 mb-4">
							Earn a point for every sign-up or app download through your referral link.
						</p>
						<p className="text-lg sm:text-xl text-gray-600 mb-2">
							<strong>Commission on Purchases</strong>
						</p>
						<p className="text-lg sm:text-xl text-gray-600 mb-4">
							Earn commission whenever your community shops using your referral link or code.
						</p>
						<p className="text-lg sm:text-xl text-gray-600">
							<strong>Unlimited Earnings</strong>
						</p>
						<p className="text-lg sm:text-xl text-gray-600">
							Your earning potential never stops. Every purchase made through your referral link counts, including repeat orders from returning customers. The more your community shops using your referral link or code, the more you earn.
						</p>
					</div>
				</div>

				{/* Reward Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
					{rewards.map((reward, index) => (
						<div
							key={index}
							className={`p-6 sm:p-8 rounded-2xl border-2 ${reward.color} transition-transform hover:scale-105`}
						>
							<div className="flex justify-center mb-4 sm:mb-6">
								<div className="w-12 h-12 sm:w-16 sm:h-16 bg-black rounded-xl flex items-center justify-center">
									<reward.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
								</div>
							</div>

							<h3 className="text-lg sm:text-xl font-bold text-black mb-3 sm:mb-4 text-center">
								{reward.title}
							</h3>

							<div className="text-center mb-3 sm:mb-4">
								<span className="text-4xl sm:text-5xl font-bold text-black">
									{reward.amount}
								</span>
								{reward.unit && (
									<span className="text-xl sm:text-2xl text-gray-600 ml-2">
										{reward.unit}
									</span>
								)}
							</div>

							<p className="text-sm sm:text-base text-gray-600 text-center">
								{reward.description}
							</p>
						</div>
					))}
				</div>

				{/* Example Earnings */}
				<div className="bg-gray-50 rounded-2xl p-6 sm:p-8 md:p-12">
					<h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mb-6 sm:mb-8 text-center">
						Example Earnings Scenarios
					</h3>

					<div className="overflow-x-auto -mx-6 sm:mx-0">
						<div className="inline-block min-w-full align-middle px-6 sm:px-0">
							<table className="w-full min-w-[600px]">
								<thead>
									<tr className="border-b-2 border-gray-300">
										<th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-bold text-black text-xs sm:text-sm md:text-base">
											Referrals
										</th>
										<th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-bold text-black text-xs sm:text-sm md:text-base">
											Avg Purchase ($)
										</th>
										<th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-bold text-black text-xs sm:text-sm md:text-base">
											Sign-up Bonus (pts)
										</th>
										<th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-bold text-black text-xs sm:text-sm md:text-base">
											Commission
										</th>
										<th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-bold text-black text-xs sm:text-sm md:text-base">
											Total Earnings
										</th>
									</tr>
								</thead>
								<tbody>
									{examples.map((example, index) => (
										<tr
											key={index}
											className="border-b border-gray-200 hover:bg-white transition-colors"
										>
											<td className="py-3 sm:py-4 px-2 sm:px-4 font-semibold text-xs sm:text-sm md:text-base">
												{example.referrals}
											</td>
											<td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm md:text-base">
												{example.avgPurchase}
											</td>
											<td className="py-3 sm:py-4 px-2 sm:px-4 text-green-600 text-xs sm:text-sm md:text-base">
												{example.signupBonus}
											</td>
											<td className="py-3 sm:py-4 px-2 sm:px-4 text-blue-600 text-xs sm:text-sm md:text-base">
												{example.commission}
											</td>
											<td className="py-3 sm:py-4 px-2 sm:px-4 font-bold text-black text-sm sm:text-base md:text-lg">
												{example.total}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6 text-center px-4">
						Points are reward-based and non-cash. Gifts and perks become available once you reach 1,000 points.
					</p>
				</div>
			</div>
		</section>
	);
}