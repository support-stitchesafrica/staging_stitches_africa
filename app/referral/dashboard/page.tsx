/**
 * Referrer Dashboard Page
 * Main dashboard for referrers to view their referral performance
 * Requirements: 2.5, 15.1, 15.2, 15.3
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useReferralAuth } from "@/contexts/ReferralAuthContext";
import { ReferralAuthGuard } from "@/components/referral/auth/ReferralAuthGuard";
import { ReferralCodeCard } from "@/components/referral/dashboard/ReferralCodeCard";
import { StatsCards } from "@/components/referral/dashboard/StatsCards";
import { ReferralGrowthChart } from "@/components/referral/dashboard/ReferralGrowthChart";
import { RevenueChart } from "@/components/referral/dashboard/RevenueChart";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { DateRange } from "@/lib/referral/types";
import {
	collection,
	query,
	where,
	onSnapshot,
	orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { ReferralTransaction } from "@/lib/referral/types";
import { NewsTimeline } from "@/components/referral/dashboard/NewsTimeline";
import { ReferralCartActivity } from "@/components/referral/dashboard/ReferralCartActivity";

function DashboardPage() {
	const { referralUser, user, logout } = useReferralAuth();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	// Chart data state
	const [chartData, setChartData] = useState<{
		signups: { date: string; signups: number }[];
		revenue: { month: string; revenue: number; referrals?: number }[];
	}>({
		signups: [],
		revenue: [],
	});
	const [chartLoading, setChartLoading] = useState(true);
	const [dateRange, setDateRange] = useState<DateRange>("30days");

	/**
	 * Fetch chart data from API
	 * Requirement: 15.2 - Real-time data updates
	 */
	const fetchChartData = useCallback(
		async (range: DateRange) => {
			if (!user) return;

			try {
				setChartLoading(true);

				// Get Firebase ID token for authentication
				const token = await user.getIdToken();

				const response = await fetch(
					`/api/referral/dashboard/charts?range=${range}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				if (!response.ok) {
					throw new Error("Failed to fetch chart data");
				}

				const result = await response.json();

				if (result.success && result.charts) {
					// Transform API data to component format
					const signupsData = result.charts.signups.labels.map(
						(label: string, index: number) => ({
							date: label,
							signups: result.charts.signups.data[index],
						})
					);

					const revenueData = result.charts.revenue.labels.map(
						(label: string, index: number) => {
							// Format month label (e.g., "2024-01" -> "Jan 2024")
							const [year, month] = label.split("-");
							const monthName = new Date(
								parseInt(year),
								parseInt(month) - 1
							).toLocaleDateString("en-US", { month: "short" });

							return {
								month: `${monthName} ${year}`,
								revenue: result.charts.revenue.data[index],
							};
						}
					);

					setChartData({
						signups: signupsData,
						revenue: revenueData,
					});
				}
			} catch (error) {
				console.error("Error fetching chart data:", error);
				console.error(
					"Failed to load chart data: Could not retrieve chart data. Please try again."
				);
			} finally {
				setChartLoading(false);
			}
		},
		[user]
	);

	/**
	 * Handle date range change
	 */
	const handleDateRangeChange = useCallback(
		(range: DateRange) => {
			setDateRange(range);
			fetchChartData(range);
		},
		[fetchChartData]
	);

	/**
	 * Initial data fetch
	 */
	useEffect(() => {
		if (user) {
			fetchChartData(dateRange);
		}
	}, [user, fetchChartData, dateRange]);

	/**
	 * Handle logout
	 */
	const handleLogout = async () => {
		try {
			await logout();
			// Redirect will be handled by auth context
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	/**
	 * Toggle mobile menu
	 * Requirement: 15.1 - Responsive layout for mobile
	 */
	const toggleMobileMenu = () => {
		setMobileMenuOpen(!mobileMenuOpen);
	};

	// Removed: Toast notifications replaced with NewsTimeline component

	/**
	 * Set up real-time listener for new transactions to update the news timeline
	 */
	useEffect(() => {
		if (!user?.uid) return;

		// Query for new transactions for this referrer, ordered by creation time
		const transactionsQuery = query(
			collection(db, "referralTransactions"),
			where("referrerId", "==", user.uid),
			orderBy("createdAt", "desc")
		);

		// Set up real-time listener
		const unsubscribe = onSnapshot(
			transactionsQuery,
			(snapshot) => {
				// The NewsTimeline component will automatically update with the new data
				// No additional action needed here
			},
			(error) => {
				console.error("Error listening to new transactions:", error);
			}
		);

		// Cleanup listener on unmount
		return () => unsubscribe();
	}, [user?.uid]);

	if (!referralUser || !user) {
		return null; // Auth guard will handle redirect
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
			{/* Header - Requirement: 15.1 - Responsive header */}
			<header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						{/* Logo and Title */}
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
								<img
									src="/Stitches-Africa-Logo-06.png"
									alt="Stitches Africa"
									className="w-8 h-8 object-contain"
								/>
							</div>
							<div>
								<h1 className="text-lg font-bold text-gray-900">
									Referral Dashboard
								</h1>
								<p className="text-xs text-gray-500 hidden sm:block">
									Welcome back, {referralUser.fullName}
								</p>
							</div>
						</div>

						{/* Desktop Navigation */}
						<div className="hidden md:flex items-center gap-4">
							<div className="text-sm text-gray-600">
								<span className="font-medium">{referralUser.email}</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={handleLogout}
								className="gap-2"
							>
								<LogOut className="h-4 w-4" />
								Logout
							</Button>
						</div>

						{/* Mobile Menu Button */}
						<button
							onClick={toggleMobileMenu}
							className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
							aria-label="Toggle menu"
						>
							{mobileMenuOpen ? (
								<X className="h-6 w-6 text-gray-600" />
							) : (
								<Menu className="h-6 w-6 text-gray-600" />
							)}
						</button>
					</div>

					{/* Mobile Menu - Requirement: 15.1 - Mobile responsive */}
					{mobileMenuOpen && (
						<div className="md:hidden py-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
							<div className="space-y-3">
								<div className="text-sm text-gray-600 px-2">
									<p className="font-medium">{referralUser.fullName}</p>
									<p className="text-xs text-gray-500">{referralUser.email}</p>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={handleLogout}
									className="w-full gap-2"
								>
									<LogOut className="h-4 w-4" />
									Logout
								</Button>
							</div>
						</div>
					)}
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
				<div className="space-y-6 sm:space-y-8">
					{/* Two-column grid layout */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Left Column - Takes 2/3 of the screen */}
						<div className="lg:col-span-2 space-y-6">
							{/* Referral Code Card - Full width on mobile, constrained on desktop */}
							<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
								<ReferralCodeCard referralCode={referralUser.referralCode} />
							</div>

							{/* Stats Cards - Requirement: 15.1 - Responsive grid */}
							<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
								<StatsCards userId={user.uid} />
							</div>

							{/* Charts Section - Requirement: 15.1 - Responsive layout */}
							<div className="grid gap-6">
								{/* Referral Growth Chart */}
								<div>
									<ReferralGrowthChart
										data={chartData.signups}
										isLoading={chartLoading}
										onRangeChange={handleDateRangeChange}
									/>
								</div>

								{/* Revenue Chart */}
								<div>
									<RevenueChart
										data={chartData.revenue}
										isLoading={chartLoading}
									/>
								</div>
							</div>
						</div>

						{/* Right Column - Takes 1/3 of the screen - Latest Updates */}
						<div className="lg:col-span-1 space-y-6">
							{/* LIVE Cart Activity */}
							<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
								<ReferralCartActivity userId={user.uid} />
							</div>

							{/* News Timeline - Latest updates section */}
							<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
								<NewsTimeline userId={user.uid} />
							</div>
						</div>
					</div>

					{/* REMOVED: Referrals Table and Transactions Timeline sections */}
				</div>
			</main>

			{/* Footer */}
			<footer className="mt-12 py-6 border-t border-gray-200 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center text-sm text-gray-500">
						<p>
							&copy; {new Date().getFullYear()} Referral Program. All rights
							reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}

/**
 * Export dashboard page wrapped with auth guard
 * Requirement: 2.5 - Protected dashboard route
 */
export default function ProtectedDashboardPage() {
	return (
		<ReferralAuthGuard>
			<DashboardPage />
		</ReferralAuthGuard>
	);
}
