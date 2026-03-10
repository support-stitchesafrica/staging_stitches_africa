"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { useDateRange } from "@/contexts/DateRangeContext";
import { ChartCard } from "@/components/analytics/ChartCard";
import { getTopCartProducts } from "@/services/cartAnalytics";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartProduct {
	product_id: string;
	title: string;
	count: number;
	total_value: number;
}

const PopularCartItemsPage = () => {
	const router = useRouter();
	const { dateRange, setDateRange, setComparisonEnabled } = useDateRange();
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [topCartItems, setTopCartItems] = useState<CartProduct[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCartItems = async () => {
			setLoading(true);
			try {
				// Fetch all cart items (use a large limit like 1000)
				const items = await getTopCartProducts(1000);
				setTopCartItems(items);
			} catch (error) {
				console.error("Error fetching top cart products:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchCartItems();
	}, []);

	const handleLogout = () => {
		router.push("/atlas/auth");
	};

	return (
		<div className="space-y-6 page-transition">
			<AnalyticsHeader
				title="Popular Cart Items"
				subtitle="All products sorted by cart count"
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

			<ChartCard title={`All Popular Cart Items (${topCartItems.length})`}>
				<div className="space-y-2 max-h-[600px] overflow-y-auto">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
							<span className="ml-2 text-muted-foreground">
								Loading cart items...
							</span>
						</div>
					) : topCartItems.length === 0 ? (
						<div className="flex items-center justify-center py-12">
							<p className="text-muted-foreground">No cart items yet</p>
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
											Product Title
										</th>
										<th className="text-right p-3 text-sm font-semibold text-ga-primary hidden md:table-cell">
											Total Value
										</th>
										<th className="text-right p-3 text-sm font-semibold text-ga-primary">
											Cart Count
										</th>
									</tr>
								</thead>
								<tbody>
									{topCartItems.map((item, index) => (
										<tr
											key={item.product_id}
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
														{item.title}
													</span>
													<span className="text-xs text-muted-foreground md:hidden">
														${item.total_value.toFixed(2)} total value
													</span>
												</div>
											</td>
											<td className="p-3 text-sm text-ga-secondary font-semibold text-right hidden md:table-cell">
												${item.total_value.toFixed(2)}
											</td>
											<td className="p-3 text-sm text-ga-secondary font-semibold text-right">
												{item.count} {item.count === 1 ? "cart" : "carts"}
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

export default PopularCartItemsPage;

