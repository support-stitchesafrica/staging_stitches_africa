"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ShoppingCart, User, AlertCircle, RefreshCcw } from "lucide-react";
import { getReferralCartStatsAction } from "@/app/referral/actions";
import { ReferralCartStats } from "@/lib/referral/types";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReferralCartActivityProps {
	userId: string;
}

export function ReferralCartActivity({ userId }: ReferralCartActivityProps) {
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<ReferralCartStats[]>([]);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		try {
			setLoading(true);
			setError(null);

			const result = await getReferralCartStatsAction(userId);

			if (!result.success || !result.data) {
				throw new Error(result.error || "Failed to fetch data");
			}

			const stats = result.data;

			// Let's sort by cart value descending to show most valuable leads first
			const sortedStats = stats.sort(
				(a, b) => b.cartTotalValue - a.cartTotalValue
			);

			setData(sortedStats);
		} catch (err) {
			console.error("Error fetching referral cart stats:", err);
			setError("Failed to load referral activity.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (userId) {
			fetchData();
		}
	}, [userId]);

	if (loading) {
		return (
			<Card className="p-6">
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-lg font-semibold flex items-center gap-2">
						<ShoppingCart className="h-5 w-5 text-gray-500" />
						Live Cart Activity
					</h3>
				</div>
				<div className="space-y-4">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse"
						>
							<div className="flex items-center gap-4">
								<div className="w-10 h-10 bg-gray-200 rounded-full"></div>
								<div>
									<div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
									<div className="h-3 w-24 bg-gray-200 rounded"></div>
								</div>
							</div>
							<div className="text-right">
								<div className="h-4 w-20 bg-gray-200 rounded mb-2 ml-auto"></div>
								<div className="h-3 w-16 bg-gray-200 rounded ml-auto"></div>
							</div>
						</div>
					))}
				</div>
			</Card>
		);
	}

	if (error) {
		return (
			<Card className="p-6 border-red-100 bg-red-50">
				<div className="flex flex-col items-center justify-center text-center py-6 text-red-600 gap-2">
					<AlertCircle className="h-8 w-8" />
					<p>{error}</p>
					<Button
						variant="outline"
						size="sm"
						onClick={fetchData}
						className="mt-2 bg-white hover:bg-red-50 text-red-600 border-red-200"
					>
						Try Again
					</Button>
				</div>
			</Card>
		);
	}

	const activeCarts = data.filter((item) => item.cartItemCount > 0);
	const inactiveReferrals = data.filter((item) => item.cartItemCount === 0);

	return (
		<Card className="p-6">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-2">
					<ShoppingCart className="h-5 w-5 text-indigo-600" />
					<h3 className="text-lg font-semibold text-gray-900">
						Live Cart Activity
					</h3>
					<Badge
						variant="secondary"
						className="mr-2 bg-indigo-50 text-indigo-700"
					>
						{activeCarts.length} Active
					</Badge>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={fetchData}
					className="text-gray-400 hover:text-gray-600"
				>
					<RefreshCcw className="h-4 w-4" />
				</Button>
			</div>

			<div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
				{data.length === 0 ? (
					<div className="text-center py-10 text-gray-500">
						<ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
						<p className="font-medium">No referral activity yet</p>
						<p className="text-sm">
							Share your code to start getting referrals!
						</p>
					</div>
				) : (
					<>
						{activeCarts.length === 0 && (
							<div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
								<p>No active carts right now.</p>
							</div>
						)}

						{activeCarts.map((referral) => (
							<div
								key={referral.id}
								className="flex items-center justify-between p-4 bg-white border border-indigo-100 rounded-lg shadow-sm hover:shadow-md transition-all group"
							>
								<div className="flex items-center gap-4">
									<div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
										{referral.refereeName.charAt(0).toUpperCase()}
									</div>
									<div>
										<h4 className="font-medium text-gray-900">
											{referral.refereeName}
										</h4>
										<div className="flex items-center gap-2 text-xs text-gray-500">
											<span>{referral.refereeEmail.split("@")[0]}***</span>
											<span>•</span>
											<span>
												Joined{" "}
												{referral.createdAt instanceof Date
													? formatDistanceToNow(
															new Date(referral.createdAt as any)
													  )
													: "recently"}{" "}
												ago
											</span>
										</div>
									</div>
								</div>

								<div className="text-right">
									<div className="font-bold text-indigo-600">
										{formatCurrency(referral.cartTotalValue)}
									</div>
									<div className="text-xs text-gray-500 flex items-center justify-end gap-1">
										<Badge
											variant="outline"
											className="text-[10px] h-5 px-1.5 border-indigo-200 text-indigo-700 bg-indigo-50"
										>
											{referral.cartItemCount} items
										</Badge>
									</div>
									{referral.lastCartUpdate && (
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<p className="text-[10px] text-gray-400 mt-1 cursor-default">
														Updated{" "}
														{formatDistanceToNow(
															new Date(referral.lastCartUpdate as any)
														)}{" "}
														ago
													</p>
												</TooltipTrigger>
												<TooltipContent>
													<p>Last cart activity</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									)}
								</div>
							</div>
						))}

						{inactiveReferrals.length > 0 && (
							<div className="pt-4 border-t border-gray-100">
								<h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
									Other Referrals ({inactiveReferrals.length})
								</h4>
								<div className="space-y-2">
									{inactiveReferrals.slice(0, 5).map((referral) => (
										<div
											key={referral.id}
											className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
										>
											<div className="flex items-center gap-2 text-sm text-gray-600">
												<User className="h-3 w-3" />
												<span>{referral.refereeName}</span>
											</div>
											<span className="text-xs text-gray-400">
												No active cart
											</span>
										</div>
									))}
									{inactiveReferrals.length > 5 && (
										<p className="text-xs text-center text-gray-400 font-medium py-1">
											+ {inactiveReferrals.length - 5} more
										</p>
									)}
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</Card>
	);
}
