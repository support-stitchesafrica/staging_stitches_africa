"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { useDateRange } from "@/contexts/DateRangeContext";
import { ChartCard } from "@/components/analytics/ChartCard";
import {
	getTopSearchTerms,
	type SearchTermData,
} from "@/services/searchAnalytics";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TopSearchedPage = () => {
	const router = useRouter();
	const { dateRange, setDateRange, setComparisonEnabled } = useDateRange();
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [topSearches, setTopSearches] = useState<SearchTermData[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchSearches = async () => {
			setLoading(true);
			try {
				// Fetch all search terms (use a large limit like 1000)
				const searches = await getTopSearchTerms(
					1000,
					dateRange.start,
					dateRange.end
				);
				setTopSearches(searches);
			} catch (error) {
				console.error("Error fetching top search terms:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchSearches();
	}, [dateRange]);

	const handleLogout = () => {
		router.push("/atlas/auth");
	};

	return (
		<div className="space-y-6 page-transition">
			<AnalyticsHeader
				title="Top Searched Items"
				subtitle="All search terms sorted by search count"
				dateRange={dateRange}
				onDateRangeClick={() => setShowDatePicker(!showDatePicker)}
				onLogout={handleLogout}
			/>

			<div className="flex items-center gap-4">
				<Button
					variant="outline"
					size="sm"
					onClick={() => router.push("/atlas")}
					className="flex items-center gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Dashboard
				</Button>
			</div>

			{showDatePicker && (
				<div className="flex justify-end">
					<DateRangePicker
						value={dateRange}
						onChange={(range) => {
							setDateRange(range);
							setShowDatePicker(false);
						}}
						showComparison={true}
						onComparisonToggle={setComparisonEnabled}
					/>
				</div>
			)}

			<ChartCard title={`All Searched Items (${topSearches.length})`}>
				<div className="space-y-2 max-h-[600px] overflow-y-auto">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
							<span className="ml-2 text-muted-foreground">
								Loading searches...
							</span>
						</div>
					) : topSearches.length === 0 ? (
						<div className="flex items-center justify-center py-12">
							<p className="text-muted-foreground">No search data yet</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b">
										<th className="text-left p-3 text-sm font-semibold text-ga-primary">
											#
										</th>
										<th className="text-left p-3 text-sm font-semibold text-ga-primary">
											Search Term
										</th>
										<th className="text-left p-3 text-sm font-semibold text-ga-primary hidden md:table-cell">
											Category
										</th>
										<th className="text-left p-3 text-sm font-semibold text-ga-primary hidden lg:table-cell">
											Avg. Results
										</th>
										<th className="text-right p-3 text-sm font-semibold text-ga-primary">
											Search Count
										</th>
									</tr>
								</thead>
								<tbody>
									{topSearches.map((item, index) => (
										<tr
											key={item.normalized_term}
											className={`
                        border-b transition-colors hover:bg-ga-surface
                        ${index % 2 === 0 ? "bg-ga-background" : "bg-ga-surface/50"}
                      `}
										>
											<td className="p-3 text-sm text-ga-secondary font-medium">
												{index + 1}
											</td>
											<td className="p-3">
												<div className="flex-1 min-w-0">
													<span className="text-sm font-medium text-ga-primary block truncate">
														{item.search_term}
													</span>
													{item.category && (
														<span className="text-xs text-muted-foreground md:hidden">
															{item.category}
														</span>
													)}
												</div>
											</td>
											<td className="p-3 text-sm text-ga-secondary hidden md:table-cell">
												{item.category || "N/A"}
											</td>
											<td className="p-3 text-sm text-ga-secondary hidden lg:table-cell">
												{item.avg_results > 0
													? item.avg_results.toFixed(1)
													: "N/A"}
											</td>
											<td className="p-3 text-sm text-ga-secondary font-semibold text-right">
												{item.search_count.toLocaleString()}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</ChartCard>
		</div>
	);
};

export default TopSearchedPage;

