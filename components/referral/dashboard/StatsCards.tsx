/**
 * Stats Cards Component
 * Displays referrer statistics with real-time updates
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Users,
	Award,
	DollarSign,
	TrendingUp,
	MousePointer,
	Download,
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { ReferralUser } from "@/lib/referral/types";
import { toast } from "sonner";

interface StatsCardsProps {
	userId: string;
}

interface Stats {
	totalReferrals: number;
	totalPoints: number;
	totalRevenue: number;
	conversionRate: number;
	totalClicks: number;
	totalDownloads: number;
}

/**
 * StatsCards Component
 * Displays key metrics for the referrer with real-time updates from Firestore
 */
export const StatsCards: React.FC<StatsCardsProps> = ({ userId }) => {
	const [stats, setStats] = useState<Stats>({
		totalReferrals: 0,
		totalPoints: 0,
		totalRevenue: 0,
		conversionRate: 0,
		totalClicks: 0,
		totalDownloads: 0,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Set up real-time listener for referrer stats
	 * Requirement: 4.5 - Real-time updates using Firestore listeners
	 */
	useEffect(() => {
		if (!userId) {
			setError("User ID is required");
			setLoading(false);
			return;
		}

		// Reference to the referral user document
		const userDocRef = doc(db, "referralUsers", userId);

		// Set up real-time listener
		const unsubscribe = onSnapshot(
			userDocRef,
			(docSnapshot) => {
				if (docSnapshot.exists()) {
					const userData = docSnapshot.data() as ReferralUser;

					// Calculate conversion rate
					// We'll fetch referrals to calculate accurate conversion rate
					fetchConversionRate(userId).then((conversionRate) => {
						setStats({
							totalReferrals: userData.totalReferrals || 0,
							totalPoints: userData.totalPoints || 0,
							totalRevenue: userData.totalRevenue || 0,
							conversionRate,
							totalClicks: userData.totalClicks || 0,
							totalDownloads: userData.totalDownloads || 0,
						});
						setLoading(false);
						setError(null);
					});
				} else {
					setError("User not found");
					setLoading(false);
				}
			},
			(err) => {
				console.error("Error listening to referrer stats:", err);
				setError("Failed to load statistics");
				setLoading(false);
				toast.error("Failed to load stats", {
					description: "Could not retrieve your referral statistics",
				});
			}
		);

		// Cleanup listener on unmount
		return () => unsubscribe();
	}, [userId]);

	/**
	 * Fetch conversion rate from referrals collection
	 * Requirement: 4.4 - Display conversion rate
	 */
	const fetchConversionRate = async (userId: string): Promise<number> => {
		try {
			const response = await fetch(
				`/api/referral/dashboard/stats?userId=${userId}`
			);
			if (response.ok) {
				const data = await response.json();
				return data.conversionRate || 0;
			}
			return 0;
		} catch (error) {
			console.error("Error fetching conversion rate:", error);
			return 0;
		}
	};

	/**
	 * Format currency values
	 */
	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 2,
		}).format(amount);
	};

	/**
	 * Format number with commas
	 */
	const formatNumber = (num: number): string => {
		return new Intl.NumberFormat("en-US").format(num);
	};

	if (loading) {
		return (
			<div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<Card key={i} className="animate-pulse">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								<div className="h-4 w-24 bg-muted rounded" />
							</CardTitle>
							<div className="h-4 w-4 bg-muted rounded" />
						</CardHeader>
						<CardContent>
							<div className="h-8 w-32 bg-muted rounded mb-2" />
							<div className="h-3 w-40 bg-muted rounded" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card className="col-span-full">
					<CardContent className="pt-6">
						<p className="text-sm text-destructive">{error}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
			{/* Total Clicks Card */}
			<Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium text-gray-600">
						Total Clicks
					</CardTitle>
					<div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center">
						<MousePointer className="h-5 w-5 text-orange-600" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold text-gray-900">
						{formatNumber(stats.totalClicks)}
					</div>
					<p className="text-xs text-gray-500 mt-1">Unique link clicks</p>
				</CardContent>
			</Card>

			{/* Total Downloads Card */}
			<Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium text-gray-600">
						App Downloads
					</CardTitle>
					<div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
						<Download className="h-5 w-5 text-indigo-600" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold text-gray-900">
						{formatNumber(stats.totalDownloads)}
					</div>
					<p className="text-xs text-gray-500 mt-1">App installations</p>
				</CardContent>
			</Card>

			{/* Total Referrals Card */}
			<Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium text-gray-600">
						Total Referrals
					</CardTitle>
					<div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
						<Users className="h-5 w-5 text-blue-600" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold text-gray-900">
						{formatNumber(stats.totalReferrals)}
					</div>
					<p className="text-xs text-gray-500 mt-1">
						People you&apos;ve referred
					</p>
				</CardContent>
			</Card>

			{/* Total Points Card */}
			<Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium text-gray-600">
						Total Points
					</CardTitle>
					<div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
						<Award className="h-5 w-5 text-purple-600" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold text-gray-900">
						{formatNumber(stats.totalPoints)}
					</div>
					<p className="text-xs text-gray-500 mt-1">
						Points earned from referrals
					</p>
				</CardContent>
			</Card>

			{/* Total Revenue Card */}
			<Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium text-gray-600">
						Total Revenue
					</CardTitle>
					<div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
						<DollarSign className="h-5 w-5 text-green-600" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold text-gray-900">
						{formatCurrency(stats.totalRevenue)}
					</div>
					<p className="text-xs text-gray-500 mt-1">
						Revenue from referee purchases
					</p>
				</CardContent>
			</Card>

			{/* Conversion Rate Card */}
			<Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium text-gray-600">
						Conversion Rate
					</CardTitle>
					<div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center">
						<TrendingUp className="h-5 w-5 text-teal-600" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="text-3xl font-bold text-gray-900">
						{stats.conversionRate.toFixed(1)}%
					</div>
					<p className="text-xs text-gray-500 mt-1">
						Referrals that made purchases
					</p>
				</CardContent>
			</Card>
		</div>
	);
};
