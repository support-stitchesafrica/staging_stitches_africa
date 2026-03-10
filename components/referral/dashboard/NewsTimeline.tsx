/**
 * News Timeline Component
 * Displays real-time updates in a sliding news ticker format
 */

"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Award,
	ShoppingCart,
	TrendingUp,
	Bell,
	MousePointer,
	Download,
	Smartphone,
} from "lucide-react";
import {
	collection,
	query,
	where,
	onSnapshot,
	orderBy,
	limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { ReferralTransaction } from "@/lib/referral/types";

interface NewsItem {
	id: string;
	type: "signup" | "purchase" | "click" | "download";
	description: string;
	points: number;
	amount?: number;
	refereeName?: string;
	createdAt: any;
	deviceType?: string;
	isNew?: boolean;
}

interface NewsTimelineProps {
	userId: string;
}

/**
 * NewsTimeline Component
 * Displays a sliding news ticker of recent referral activities
 */
export const NewsTimeline: React.FC<NewsTimelineProps> = ({ userId }) => {
	const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
	const [transactionItems, setTransactionItems] = useState<NewsItem[]>([]);
	const [eventItems, setEventItems] = useState<NewsItem[]>([]);

	const [loading, setLoading] = useState(true);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [visibleIndex, setVisibleIndex] = useState(0);

	/**
	 * Set up real-time listener for transactions
	 */
	useEffect(() => {
		if (!userId) {
			setLoading(false);
			return;
		}

		// Query for recent transactions for this referrer
		const transactionsQuery = query(
			collection(db, "referralTransactions"),
			where("referrerId", "==", userId),
			orderBy("createdAt", "desc"),
			limit(20)
		);

		// Set up real-time listener for transactions
		const unsubscribeTransactions = onSnapshot(
			transactionsQuery,
			(snapshot) => {
				const items: NewsItem[] = [];
				snapshot.forEach((doc) => {
					const data = doc.data();
					items.push({
						id: doc.id,
						type: data.type,
						description: data.description,
						points: data.points,
						amount: data.amount,
						refereeName: data.metadata?.refereeName,
						createdAt: data.createdAt,
					});
				});
				setTransactionItems(items);
			},
			(err) => {
				console.error("Error fetching transactions for news timeline:", err);
			}
		);

		// Query for recent referral events (clicks/downloads)
		const eventsQuery = query(
			collection(db, "referralEvents"),
			where("referrerId", "==", userId),
			orderBy("createdAt", "desc"),
			limit(20)
		);

		// Set up real-time listener for events
		const unsubscribeEvents = onSnapshot(
			eventsQuery,
			(snapshot) => {
				const items: NewsItem[] = [];
				snapshot.forEach((doc) => {
					const data = doc.data();
					// Format description based on event type
					let description = "Referral Link Activity";
					if (data.eventType === "click") {
						description = "Referral Link Click";
					} else if (data.eventType === "download") {
						description = "App Download";
					}

					items.push({
						id: doc.id,
						type: data.eventType, // 'click' or 'download'
						description: description,
						points: 0, // Events currently don't award points directly in this view
						deviceType: data.deviceType,
						createdAt: data.createdAt,
					});
				});
				setEventItems(items);
			},
			(err) => {
				console.error("Error fetching events for news timeline:", err);
			}
		);

		// Cleanup listeners on unmount
		return () => {
			unsubscribeTransactions();
			unsubscribeEvents();
		};
	}, [userId]);

	/**
	 * Combine and sort items when either source changes
	 */
	useEffect(() => {
		// Merge arrays
		const combined = [...transactionItems, ...eventItems];

		// Sort by date (descending)
		combined.sort((a, b) => {
			const aTime = a.createdAt?.seconds || 0;
			const bTime = b.createdAt?.seconds || 0;
			return bTime - aTime;
		});

		// Limit to 20 items total
		let finalItems = combined.slice(0, 20);

		// If we have only one item, duplicate it to ensure we always show 2
		if (finalItems.length === 1) {
			finalItems = [finalItems[0], { ...finalItems[0], id: `${finalItems[0].id}-duplicate` }];
		}

		setNewsItems(finalItems);
		setLoading(false);
	}, [transactionItems, eventItems]);

	/**
	 * Auto-scroll through news items (showing 2 at a time)
	 */
	useEffect(() => {
		if (newsItems.length <= 2) {
			// If 2 or fewer items, just keep them visible without scrolling
			setVisibleIndex(0);
			return;
		}

		const interval = setInterval(() => {
			// Move by 2 items each time, but ensure we don't go beyond available items
			const maxIndex = Math.max(0, newsItems.length - 2);
			setVisibleIndex((prev) => {
				const next = prev + 2;
				return next > maxIndex ? 0 : next;
			});
		}, 4000); // Change items every 4 seconds

		return () => clearInterval(interval);
	}, [newsItems.length]);

	/**
	 * Format date for display
	 */
	const formatDate = (timestamp: any): string => {
		if (!timestamp) return "";

		let date: Date;
		if (timestamp.toDate) {
			date = timestamp.toDate();
		} else if (timestamp.seconds) {
			date = new Date(timestamp.seconds * 1000);
		} else {
			date = new Date(timestamp);
		}

		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		// Relative time for recent transactions
		if (diffMins < 1) return "Just now";
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;

		// Absolute date for older transactions
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
		}).format(date);
	};

	/**
	 * Format currency
	 */
	const formatCurrency = (amount: number): string => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 2,
		}).format(amount);
	};

	/**
	 * Get transaction icon based on type
	 */
	const getTransactionIcon = (type: string) => {
		switch (type) {
			case "signup":
				return <Award className="h-4 w-4 text-blue-600" />;
			case "purchase":
				return <ShoppingCart className="h-4 w-4 text-green-600" />;
			case "click":
				return <MousePointer className="h-4 w-4 text-orange-500" />;
			case "download":
				return <Download className="h-4 w-4 text-indigo-500" />;
			default:
				return <TrendingUp className="h-4 w-4 text-purple-600" />;
		}
	};

	/**
	 * Get transaction badge based on type
	 */
	const getTransactionBadge = (type: string) => {
		switch (type) {
			case "signup":
				return (
					<Badge
						variant="outline"
						className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
					>
						Sign-up
					</Badge>
				);
			case "purchase":
				return (
					<Badge
						variant="outline"
						className="bg-green-50 text-green-700 border-green-200 text-xs"
					>
						Purchase
					</Badge>
				);
			case "click":
				return (
					<Badge
						variant="outline"
						className="bg-orange-50 text-orange-700 border-orange-200 text-xs"
					>
						Link Click
					</Badge>
				);
			case "download":
				return (
					<Badge
						variant="outline"
						className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs"
					>
						Download
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" className="text-xs">
						{type}
					</Badge>
				);
		}
	};

	// Helper to format device type friendly name
	const formatDeviceType = (type?: string) => {
		if (!type || type === "unknown") return "Unknown Device";
		return type.charAt(0).toUpperCase() + type.slice(1);
	};

	if (loading) {
		return (
			<Card className="bg-white border-gray-200 shadow-sm">
				<CardHeader className="border-b border-gray-100 px-4 py-3">
					<CardTitle className="flex items-center gap-2 text-gray-900 text-sm">
						<Bell className="h-4 w-4" />
						<span>Latest Updates</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-4">
					<div className="animate-pulse space-y-3">
						{[1, 2].map((i) => (
							<div key={i} className="flex items-center gap-3">
								<div className="h-8 w-8 bg-muted rounded-full" />
								<div className="flex-1 space-y-2">
									<div className="h-3 w-3/4 bg-muted rounded" />
									<div className="h-2 w-1/2 bg-muted rounded" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (newsItems.length === 0) {
		return (
			<Card className="bg-white border-gray-200 shadow-sm">
				<CardHeader className="border-b border-gray-100 px-4 py-3">
					<CardTitle className="flex items-center gap-2 text-gray-900 text-sm">
						<Bell className="h-4 w-4" />
						<span>Latest Updates</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-4">
					<div className="text-center py-4">
						<Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
						<p className="text-sm text-muted-foreground">
							Your updates will appear here as they happen
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
			<CardHeader className="border-b border-gray-100 px-4 py-3">
				<CardTitle className="flex items-center gap-2 text-gray-900 text-sm">
					<Bell className="h-4 w-4" />
					<span>Latest Updates</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				{/* Sliding news container - showing 2 items at a time */}
				<div ref={scrollContainerRef} className="relative h-40 overflow-hidden">
					<div
						className="absolute inset-0 transition-transform duration-500 ease-in-out"
						style={{ transform: `translateY(-${visibleIndex * 50}%)` }}
					>
						{newsItems.map((item, index) => (
							<div
								key={`${item.id}-${index}`}
								className="h-20 flex items-center px-4 border-b border-gray-100 last:border-b-0"
							>
								<div className="flex items-start gap-3 w-full">
									{/* Icon */}
									<div className="flex-shrink-0 mt-1">
										<div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
											{getTransactionIcon(item.type)}
										</div>
									</div>

									{/* Content */}
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-2 mb-1">
											<p className="text-sm font-medium leading-tight truncate">
												{item.description}
											</p>
											{getTransactionBadge(item.type)}
										</div>

										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<span className="truncate max-w-[80px]">
												{item.refereeName || formatDeviceType(item.deviceType)}
											</span>
											<span>•</span>
											<span>{formatDate(item.createdAt)}</span>
											{item.amount && (
												<>
													<span>•</span>
													<span className="font-medium text-green-600">
														{formatCurrency(item.amount)}
													</span>
												</>
											)}
										</div>
									</div>

									{/* Points (Only show if > 0) */}
									{item.points > 0 ? (
										<div className="flex-shrink-0 text-right">
											<div className="text-base font-bold text-green-600">
												+{item.points}
											</div>
											<div className="text-xs text-muted-foreground">pts</div>
										</div>
									) : (
										<div className="flex-shrink-0 text-right w-[40px]">
											{/* Placeholder space for alignment or maybe just a dash */}
											{/* Leaving blank for cleaner look on non-point events */}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
